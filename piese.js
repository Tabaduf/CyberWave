/* ============================================================
   CYBERWAVE // piese.js
   Etapa 2: Logica pe date (JavaScript simplu, fără DOM)

   Fișierul NU modifică pagina: nu folosește `document` și nu
   tratează evenimente. Rezultatele se citesc în consolă (F12).

   Regula de bază: nicio funcție nu modifică lista primită,
   ci întoarce o listă NOUĂ (pregătire pentru React).
   ============================================================ */


/* ------------------------------------------------------------
   DATE DE TEST
   Aceleași trei piese ca în mockup-ul din Etapa 1.
   Câmpuri: id (unic), titlu (text), redata (boolean), format (etichetă fixă)
   ------------------------------------------------------------ */
const piese = [
  { id: 1, titlu: "MASTER_BOOT_RECORD - CHKDSK", redata: false, format: "flac" },
  { id: 2, titlu: "PERTURBATOR - FUTURE_CLUB", redata: true, format: "mp3" },
  { id: 3, titlu: "KEYGEN_CHURCH - TENEBRE", redata: false, format: "synth" },
];

/* Valorile permise pentru format (aceleași ca în <select> din formular) */
const FORMATE = ["flac", "mp3", "synth"];


/* ------------------------------------------------------------
   CITIRE
   ------------------------------------------------------------ */

/* Întoarce un array doar cu titlurile pieselor */
function listeazaTitluri(lista) {
  return lista.map((p) => p.titlu);
}

/* Numără piesele încă neredate (status PENDING) */
function numaraInAsteptare(lista) {
  return lista.filter((p) => !p.redata).length;
}

/* Caută piesele al căror titlu conține textul dat.
   Ambele texte trec prin toLowerCase(), deci "keygen" găsește și "KEYGEN_CHURCH".
   Titlul include și artistul, așa că se poate căuta după oricare dintre ele. */
function cautaDupaTitlu(lista, text) {
  const cautat = text.toLowerCase();
  return lista.filter((p) => p.titlu.toLowerCase().includes(cautat));
}


/* ------------------------------------------------------------
   ADĂUGARE (cu validare)
   ------------------------------------------------------------ */

/* Calculează următorul id: cel mai mare id existent + 1.
   (lista.length + 1 ar produce duplicate după o ștergere) */
function nextId(lista) {
  return lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

/* Adaugă o piesă nouă și întoarce o listă NOUĂ.
   Dacă datele nu sunt valide, afișează un mesaj și întoarce lista neschimbată. */
function adaugaPiesa(lista, titlu, format = "mp3") {
  const titluCurat = titlu.trim();

  // 1. Titlul nu poate fi gol (nici doar spații)
  if (titluCurat === "") {
    console.log("[ERR] Titlul nu poate fi gol.");
    return lista;
  }

  // 2. Formatul trebuie să fie unul dintre cele permise
  if (!FORMATE.includes(format)) {
    console.log("[ERR] Format invalid:", format);
    return lista;
  }

  // 3. Construim obiectul nou; orice piesă nouă intră în coadă ca neredată
  const nou = {
    id: nextId(lista),
    titlu: titluCurat,
    redata: false,
    format: format,
  };

  // 4. Array nou, cu piesa adăugată la final (fără push)
  return [...lista, nou];
}


/* ------------------------------------------------------------
   MODIFICARE ȘI ȘTERGERE
   ------------------------------------------------------------ */

/* Inversează starea PENDING / PLAYED pentru piesa cu id-ul dat.
   Piesa găsită devine o copie modificată; restul rămân la fel. */
function comutaRedata(lista, id) {
  return lista.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p));
}

/* Șterge piesa cu id-ul dat: păstrăm doar piesele cu alt id */
function stergePiesa(lista, id) {
  return lista.filter((p) => p.id !== id);
}


/* ============================================================
   TESTE ÎN CONSOLĂ
   Se rulează automat la deschiderea paginii.
   ============================================================ */

console.log("--- Citire ---");
console.log("Titluri:", listeazaTitluri(piese).join(", "));
console.log("În așteptare:", numaraInAsteptare(piese));
console.log("Căutare 'keygen':", listeazaTitluri(cautaDupaTitlu(piese, "keygen")).join(", "));

console.log("--- Adăugare ---");
let lista = adaugaPiesa(piese, "CARPENTER_BRUT - TURBO_KILLER", "flac");
console.log("Lista nouă:", lista.length, "piese");
// Dovada imutabilității: originalul trebuie să aibă tot 3 piese
console.log("Originalul a rămas cu:", piese.length, "piese");

console.log("--- Modificare și ștergere ---");
lista = comutaRedata(lista, 1);
console.log("După redarea id 1, în așteptare:", numaraInAsteptare(lista));
lista = stergePiesa(lista, 3);
console.log("După ștergerea id 3:", listeazaTitluri(lista).join(", "));

console.log("--- Validare ---");
adaugaPiesa(lista, "   ");          // titlu gol -> respins
adaugaPiesa(lista, "Ceva", "wav");  // format inexistent -> respins
