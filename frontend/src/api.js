/* ============================================================
   CYBERWAVE // api.js
   Toate cererile HTTP ale aplicației stau AICI; componentele nu
   apelează niciodată fetch direct. Când în Etapa 9 serverul se
   schimbă, se modifică doar adresa de mai jos.

   Resursele din db.json (servite de json-server):
     /piese        - coada principală (aici adaugă formularul)
     /sugestii     - piesele din panoul RANDOM
     /playlisturi  - playlisturile, cu id-urile pieselor lor

   Metodele HTTP (Etapa 7):
     GET    /piese      - citirea listei
     GET    /piese/3    - o singură piesă (Etapa 8, pagina de detaliu)
     POST   /piese      - adăugarea (fără id; id-ul îl dă serverul)
     PATCH  /piese/3    - modificarea doar a câmpurilor trimise
     DELETE /piese/3    - ștergerea
   ============================================================ */

/* Adresa serverului vine din variabila de mediu VITE_API_URL
   (fișierul .env). ?? = "dacă lipsește, folosește valoarea din dreapta". */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/* Funcția comună: singurul loc cu fetch.
   - ...options copiază ce primește (metoda, corpul cererii);
   - antetul spune serverului că trimitem JSON;
   - fetch NU aruncă eroare la 404 sau 500, deci verificăm noi res.ok;
   - 204 No Content nu are corp: res.json() ar da "Unexpected end of JSON input". */
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    throw new Error(`Eroare server: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

/* --- Coada (piese) --- */
export function fetchPiese() {
  return request("/piese");
}

/* Etapa 8: o singură piesă, pentru pagina de detaliu.
   resursa = "piese" (coada) sau "sugestii" (panoul RANDOM).
   Pentru un id inexistent serverul răspunde 404, iar request aruncă eroarea. */
export function fetchPiesa(id, resursa = "piese") {
  return request(`/${resursa}/${id}`);
}

export function createPiesa(piesa) {
  return request("/piese", { method: "POST", body: JSON.stringify(piesa) });
}

export function updatePiesa(id, changes) {
  return request(`/piese/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function deletePiesa(id) {
  return request(`/piese/${id}`, { method: "DELETE" });
}

/* --- Sugestiile (panoul RANDOM): se pot bifa, aprecia și șterge --- */
export function fetchSugestii() {
  return request("/sugestii");
}

export function updateSugestie(id, changes) {
  return request(`/sugestii/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function deleteSugestie(id) {
  return request(`/sugestii/${id}`, { method: "DELETE" });
}

/* --- Playlisturile --- */
export function fetchPlaylisturi() {
  return request("/playlisturi");
}

export function createPlaylist(playlist) {
  return request("/playlisturi", { method: "POST", body: JSON.stringify(playlist) });
}

export function updatePlaylist(id, changes) {
  return request(`/playlisturi/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}