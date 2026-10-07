import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { SettingsProvider } from "./context/SettingsContext";
import { ProductsProvider } from "./context/ProductsContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
              <RouterProvider router={router} />
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
