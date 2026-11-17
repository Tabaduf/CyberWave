/* ============================================================
   CYBERWAVE // Genuri.jsx
   Rândul de genuri + butonul "MORE" cu restul genurilor.
   Genul ales filtrează listele. Fiecare pastilă are culorile
   genului ei (data-gen, la fel ca paleta aplicației).
   Etapa 8: listele de genuri vin din constants.js, clasele din
   Genuri.module.css.
   ============================================================ */

import { useState } from "react";
import { GENURI_PRINCIPALE, GENURI_EXTRA } from "../constants.js";
import styles from "./Genuri.module.css";

export default function Genuri({ gen, onAlege }) {
  // Starea locală: meniul MORE e deschis sau nu.
  // Nu interesează pe nimeni altcineva, deci stă aici.
  const [deschis, setDeschis] = useState(false);

  // Clasele unei pastile: cea aleasă primește în plus "activ"
  const claseChip = (activ) => (activ ? `${styles.chip} ${styles.activ}` : styles.chip);

  // Butonul pentru un gen
  function chip(g, dinMeniu) {
    return (
      <button
        key={g}
        type="button"
        data-gen={g}
        className={claseChip(gen === g)}
        aria-pressed={gen === g}
        onClick={() => {
          onAlege(g);
          if (dinMeniu) setDeschis(false); // după alegere, meniul se închide
        }}
      >
        {g.toUpperCase()}
      </button>
    );
  }

  // Dacă genul ales e unul din meniu, îl arătăm pe butonul MORE
  const extraAles = GENURI_EXTRA.includes(gen);

  return (
    <div className={styles.bar}>
      <span className={styles.label}>GENRE://</span>

      {["all", ...GENURI_PRINCIPALE].map((g) => chip(g, false))}

      {/* <details> = meniu derulant din HTML. open + onToggle îl leagă de stare. */}
      <details
        className={styles.more}
        open={deschis}
        onToggle={(e) => setDeschis(e.currentTarget.open)}
      >
        <summary className={claseChip(extraAles)} data-gen={extraAles ? gen : undefined}>
          {extraAles ? gen.toUpperCase() : "MORE"} ▾
        </summary>
        <div className={styles.dropdown}>
          {GENURI_EXTRA.map((g) => chip(g, true))}
        </div>
      </details>
    </div>
  );
}
