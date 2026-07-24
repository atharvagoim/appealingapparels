import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

/**
 * Shown when a route throws, instead of React Router's developer stack trace.
 *
 * A shopper hitting a bug should see something they can act on, not a minified
 * error and a link to react.dev.
 */
export default function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  // The real error still goes to the console for debugging.
  if (error) console.error("Route error:", error);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "clamp(1.6rem, 6vw, 2.6rem)", margin: 0 }}>
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>

      <p style={{ color: "#757575", maxWidth: "42ch", lineHeight: 1.6 }}>
        {notFound
          ? "That page doesn't exist, or it may have moved."
          : "Sorry — this page didn't load properly. Trying again usually fixes it."}
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        {!notFound && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              minHeight: "50px",
              padding: "0 24px",
              border: "1px solid #0a0a0a",
              borderRadius: "6px",
              background: "#ffffff",
              color: "#0a0a0a",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: "0.86rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        )}

        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "50px",
            padding: "0 24px",
            borderRadius: "6px",
            background: "#0a0a0a",
            color: "#ffffff",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontSize: "0.86rem",
          }}
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
