import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function Product() {
  const { slug } = useParams();
  const [selectedSize, setSelectedSize] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  const { getBySlug, loading, products } = useProducts();
  const product = getBySlug(slug);

  const { addToCart } = useCart();

  // Reset selection + gallery when navigating to a different product.
  useEffect(() => {
    setSelectedSize(null);
    setImageIndex(0);
  }, [slug]);

  // A few random other products to recommend (stable per product).
  const recommendations = useMemo(() => {
    const others = products.filter((p) => p.slug !== slug);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [products, slug]);

  if (!product) {
    return (
      <main className="product-page" style={{ padding: "60px 20px" }}>
        <h1>{loading ? "Loading…" : "Product Not Found"}</h1>
      </main>
    );
  }

  const images = product.images || [];
  const current = Math.min(imageIndex, Math.max(0, images.length - 1));
  const prevImage = () =>
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);

  return (
    <>
      <div className="product-back">
        <BackButton />
      </div>

      <main className="product-page">
        {/* One image at a time, with arrows */}
        <div className="product-gallery">
          <div className="gallery-viewport">
            {images.length > 0 && <img src={images[current]} alt={product.name} />}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-arrow gallery-prev"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gallery-arrow gallery-next"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <>
              <div className="gallery-dots">
                {images.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={i === current ? "gallery-dot active" : "gallery-dot"}
                    onClick={() => setImageIndex(i)}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
              <p className="gallery-count">
                {current + 1} / {images.length}
              </p>
            </>
          )}
        </div>

        <p className="product-category">{product.category}</p>

        <h1>{product.name}</h1>

        <p className="product-price">₹{product.price}</p>

        <p className="product-description">{product.description}</p>

        <div className="size-grid">
          {product.sizes.map((size) => (
            <button
              key={size.size}
              className={selectedSize === size.size ? "size-btn active" : "size-btn"}
              onClick={() => setSelectedSize(size.size)}
            >
              {size.size}
            </button>
          ))}
        </div>

        <p>{product.description}</p>

        <button
          onClick={() => {
            if (!selectedSize) {
              alert("Please select a size");
              return;
            }

            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
              size: selectedSize,
              quantity: 1,
            });

            alert("Added to cart");
          }}
        >
          Add To Cart
        </button>
      </main>

      {recommendations.length > 0 && (
        <section className="recommend shell">
          <h2 className="recommend-title">You may also like</h2>
          <div className="recommend-grid">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
