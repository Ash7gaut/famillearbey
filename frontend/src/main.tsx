import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
// Capte beforeinstallprompt dès le chargement, avant le montage des composants.
import "./hooks/useInstallPrompt";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);
