/* ============================================================
   CYBERWAVE // PiesaCard.jsx
   Un singur card din listă.
   Primește O piesă prin props și o desenează.
   Click (sau Enter) pe card -> piesa ajunge pe disc.
   Click pe ♥ -> piesa intră / iese din LIKED_SONGS.
   ============================================================ */

/* Traduce valoarea din date în textul afișat pe badge.
   În date rămâne "flac" (litere mici, folosit și în clasa CSS),
   iar pe ecran apare "FLAC". */
const ETICHETE_FORMAT = { flac: "FLAC", mp3: "MP3", synth: "SYNTH" };

/* Extragem direct props-urile primite. */
export default function PiesaCard({ piesa, peDisc, ruleaza, liked, onAlege, onLike }) {
  // Clasele cardului: "done" = redată, "on-deck" = e acum pe disc
  let clase = "item-card";
  if (piesa.redata) clase += " done";
  if (peDisc) clase += " on-deck";

  return (
    <li
      className={clase}
      onClick={onAlege}
      // tabIndex + Enter: cardul se poate alege și din tastatură
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onAlege();
      }}
    >
      {/* Mini-disc cu coperta: se învârte doar cât piesa asta rulează.
          Fără copertă, eticheta din mijloc are culoarea genului (data-gen). */}
      <span className={ruleaza ? "mini-disc spinning" : "mini-disc"} data-gen={piesa.gen} aria-hidden="true">
        {piesa.cover ? <img src={piesa.cover} alt="" /> : <span className="mini-label"></span>}
      </span>

      <div className="card-details">
        <h3>{piesa.titlu}</h3>

        <div className="card-meta">
          {/* Clasa se construiește din valoare: "flac" -> "badge-flac" (definită în App.css) */}
          <span className={`badge badge-${piesa.format}`}>
            {ETICHETE_FORMAT[piesa.format]}
          </span>

          {/* Genul apare în culorile lui (data-gen alege paleta, vezi App.css) */}
          <span className="gen-tag" data-gen={piesa.gen}>{piesa.gen.toUpperCase()}</span>
          <span className="meta-text">{piesa.bpm} BPM</span>
        </div>
      </div>

      <div className="card-side">
        {/* Randare condiționată cu &&: apare doar când condiția e adevărată */}
        {peDisc && <span className="on-deck-tag">◉ ON_DECK</span>}

        <button
          type="button"
          className={liked ? "like-btn on" : "like-btn"}
          aria-pressed={liked}
          aria-label={liked ? "Scoate din Liked" : "Adaugă la Liked"}
          onClick={(e) => {
            e.stopPropagation(); // click-ul pe ♥ nu mai ajunge și la card (nu pornește piesa)
            onLike();
          }}
          onKeyDown={(e) => e.stopPropagation()} // Enter pe ♥ nu pornește piesa
        >
          {liked ? "♥" : "♡"}
        </button>

        {/* Textul stării, ales după valoarea booleană */}
        <span className="status">{piesa.redata ? "PLAYED" : "PENDING"}</span>
      </div>
    </li>
  );
}