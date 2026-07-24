import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  useProducts,
  totalStock,
  hasColors,
  isSized,
  sizesOf,
  imagesOf,
  variantStock,
  primaryColor,
} from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import CouponBanners from "../components/CouponBanners";
import ProductReviews from "../components/ProductReviews";
import ShareMenu from "../components/ShareMenu";
import useSwipe from "../hooks/useSwipe";

/** Shown when a product has no custom list saved. */
const DEFAULT_HIGHLIGHTS = [
  "Kurtis made with 100% pure cotton",
  "Breathable, skin-friendly fabric for all-day comfort",
  "Comfortable, easy-to-move fit",
  "Minimal silhouette for versatile styling",
  "Suitable for college, office & daily outings",
];

const DEFAULT_FABRIC_CARE = [
  "100% pure cotton",
  "Soft, breathable & lightweight",
  "Gentle machine wash",
  "Do not bleach",
  "Dry in shade",
];

/** Standard body measurements (inches). */
const SIZE_CHART = [
  { size: "XS", bust: "32", waist: "26", hips: "35" },
  { size: "S", bust: "34", waist: "28", hips: "37" },
  { size: "M", bust: "36", waist: "30", hips: "39" },
  { size: "L", bust: "38", waist: "32", hips: "41" },
  { size: "XL", bust: "40", waist: "34", hips: "43" },
  { size: "XXL", bust: "42", waist: "36", hips: "45" },
];

