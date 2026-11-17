/* ============================================================
   CYBERWAVE // constants.js
   Etapa 8: valorile fixe și etichetele lor, într-un singur loc.
   Înainte erau copiate în PiesaForm, PiesaCard și Genuri; acum
   le folosesc și pagina de detaliu, deci stau aici.
   ============================================================ */

/* Formatele audio: valoarea din db.json + textul din formular */
export const FORMATE = [
  { value: "flac", label: "FLAC (Lossless)" },
  { value: "mp3", label: "MP3 (320kbps)" },
  { value: "synth", label: "SYNTH (MIDI)" },
];

/* { flac: "FLAC", mp3: "MP3", synth: "SYNTH" }: textul de pe badge.
   Object.fromEntries transformă lista de perechi într-un obiect. */
export const ETICHETE_FORMAT = Object.fromEntries(
  FORMATE.map((f) => [f.value, f.value.toUpperCase()])
);

/* Genurile afișate direct pe rândul de filtre */
export const GENURI_PRINCIPALE = ["synthwave", "darksynth", "chiptune"];

/* Genurile ascunse în meniul derulant MORE */
export const GENURI_EXTRA = ["industrial", "vaporwave", "lo-fi", "drum&bass", "ambient"];

/* Toate genurile, în ordinea din formular */
export const GENURI = [...GENURI_PRINCIPALE, ...GENURI_EXTRA];
