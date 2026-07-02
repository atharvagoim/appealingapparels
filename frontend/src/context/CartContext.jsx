import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem("cart");

  return saved ? JSON.parse(saved) : [];
});
    
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

const addToCart = (item) => {
  setCart((prev) => {
    const existing = prev.find(
      (cartItem) =>
        cartItem.id === item.id &&
        cartItem.size === item.size
    );

    if (existing) {
      return prev.map((cartItem) =>
        cartItem.id === item.id &&
        cartItem.size === item.size
          ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
          : cartItem
      );
    }

    return [...prev, item];
  });
};
  const removeFromCart = (id, size) => {
  setCart((prev) =>
    prev.filter(
      (item) =>
        !(item.id === id && item.size === size)
    )
  );
};

  const updateQuantity = (id, size, change) => {
  setCart((prev) =>
    prev.map((item) => {
      if (
        item.id === id &&
        item.size === size
      ) {
        return {
          ...item,
          quantity: Math.max(
            1,
            item.quantity + change
          ),
        };
      }

      return item;
    })
  );
};

return (
  <CartContext.Provider
    value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
    }}
  >
    {children}
  </CartContext.Provider>
);
}

export const useCart = () =>
  useContext(CartContext);