export default function Product() {
  const { slug } = useParams();
  // The shop grid links straight to a colourway, e.g. ?color=Navy%20Blue.
  const [searchParams] = useSearchParams();
  const colorParam = searchParams.get("color");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  // When the gallery wraps last→first or first→last, we skip the CSS
  // transition for that one jump so it doesn't visibly slide backward
  // through every photo — it just cuts straight to the wrapped slide.
  const [galleryJump, setGalleryJump] = useState(false);

  const { getBySlug, loading, products } = useProducts();
  const product = getBySlug(slug);

  const { addToCart, cart } = useCart();
  const { sizeChartImage } = useSettings();
  const { isSaved, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [hiOpen, setHiOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Reset selection + gallery when navigating to a different product.
  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(colorParam || null);
    setImageIndex(0);
  }, [slug, colorParam]);

  // A colourway has its own photos and its own sizes, so both reset with it.
  useEffect(() => {
    setSelectedSize(null);
    setImageIndex(0);
  }, [selectedColor]);

  // A few random other products to recommend (stable per product).
  const recommendations = useMemo(() => {
    const others = products.filter((p) => p.slug !== slug);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [products, slug]);

  // Gallery state lives above the "not found" early return so hooks always
  // run in the same order, whether or not the product has loaded yet.
  // The gallery follows the chosen colourway.
  const colors = product?.colors || [];
  const showColors = hasColors(product);
  const activeColor = showColors
    ? colors.find((c) => c.name === selectedColor) || primaryColor(product)
    : null;
  const images = product ? imagesOf(product, activeColor?.name) : [];

  const sized = isSized(product);
  const sizeRows = product ? sizesOf(product, activeColor?.name) : [];
  const showSizes = sized && sizeRows.length > 0;
  const current = images.length
    ? Math.min(imageIndex, Math.max(0, images.length - 1))
    : 0;
  const prevImage = () =>
    setImageIndex((i) => {
      if (!images.length) return i;
      const next = (i - 1 + images.length) % images.length;
      if (i === 0 && next === images.length - 1) setGalleryJump(true);
      return next;
    });
  const nextImage = () =>
    setImageIndex((i) => {
      if (!images.length) return i;
      const next = (i + 1) % images.length;
      if (i === images.length - 1 && next === 0) setGalleryJump(true);
      return next;
    });
  const gallerySwipe = useSwipe({ onNext: nextImage, onPrev: prevImage });
  // On laptop the photos stack vertically and scroll; clicking a thumbnail
  // scrolls that photo into view. On phone this is a harmless no-op since
  // the viewport isn't a vertical scroll container there.
  const slideRefs = useRef([]);
  const scrollToImage = (i) => {
    setImageIndex(i);
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Paint the instant jump first, then re-enable the transition on the next
  // frame so ordinary (non-wrapping) navigation keeps sliding smoothly.
  useEffect(() => {
    if (!galleryJump) return;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setGalleryJump(false));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [galleryJump]);

  // Quantity resets whenever the size changes, since stock is per size.
  useEffect(() => {
    setQty(1);
  }, [selectedSize]);

  // Bail out only after every hook has run — React requires the same hooks in
  // the same order on every render.
  if (!product) {
    return (
      <main className="product-page" style={{ padding: "60px 20px" }}>
        <h1>{loading ? "Loading…" : "Product Not Found"}</h1>
      </main>
    );
  }

  const addCurrentToCart = () => {
    if (showSizes) {
      // No size picked yet — the buttons are disabled, so this is a guard.
      if (!selectedSize) return false;
      const row = sizeRows.find((s) => s.size === selectedSize);
      if (!row || (row.stock ?? 0) === 0) return false;
    } else if (stockOnHand === 0) {
      return false;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      size: showSizes ? selectedSize : null,
      color: activeColor?.name || null,
      quantity: qty,
    });
    return true;
  };

  // Once this product + size is in the bag, the button becomes "Go to cart".
  const inCart = cart.some(
    (i) =>
      i.id === product?.id &&
      (i.size ?? null) === (showSizes ? selectedSize : null) &&
      (i.color ?? null) === (activeColor?.name || null)
  );

  // Stock for what's actually selected, not the product as a whole. Declared
  // before anything that reads it — `needsSize` below depends on it.
  const stockOnHand = product
    ? showColors
      ? variantStock(product, activeColor?.name)
      : totalStock(product)
    : 0;

  // Nothing can be bought until a size is chosen.
  const needsSize = showSizes && stockOnHand > 0 && !selectedSize;

  const saved = product ? isSaved(product.id) : false;
  const onSale = Boolean(
    product?.compareAtPrice && product.compareAtPrice > product.price
  );

  // Quantity can't run past what's actually on the shelf.
  const selectedRow = sizeRows.find((s) => s.size === selectedSize);
  const maxQty = Math.max(
    1,
    Math.min(10, showSizes ? selectedRow?.stock ?? 10 : stockOnHand || 10)
  );

  // Garment measurements for the chosen size, when they've been filled in.
  const measures = [
    { label: "Chest", value: selectedRow?.chest },
    { label: "Length", value: selectedRow?.length },
  ]
    .filter((m) => Number(m.value) > 0)
    .map((m) => ({ label: m.label, value: `${m.value} inches` }));

  const highlights =
    product?.highlights?.length ? product.highlights : DEFAULT_HIGHLIGHTS;
  const fabricCare =
    product?.fabricCare?.length ? product.fabricCare : DEFAULT_FABRIC_CARE;

  // A product can sit in several categories — show them all as tags.
  const productTags =
    Array.isArray(product?.categories) && product.categories.length
      ? product.categories
      : product?.category
      ? [product.category]
      : [];

  return (
    <>
      <main className="product-page">
        {/* Laptop: all photos stacked, scroll to browse. Phone: swipe. */}
        <div className="product-gallery">
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  className={
                    i === current ? "gallery-thumb active" : "gallery-thumb"
                  }
                  onClick={() => scrollToImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" draggable="false" />
                </button>
              ))}
            </div>
          )}

          <div className="gallery-viewport" {...gallerySwipe.handlers}>
            <div
              className="gallery-track"
              style={{
                transform: `translateX(calc(-${current * 100}% + ${gallerySwipe.dragPx}px))`,
                transition: gallerySwipe.dragPx || galleryJump ? "none" : undefined,
              }}
            >
              {images.map((src, i) => (
                <div
                  className="gallery-slide"
                  key={i}
                  ref={(el) => (slideRefs.current[i] = el)}
                >
                  <img src={src} alt={i === current ? product.name : ""} draggable="false" />
                </div>
              ))}
            </div>

            {images.length > 1 && (
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
            )}
          </div>
        </div>

        <div className="product-head">
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <div className="product-title-actions">
              <button
                type="button"
                className={`pdp-wish ${saved ? "pdp-wish-on" : ""}`}
                onClick={() => toggleWishlist(product)}
                aria-pressed={saved}
                aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                title={saved ? "Saved to wishlist" : "Save to wishlist"}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 22.5l7.1-7.1 1.7-1.7a5 5 0 0 0 0-7.1z" />
                </svg>
              </button>
              <ShareMenu title={product.name} />
            </div>
          </div>

          <div className="product-price-row">
            {onSale && (
              <span className="product-compare">₹{product.compareAtPrice}</span>
            )}
            <span className={onSale ? "product-price product-price-sale" : "product-price"}>
              ₹{product.price}
            </span>
            {onSale && (
              <span className="product-save">
                Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
              </span>
            )}
          </div>

          <p className="product-ship-note">
            <span className="product-ship-link">Shipping</span> calculated at
            checkout.
          </p>
        </div>

        {productTags.length > 0 && (
          <div className="product-tags">
            {productTags.map((tag) => (
              <Link
                key={tag}
                to={`/shop?category=${encodeURIComponent(tag)}`}
                className="product-tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="product-buy">
          {showColors && (
            <div className="colour-block">
              <div className="colour-head">
                <span className="size-label">
                  Colour:{" "}
                  <strong className="size-current">{activeColor?.name}</strong>
                </span>
              </div>
              <div className="colour-grid">
                {colors.map((c) => {
                  const out = variantStock(product, c.name) === 0;
                  const on = c.name === activeColor?.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      className={
                        "colour-btn" +
                        (on ? " colour-btn-on" : "") +
                        (out ? " colour-btn-out" : "")
                      }
                      onClick={() => setSelectedColor(c.name)}
                      aria-pressed={on}
                      aria-label={out ? `${c.name} — sold out` : c.name}
                      title={out ? `${c.name} — sold out` : c.name}
                    >
                      {c.images?.[0] ? (
                        <img src={c.images[0]} alt="" />
                      ) : (
                        <span
                          className="colour-swatch"
                          style={{ background: c.swatch || "#111" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showSizes && (
          <>
          <div className="size-head">
            <div className="size-head-left">
              <span className="size-label">
                Size:{" "}
                <strong className="size-current">{selectedSize || "—"}</strong>
              </span>

              {/* Measurements for the chosen size, when the size chart has them. */}
              {measures.length > 0 && (
                <span className="size-measures">
                  <svg className="size-measures-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 3 4 5.2V9l2.2 1V21h11.6V10L20 9V5.2L16 3a4 4 0 0 1-8 0z" />
                  </svg>
                  {measures.map((m) => (
                    <span className="size-measure" key={m.label}>
                      {m.label} <em>{m.value}</em>
                    </span>
                  ))}
                </span>
              )}
            </div>

            <button
              type="button"
              className="size-chart-link"
              onClick={() => setShowSizeChart(true)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z" />
                <path d="M14.5 5.5 18.5 9.5" />
              </svg>
              Sizing guide
            </button>
          </div>

          <div className="size-grid">
            {sizeRows.map((size) => {
              const soldOut = (size.stock ?? 0) === 0;
              return (
                <button
                  key={size.size}
                  className={
                    (selectedSize === size.size ? "size-btn active" : "size-btn") +
                    (soldOut ? " size-btn-soldout" : "")
                  }
                  disabled={soldOut}
                  title={soldOut ? `${size.size} — sold out` : `Size ${size.size}`}
                  onClick={() => setSelectedSize(size.size)}
                >
                  {size.size}
                </button>
              );
            })}
          </div>

          </>
          )}

          {needsSize && (
            <p className="size-required" role="status">
              Please select a size
            </p>
          )}

          {stockOnHand === 0 ? (
            <button className="pdp-soldout" disabled>
              Sold out
            </button>
          ) : (
            <>
              {/* Quantity sits beside Add to cart; Buy it now takes its own row. */}
              <div className="pdp-cart-row">
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
                    disabled={qty >= maxQty}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {inCart ? (
                  <button className="pdp-add" onClick={() => navigate("/cart")}>
                    Go to cart
                  </button>
                ) : (
                  <button
                    className="pdp-add"
                    onClick={addCurrentToCart}
                    disabled={needsSize}
                    aria-disabled={needsSize}
                  >
                    Add to cart
                  </button>
                )}
              </div>

              <button
                className="pdp-buy"
                disabled={needsSize}
                aria-disabled={needsSize}
                onClick={() => {
                  if (inCart || addCurrentToCart()) navigate("/checkout");
                }}
              >
                Buy it now
              </button>
            </>
          )}
        </div>

        <CouponBanners />

        <div className="product-info">
          <button
            type="button"
            className="acc-head"
            onClick={() => setDescOpen((o) => !o)}
            aria-expanded={descOpen}
          >
            <span>Description</span>
            <svg
              className={descOpen ? "acc-chevron open" : "acc-chevron"}
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {descOpen && (
            <p className="product-description">{product.description}</p>
          )}

          <button
            type="button"
            className="acc-head"
            onClick={() => setHiOpen((o) => !o)}
            aria-expanded={hiOpen}
          >
            <span>Product highlights</span>
            <svg className={hiOpen ? "acc-chevron open" : "acc-chevron"} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {hiOpen && (
            <ul className="acc-list">
              {highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="acc-head"
            onClick={() => setCareOpen((o) => !o)}
            aria-expanded={careOpen}
          >
            <span>Fabric &amp; care</span>
            <svg className={careOpen ? "acc-chevron open" : "acc-chevron"} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {careOpen && (
            <ul className="acc-list">
              {fabricCare.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}

          {product.code && (
            <>
              <button
                type="button"
                className="acc-head"
                onClick={() => setCodeOpen((o) => !o)}
                aria-expanded={codeOpen}
              >
                <span>Product code</span>
                <svg className={codeOpen ? "acc-chevron open" : "acc-chevron"} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {codeOpen && (
                <ul className="acc-list">
                  <li>{product.code}</li>
                </ul>
              )}
            </>
          )}

          {/* Ratings & reviews — sits under the product code, and only
              renders once the product actually has some. */}
          <ProductReviews productId={product.id || product._id} />
        </div>
      </main>

      {showSizeChart && (
        <div className="chart-overlay" onClick={() => setShowSizeChart(false)}>
          <div
            className="chart-card"
            role="dialog"
            aria-modal="true"
            aria-label="Size chart"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chart-head">
              <h2>Size chart</h2>
              <button
                type="button"
                className="chart-close"
                onClick={() => setShowSizeChart(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {sizeChartImage ? (
              <img
                className="chart-image"
                src={sizeChartImage}
                alt="Size chart"
              />
            ) : (
              <>
                <table className="chart-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Bust (in)</th>
                      <th>Waist (in)</th>
                      <th>Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_CHART.map((r) => (
                      <tr key={r.size}>
                        <td>{r.size}</td>
                        <td>{r.bust}</td>
                        <td>{r.waist}</td>
                        <td>{r.hips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="chart-note">
                  Measurements are body measurements in inches. If you're between
                  sizes, we suggest going a size up.
                </p>
              </>
            )}
          </div>
        </div>
      )}

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
