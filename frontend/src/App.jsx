/* ============================================================
   CYBERWAVE // App.jsx
   Etapa 8: App rămâne doar cu harta rutelor (React Router).
   Starea și funcțiile din Etapele 5-7 s-au mutat în
   hooks/useCyberwave.js, apelat de Layout; conținutul paginii
   principale e acum în pages/PiesePage.jsx.

   Layout (ruta fără path) înconjoară fiecare pagină: antetul,
   navigația și bara de jos se desenează o singură dată, iar
   pagina potrivită cu adresa apare în locul lui <Outlet />.
   ============================================================ */

import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import PiesePage from "./pages/PiesePage.jsx";
import PiesaDetaliuPage from "./pages/PiesaDetaliuPage.jsx";
import DesprePage from "./pages/DesprePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Ruta de detaliu folosește resursa din tw.json: /piese/:id
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PiesePage />} />
        <Route path="/piese/:id" element={<PiesaDetaliuPage />} />
        <Route path="/despre" element={<DesprePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
