/* ============================================================
   CYBERWAVE // pages/NotFoundPage.jsx
   Etapa 8: orice adresă care nu se potrivește cu nicio rută
   (path="*" în App.jsx) ajunge aici, în layout-ul aplicației.
   ============================================================ */

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container">
      <section className="panel" data-testid="not-found">
        <h2>&gt;&gt; ERR_404 // PAGINA NU EXISTĂ</h2>
        <p className="info">[SYS]: ADRESA CERUTĂ NU DUCE NICĂIERI.</p>
        <Link to="/">◂ ÎNAPOI LA PIESE</Link>
      </section>
    </div>
  );
}
