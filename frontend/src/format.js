/* ============================================================
   CYBERWAVE // format.js
   Funcții mici de formatare, folosite de mai multe componente.
   (Etapa 8: formatTimp stătea în Comenzi.jsx, dar un fișier de
   componente trebuie să exporte doar componente, altfel
   Fast Refresh din Vite nu mai funcționează corect.)
   ============================================================ */

/* 75 secunde -> "01:15" (padStart adaugă zero în față) */
export function formatTimp(secunde) {
  const min = Math.floor(secunde / 60);
  const sec = Math.floor(secunde % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
