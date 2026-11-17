/* ============================================================
   CYBERWAVE // PiesaForm.jsx
   Etapa 7: formularul de adăugare a unei piese în coadă
   (TaskForm din ghid, pe tema proprie).

   - formular CONTROLAT: fiecare câmp are value (din state) și onChange;
   - validarea se face înainte de trimitere, iar mesajul apare sub
     câmpuri (nu cu alert);
   - formularul nu apelează fetch: dă datele mai departe prin onAdd,
     iar pagina le trimite la server;
   - butonul se dezactivează cât se trimite (fără dublu click), iar
     câmpurile se golesc DOAR dacă salvarea a reușit.
   Etapa 8: valorile fixe vin din constants.js, clasele din
   PiesaForm.module.css (styles.nume), iar butonul are clasa globală btn.
   ============================================================ */

import { useState } from "react";
import { FORMATE, GENURI } from "../constants.js";
import styles from "./PiesaForm.module.css";

/* Limitele validărilor */
const TITLU_MAX = 100;
const BPM_MIN = 40;
const BPM_MAX = 220;

/* O piesă nouă are 4 minute; sintetizatorul o cântă în tempo-ul ales */
const DURATA_IMPLICITA = 240;

export default function PiesaForm({ onAdd }) {
  // Câte un state pentru fiecare câmp: state-ul e "sursa de adevăr"
  const [titlu, setTitlu] = useState("");
  const [format, setFormat] = useState("flac");
  const [gen, setGen] = useState("synthwave");
  const [bpm, setBpm] = useState("120"); // text, cum vine din câmp; devine număr la trimitere
  const [eroare, setEroare] = useState("");
  const [trimite, setTrimite] = useState(false);

  // Întoarce mesajul de eroare sau "" dacă totul e în regulă
  function valideaza() {
    const t = titlu.trim();
    if (t === "") return "[ERR]: TITLE IS REQUIRED.";
    if (t.length > TITLU_MAX) return `[ERR]: TITLE CAN HAVE AT MOST ${TITLU_MAX} CHARACTERS.`;

    // Validarea specifică temei: tempo-ul e un număr întreg între 40 și 220
    const n = Number(bpm);
    if (bpm.trim() === "" || !Number.isInteger(n) || n < BPM_MIN || n > BPM_MAX) {
      return `[ERR]: BPM MUST BE A WHOLE NUMBER BETWEEN ${BPM_MIN} AND ${BPM_MAX}.`;
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault(); // oprește reîncărcarea paginii (comportamentul implicit al formularului)

    const mesaj = valideaza();
    if (mesaj) {
      setEroare(mesaj); // nu se trimite nimic la server
      return;
    }

    setEroare(""); // ștergem eroarea rămasă de la o încercare anterioară
    setTrimite(true); // buton dezactivat + text "SAVING..."
    try {
      // Piesa nouă, FĂRĂ id: id-ul îl atribuie serverul
      await onAdd({
        titlu: titlu.trim(),
        redata: false,
        format,
        gen,
        bpm: Number(bpm),
        durata: DURATA_IMPLICITA,
        liked: false,
        cover: null,
      });
      // Ajungem aici doar dacă salvarea a reușit: abia acum golim formularul
      setTitlu("");
      setBpm("120");
    } catch (err) {
      // Serverul oprit / eroare: mesajul apare aici, iar textul scris rămâne în câmp
      setEroare(`[ERR]: COULD NOT SAVE (${err.message}). IS npm run api RUNNING?`);
    } finally {
      setTrimite(false); // butonul revine, oricum s-ar fi terminat cererea
    }
  }

  return (
    // noValidate: mesajele sunt cele din cod, nu cele implicite ale browserului
    <form className={styles.form} onSubmit={handleSubmit} noValidate data-testid="form">
      <label>
        [TITLE]
        <input
          type="text"
          value={titlu}
          onChange={(e) => setTitlu(e.target.value)}
          placeholder="ARTIST - TRACK_NAME"
          maxLength={TITLU_MAX}
          aria-invalid={eroare.includes("TITLE")}
          data-testid="form-title"
        />
      </label>

      <label>
        [FORMAT]
        <select value={format} onChange={(e) => setFormat(e.target.value)} data-testid="form-format">
          {FORMATE.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {/* Genul și tempo-ul, pe un rând */}
      <div className={styles.row}>
        <label>
          [GENRE]
          <select value={gen} onChange={(e) => setGen(e.target.value)} data-testid="form-gen">
            {GENURI.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label>
          [BPM]
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            min={BPM_MIN}
            max={BPM_MAX}
            aria-invalid={eroare.includes("BPM")}
            data-testid="form-bpm"
          />
        </label>
      </div>

      {/* Mesajul de eroare, lângă formular */}
      {eroare && (
        <p className="error" role="alert" data-testid="form-error">
          {eroare}
        </p>
      )}

      <button type="submit" className="btn" disabled={trimite} data-testid="form-submit">
        {trimite ? "SAVING..." : "EXECUTE // ADD"}
      </button>
    </form>
  );
}
