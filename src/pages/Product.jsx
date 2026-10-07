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
  priceOf,
  primaryColor,
} from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import CouponBanners from "../components/CouponBanners";
import DeliveryCheck from "../components/DeliveryCheck.jsx";
import ProductReviews from "../components/ProductReviews";
import ShareMenu from "../components/ShareMenu";
import useSwipe from "../hooks/useSwipe";
import useDocumentMeta from "../hooks/useDocumentMeta";

/** Shown when a product has no custom list saved. */
const DEFAULT_DESCRIPTION =
  "A stylish and functional bag designed for everyday use. Spacious, durable, and perfect for carrying your daily essentials with ease.";

const DEFAULT_HIGHLIGHTS = [
  "Spacious main compartment",
  "Premium quality material",
  "Lightweight & durable",
  "Secure zipper closure",
  "Comfortable to carry",
  "Ideal for daily use",
];

const DEFAULT_FABRIC_CARE = [
  "Premium durable material",
  "Wipe clean with a damp cloth",
  "Do not machine wash",
  "Store in a cool, dry place",
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
  const { isSaved, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
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

  // A few random other products to recommend (stable per product) — seeded
  // off the product's own slug rather than calling Math.random() during
  // render. Math.random() inside useMemo is impure: React doesn't
  // guarantee a memoized callback only ever runs once, so the "random"
  // order could silently change between renders of what's supposed to be
  // the same stable list. Each item's sort key is a pure hash of
  // (slug, index) — nothing here reassigns a shared variable, so it's
  // pure regardless of how many times or in what order it runs.
  const recommendations = useMemo(() => {
    const others = products.filter((p) => p.slug !== slug);
    // A Murmur3-style bit mix — scrambles thoroughly so nearby inputs
    // (adjacent indexes, similar slugs) don't produce nearby outputs.
    const mix = (x) => {
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      return (x ^ (x >>> 16)) >>> 0;
    };
    let base = 0;
    for (let j = 0; j < slug.length; j++) base = (base * 31 + slug.charCodeAt(j)) >>> 0;
    const shuffled = others
      .map((item, i) => [item, mix(base ^ mix(i))])
      .sort((a, b) => a[1] - b[1])
      .map(([item]) => item);
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
  // Price follows the chosen colour when it sets its own, else the base price.
  const price = product ? priceOf(product, activeColor?.name) : 0;

  useDocumentMeta(
    product
      ? `${product.name}${activeColor?.name ? ` — ${activeColor.name}` : ""}`
      : "Product",
    product
      ? `${product.name} — ₹${price}. ${(product.description || "").slice(0, 130)}`.trim()
      : undefined
  );

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
      price,
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
    product?.compareAtPrice && product.compareAtPrice > price
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

  const description =
    product?.description?.trim() ? product.description : DEFAULT_DESCRIPTION;
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
              ₹{price}
            </span>
            {onSale && (
              <span className="product-save">
                Save {Math.round((1 - price / product.compareAtPrice) * 100)}%
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

        <div className="product-delivery">
          <DeliveryCheck />
        </div>

        <div className="product-offers">
          <CouponBanners />
        </div>

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
            <p className="product-description">{description}</p>
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
