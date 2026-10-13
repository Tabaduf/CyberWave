import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css"; // înainte era "./index.css", fișier șters la Pasul 5

// Găsește <div id="root"> din index.html și desenează acolo componenta App.
// StrictMode semnalează, doar în dezvoltare, greșelile frecvente.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);