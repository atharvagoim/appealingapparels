import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import styles from "./Wishlist.module.css";
import BackButton from "../components/BackButton";

export default function Wishlist() {
  const { wishlist, clearWishlist } = useWishlist();
  const { cart } = useCart();
  const count = wishlist.length;
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <BackButton />
          <h1 className={styles.title}>Your wishlist</h1>
        </div>

        {count > 0 && (
          <div className={styles.metaRow}>
            <p className={styles.subCount}>
              {count} {count === 1 ? "piece" : "pieces"} saved
            </p>
            <button type="button" className={styles.clear} onClick={clearWishlist}>
              Clear all
            </button>
          </div>
        )}

        {count > 0 ? (
          <div className={styles.grid}>
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nothing saved yet.</p>
            <p className={styles.emptyBody}>
              Tap the heart on any piece to keep it here for later.
            </p>
            <Link to="/shop" className={styles.emptyBtn}>
              Browse the collection
            </Link>
          </div>
        )}

        {count > 0 && (
          <div className={styles.cartBtnWrap}>
            <Link to="/cart" className={styles.cartBtn}>
              Go to cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
