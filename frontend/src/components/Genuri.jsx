/* ============================================================
   CYBERWAVE // Genuri.jsx
   Rândul de genuri + butonul "MORE" cu restul genurilor.
   Genul ales filtrează listele. Fiecare pastilă are culorile
   genului ei (data-gen, la fel ca paleta aplicației).
   ============================================================ */

import { useState } from "react";

/* Genurile afișate direct pe rând */
const GENURI_PRINCIPALE = ["all", "synthwave", "darksynth", "chiptune"];

/* Genurile ascunse în meniul derulant */
const GENURI_EXTRA = ["industrial", "vaporwave", "lo-fi", "drum&bass", "ambient"];

export default function Genuri({ gen, onAlege }) {
  // Starea locală: meniul MORE e deschis sau nu.
  // Nu interesează pe nimeni altcineva, deci stă aici, nu în App.
  const [deschis, setDeschis] = useState(false);

  // Butonul pentru un gen. Genul ales primește clasa "activ".
  function chip(g, dinMeniu) {
    return (
      <button
        key={g}
        type="button"
        data-gen={g}
        className={gen === g ? "chip activ" : "chip"}
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
    <div className="genre-bar">
      <span className="genre-label">GENRE://</span>

      {GENURI_PRINCIPALE.map((g) => chip(g, false))}

      {/* <details> = meniu derulant din HTML. open + onToggle îl leagă de stare. */}
      <details
        className="genre-more"
        open={deschis}
        onToggle={(e) => setDeschis(e.currentTarget.open)}
      >
        <summary className={extraAles ? "chip activ" : "chip"} data-gen={extraAles ? gen : undefined}>
          {extraAles ? gen.toUpperCase() : "MORE"} ▾
        </summary>
        <div className="genre-dropdown">
          {GENURI_EXTRA.map((g) => chip(g, true))}
        </div>
      </details>
    </div>
  );
}