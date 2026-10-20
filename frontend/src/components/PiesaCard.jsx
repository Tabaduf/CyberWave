/* ============================================================
   CYBERWAVE // PiesaCard.jsx
   Un singur card din coada audio.
   Primește O piesă prin props și o desenează exact ca în mockup.
   Nu știe nimic despre restul listei: doar afișează ce primește.
   ============================================================ */

/* Traduce valoarea din date în textul afișat pe badge.
   În date rămâne "flac" (litere mici, folosit și în clasa CSS),
   iar pe ecran apare "FLAC". */
const ETICHETE_FORMAT = { flac: "FLAC", mp3: "MP3", synth: "SYNTH" };

/* { piesa } extrage direct props-ul numit "piesa".
   Numele trebuie să fie identic cu cel din <PiesaCard piesa={...} />. */
export default function PiesaCard({ piesa }) {
  return (
    // Piesele redate primesc în plus clasa "done": titlu tăiat și culori estompate
    <li className={piesa.redata ? "item-card done" : "item-card"}>
      <div className="card-details">
        <h3>{piesa.titlu}</h3>

        {/* Clasa se construiește din valoare: "flac" -> "badge-flac" (definită în App.css) */}
        <span className={`badge badge-${piesa.format}`}>
          {ETICHETE_FORMAT[piesa.format]}
        </span>
      </div>

      {/* Textul stării, ales după valoarea booleană */}
      <span className="status">{piesa.redata ? "PLAYED" : "PENDING"}</span>
    </li>
  );
}
