import { useCart } from "../context/CartContext";
import styles from "./Cart.module.css";
import BackButton from "../components/BackButton";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <main className={styles.page}>
      <BackButton />
        <h1 className={styles.title}>Shopping bag</h1>
        <p className={styles.empty}>Your bag is empty.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <BackButton />
      <h1 className={styles.title}>Shopping bag</h1>

      <div className={styles.items}>
        {cart.map((item) => (
          <div className={styles.item} key={`${item.id}-${item.size}`}>
            <img className={styles.thumb} src={item.image} alt={item.name} />
            <div className={styles.info}>
              <h3 className={styles.name}>{item.name}</h3>
              {item.size && <p className={styles.size}>Size {item.size}</p>}
              <p className={styles.price}>{inr(item.price)} each</p>

              <div className={styles.controls}>
                <div className={styles.qty}>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, -1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  className={styles.remove}
                  onClick={() => removeFromCart(item.id, item.size)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className={styles.lineTotal}>{inr(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{inr(total)}</span>
      </div>
    </main>
  );
}
