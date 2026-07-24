import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem("cart");

  return saved ? JSON.parse(saved) : [];
});
    
  /**
   * The coupon lives here rather than on the checkout page, because it's now
   * applied in the shopping bag and has to survive the trip to checkout.
   */
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const raw = localStorage.getItem("appliedCoupon");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

/**
 * A bag line is identified by product + size + colour. Colour is part of the
 * key so Navy M and Black M sit as two lines rather than merging into one.
 * Older saved carts have no colour at all, which compares equal to undefined.
 */
const sameLine = (a, b) =>
  a.id === b.id &&
  (a.size ?? null) === (b.size ?? null) &&
  (a.color ?? null) === (b.color ?? null);

const addToCart = (item) => {
  setCart((prev) => {
    const existing = prev.find((cartItem) => sameLine(cartItem, item));

    if (existing) {
      return prev.map((cartItem) =>
        sameLine(cartItem, item)
          ? {
              ...cartItem,
              quantity: cartItem.quantity + (item.quantity || 1),
            }
          : cartItem
      );
    }

    return [...prev, item];
  });
};

  const removeFromCart = (id, size, color = null) => {
  setCart((prev) =>
    prev.filter((item) => !sameLine(item, { id, size, color }))
  );
};

  const updateQuantity = (id, size, change, color = null) => {
  setCart((prev) =>
    prev.map((item) => {
      if (sameLine(item, { id, size, color })) {
        return {
          ...item,
          quantity: Math.max(1, item.quantity + change),
        };
      }

      return item;
    })
  );
};

const clearCart = () => {
  setCart([]);
  setAppliedCoupon(null);
};

// Change the size of a line. If that size is already in the bag for the same
// product and colour, merge the two lines instead of creating a duplicate.
const updateSize = (id, oldSize, newSize, color = null) => {
  if (oldSize === newSize) return;
  setCart((prev) => {
    const from = { id, size: oldSize, color };
    const to = { id, size: newSize, color };

    const line = prev.find((i) => sameLine(i, from));
    if (!line) return prev;

    if (prev.find((i) => sameLine(i, to))) {
      return prev
        .filter((i) => !sameLine(i, from))
        .map((i) =>
          sameLine(i, to) ? { ...i, quantity: i.quantity + line.quantity } : i
        );
    }

    return prev.map((i) => (sameLine(i, from) ? { ...i, size: newSize } : i));
  });
};

return (
  <CartContext.Provider
    value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateSize,
      clearCart,
      appliedCoupon,
      setAppliedCoupon,
    }}
  >
    {children}
  </CartContext.Provider>
);
}

export const useCart = () =>
  useContext(CartContext);