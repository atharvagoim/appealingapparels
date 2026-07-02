import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import styles from "./Wishlist.module.css";
import BackButton from "../components/BackButton";

export default function Wishlist() {
  const { wishlist, clearWishlist } = useWishlist();
  const count = wishlist.length;

  return (
    <main className={styles.page}>
      <div className="shell" style={{ paddingTop: 8 }}>
        <BackButton />
      </div>
      <header className={`${styles.head} shell`}>
        <p className="eyebrow">Saved</p>
        <h1 className={styles.title}>Your wishlist</h1>

        {count > 0 && (
          <div className={styles.metaRow}>
            <p className={styles.count}>
              {count} {count === 1 ? "piece" : "pieces"}
            </p>
            <button type="button" className={styles.clear} onClick={clearWishlist}>
              Clear all
            </button>
          </div>
        )}
      </header>

      {count > 0 ? (
        <div className={`${styles.grid} shell`}>
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={`${styles.empty} shell`}>
          <p className={styles.emptyTitle}>Nothing saved yet.</p>
          <p className={styles.emptyBody}>
            Tap the heart on any piece to keep it here for later.
          </p>
          <Link to="/shop" className={styles.emptyBtn}>
            Browse the collection
          </Link>
        </div>
      )}
    </main>
  );
}
