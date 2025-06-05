import React from "react";
import ReactDOM from "react-dom/client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { AdaptorLink } from "./components/AdaptorLink";
import App from "./components/App";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found for booting react app");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppProvider i18n={enTranslations} linkComponent={AdaptorLink}>
      <App />
    </AppProvider>
  </React.StrictMode>
);
