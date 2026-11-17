import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css"; // Etapa 8: stilurile globale (App.css a devenit index.css)

// Găsește <div id="root"> din index.html și desenează acolo componenta App.
// StrictMode semnalează, doar în dezvoltare, greșelile frecvente.
// BrowserRouter (Etapa 8) leagă aplicația de adresa din browser,
// ca Link, NavLink și useParams să funcționeze.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
