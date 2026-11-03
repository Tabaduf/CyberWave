/* ============================================================
   CYBERWAVE // api.js
   Toate cererile HTTP ale aplicației stau AICI; componentele nu
   apelează niciodată fetch direct. Când în Etapa 9 serverul se
   schimbă, se modifică doar adresa de mai jos.

   Resursele din db.json (servite de json-server):
     /piese        - coada principală
     /sugestii     - piesele din panoul RANDOM
     /playlisturi  - playlisturile, cu id-urile pieselor lor
   ============================================================ */

/* Adresa serverului vine din variabila de mediu VITE_API_URL
   (fișierul .env). ?? = "dacă lipsește, folosește valoarea din dreapta". */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/* Cererea comună: GET pe o rută și răspunsul ca JSON.
   fetch NU aruncă eroare la 404 sau 500 (aruncă doar când nu ajunge
   deloc la server), de aceea verificăm noi res.ok la fiecare cerere. */
async function cere(ruta) {
  const res = await fetch(`${API_URL}/${ruta}`);
  if (!res.ok) {
    throw new Error(`Eroare server: ${res.status} la /${ruta}`);
  }
  return res.json();
}

/* Câte o funcție pentru fiecare resursă (fetchTasks din ghid, pe tema proprie) */
export function fetchPiese() {
  return cere("piese");
}

export function fetchSugestii() {
  return cere("sugestii");
}

export function fetchPlaylisturi() {
  return cere("playlisturi");
}
