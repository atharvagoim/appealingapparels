import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styles from "./QuickView.module.css";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { totalStock, variantStock } from "../context/ProductsContext";

const formatPrice = (value) =>
  typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value;

/** Standard body measurements (inches) — shown when no custom chart image is set. */
const SIZE_CHART = [
  { size: "XS", bust: "32", waist: "26", hips: "35" },
  { size: "S", bust: "34", waist: "28", hips: "37" },
  { size: "M", bust: "36", waist: "30", hips: "39" },
  { size: "L", bust: "38", waist: "32", hips: "41" },
  { size: "XL", bust: "40", waist: "34", hips: "43" },
  { size: "XXL", bust: "42", waist: "36", hips: "45" },
];

/** Tracks whether we're at laptop width, so the popup can switch layouts. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1000
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1000px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

/**
 * Quick view: a bottom-sheet popup on phone (swipeable row of ~2.5 photos),
 * a centred dialog on laptop (single large photo + dots, quantity stepper).
 * Both show name, price, size picker (with a size chart), and let you add
 * to cart or jump to the full product page without leaving the grid.
 */
export default function QuickView({ product, onClose, initialColor }) {
  const { addToCart } = useCart();
  const { sizeChartImage } = useSettings();
  const isDesktop = useIsDesktop();

  // Colourways, opening on whichever is primary — the one the card shows.
  const colors = product.colors || [];
  const hasColors = colors.length > 0;
  const [selectedColor, setSelectedColor] = useState(
    () =>
      initialColor || (colors.find((c) => c.primary) || colors[0])?.name || null
  );
  const activeColor = hasColors
    ? colors.find((c) => c.name === selectedColor) || colors[0]
    : null;

  const images = activeColor?.images?.length
    ? activeColor.images
    : product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const sized = product.hasSizes !== false;
  const allSizes = sized
    ? (activeColor ? activeColor.sizes : product.sizes) || []
    : [];
  const inStockSizes = allSizes.filter((s) => (s.stock ?? 0) > 0);

  // Sold-out is judged on the chosen colour, not the product as a whole.
  const soldOut = hasColors
    ? variantStock(product, activeColor?.name) === 0
    : totalStock(product) === 0;
  const to = `/product/${product.slug}`;

  const [selectedSize, setSelectedSize] = useState(
    inStockSizes.length === 1 ? inStockSizes[0].size : null
  );
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setActiveSlide(0);
  }, [selectedColor]);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const dTrackRef = useRef(null);
  const dRafId = useRef(null);

  // Which photo is centred while sliding — throttled to one check per frame
  // (scroll fires far more often than the screen repaints).
  const onDesktopScroll = () => {
    if (dRafId.current != null) return;
    dRafId.current = requestAnimationFrame(() => {
      dRafId.current = null;
      const el = dTrackRef.current;
      if (!el || !el.clientWidth) return;
      setActiveSlide(Math.round(el.scrollLeft / el.clientWidth));
    });
  };
  useEffect(
    () => () => {
      if (dRafId.current != null) cancelAnimationFrame(dRafId.current);
    },
    []
  );
  const goToSlide = (i) => {
    const el = dTrackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const hasDiscount =
    typeof product.compareAtPrice === "number" && product.compareAtPrice > product.price;
  const percentOff = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  // Lock the page behind the sheet while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showSizeChart) setShowSizeChart(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, showSizeChart]);

  const handleAdd = () => {
    if (sized && !selectedSize) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      size: sized ? selectedSize : null,
      color: activeColor?.name || null,
      quantity,
    });
    setAdded(true);
    setTimeout(onClose, 700);
  };

  const sizeChart = showSizeChart && (
    <div
      className={styles.chartOverlay}
      onClick={(e) => {
        e.stopPropagation();
        setShowSizeChart(false);
      }}
    >
      <div
        className={styles.chartCard}
        role="dialog"
        aria-modal="true"
        aria-label="Size chart"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.chartHead}>
          <h2>Size chart</h2>
          <button
            type="button"
            className={styles.chartClose}
            onClick={() => setShowSizeChart(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {sizeChartImage ? (
          <img className={styles.chartImage} src={sizeChartImage} alt="Size chart" />
        ) : (
          <>
            <table className={styles.chartTable}>
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
            <p className={styles.chartNote}>
              Measurements are body measurements in inches. If you're between
              sizes, we suggest going a size up.
            </p>
          </>
        )}
      </div>
    </div>
  );

  const priceBlock = (
    <div className={styles.priceRow}>
      <span className={hasDiscount ? styles.salePrice : styles.price}>
        {formatPrice(product.price)}
      </span>
      {hasDiscount && (
        <>
          <span className={styles.original}>{formatPrice(product.compareAtPrice)}</span>
          <span className={styles.percent}>{percentOff}% Off</span>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------- laptop
  if (isDesktop) {
    return createPortal(
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.dCard}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className={styles.dClose} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>

          <div className={styles.dImageCol}>
            <div className={styles.dImageFrame} ref={dTrackRef} onScroll={onDesktopScroll}>
              {images.map((src, i) => (
                <div className={styles.dSlide} key={i}>
                  <img
                    src={src}
                    alt={i === 0 ? product.name : ""}
                    draggable="false"
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className={styles.dDots}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={i === activeSlide ? `${styles.dDot} ${styles.dDotOn}` : styles.dDot}
                    onClick={() => goToSlide(i)}
                    aria-label={`Show photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.dBody}>
            <h3 className={styles.dName}>{product.name}</h3>
            {priceBlock}

            {hasColors && (
              <>
                <div className={styles.dSizeHead}>
                  <span className={styles.dSizeLabel}>
                    Colour: <strong>{activeColor?.name}</strong>
                  </span>
                </div>
                <div className={styles.qvColourRow} role="group" aria-label="Choose a colour">
                  {colors.map((c) => {
                    const out = variantStock(product, c.name) === 0;
                    const on = c.name === activeColor?.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className={`${styles.qvColour} ${on ? styles.qvColourOn : ""} ${
                          out ? styles.qvColourOut : ""
                        }`}
                        onClick={() => setSelectedColor(c.name)}
                        aria-pressed={on}
                        title={out ? `${c.name} — sold out` : c.name}
                      >
                        {c.images?.[0] ? (
                          <img src={c.images[0]} alt="" />
                        ) : (
                          <span
                            className={styles.qvSwatch}
                            style={{ background: c.swatch || "#111" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {soldOut ? (
              <p className={styles.soldOut}>
                {hasColors ? `${activeColor?.name} is out of stock` : "Out of stock"}
              </p>
            ) : (
              <>
                {allSizes.length > 0 && (
                <>
                <div className={styles.dSizeHead}>
                  <span className={styles.dSizeLabel}>Size:</span>
                  <button
                    type="button"
                    className={styles.sizeChartLink}
                    onClick={() => setShowSizeChart(true)}
                  >
                    Size chart
                  </button>
                </div>
                <div className={styles.dSizeRow} role="group" aria-label="Choose a size">
                  {allSizes.map((s) => {
                    const disabled = (s.stock ?? 0) === 0;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        disabled={disabled}
                        className={`${styles.dSizeChip} ${
                          selectedSize === s.size ? styles.dSizeChipOn : ""
                        } ${disabled ? styles.dSizeChipOff : ""}`}
                        onClick={() => setSelectedSize(s.size)}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
                </>
                )}

                <div className={styles.dQtyRow}>
                  <button
                    type="button"
                    className={styles.dQtyBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.dQtyValue}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.dQtyBtn}
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.dAddBtn}
                  onClick={handleAdd}
                  disabled={sized && !selectedSize}
                >
                  {added ? "Added ✓" : "Add to cart"}
                </button>
              </>
            )}

            <Link to={to} className={styles.dViewDetails} onClick={onClose}>
              View details
            </Link>
          </div>
        </div>

        {sizeChart}
      </div>,
      document.body
    );
  }

  // ----------------------------------------------------------------- phone
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheetWrap} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
        >
          <div className={styles.gallery}>
            <div className={styles.track}>
              {images.map((src, i) => (
                <div className={styles.slide} key={i}>
                  <img
                    src={src}
                    alt={i === 0 ? product.name : ""}
                    draggable="false"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.body}>
            <p className={styles.name}>{product.name}</p>
            {priceBlock}

            {hasColors && (
              <>
                <div className={styles.sizeHead}>
                  <span className={styles.sizeHeadLabel}>
                    Colour: <strong>{activeColor?.name}</strong>
                  </span>
                </div>
                <div className={styles.qvColourRow} role="group" aria-label="Choose a colour">
                  {colors.map((c) => {
                    const out = variantStock(product, c.name) === 0;
                    const on = c.name === activeColor?.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className={`${styles.qvColour} ${on ? styles.qvColourOn : ""} ${
                          out ? styles.qvColourOut : ""
                        }`}
                        onClick={() => setSelectedColor(c.name)}
                        aria-pressed={on}
                        title={out ? `${c.name} — sold out` : c.name}
                      >
                        {c.images?.[0] ? (
                          <img src={c.images[0]} alt="" />
                        ) : (
                          <span
                            className={styles.qvSwatch}
                            style={{ background: c.swatch || "#111" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {soldOut ? (
              <p className={styles.soldOut}>
                {hasColors ? `${activeColor?.name} is out of stock` : "Out of stock"}
              </p>
            ) : (
              <>
                {allSizes.length > 0 && (
                <>
                <div className={styles.sizeHead}>
                  <span className={styles.sizeHeadLabel}>Size</span>
                  <button
                    type="button"
                    className={styles.sizeChartLink}
                    onClick={() => setShowSizeChart(true)}
                  >
                    Size chart
                  </button>
                </div>
                <div className={styles.sizeRow} role="group" aria-label="Choose a size">
                  {allSizes.map((s) => {
                    const disabled = (s.stock ?? 0) === 0;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        disabled={disabled}
                        className={`${styles.sizeChip} ${
                          selectedSize === s.size ? styles.sizeChipOn : ""
                        } ${disabled ? styles.sizeChipOff : ""}`}
                        onClick={() => setSelectedSize(s.size)}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
                </>
                )}
              </>
            )}

            <Link to={to} className={styles.detailsLink} onClick={onClose}>
              View details
            </Link>
            {!soldOut && (
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAdd}
                disabled={sized && !selectedSize}
              >
                {added
                  ? "Added ✓"
                  : !sized || selectedSize
                  ? "Add to cart"
                  : "Select a size"}
              </button>
            )}
          </div>
        </div>
      </div>

      {sizeChart}
    </div>,
    document.body
  );
}
