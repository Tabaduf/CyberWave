/* ============================================================
   CYBERWAVE // PiesaCard.jsx
   Un singur card din listă. Primește piesa și funcțiile prin props.
   Cardul NU modifică datele: doar anunță ce a făcut utilizatorul,
   apelând funcțiile primite de la App (onToggle, onDelete, ...).
     - mini-discul        -> pune piesa pe disc și o pornește
     - checkbox / titlu   -> PENDING <-> PLAYED
     - ♥                  -> intră / iese din LIKED_SONGS
     - ✕ DELETE           -> șterge piesa
   ============================================================ */

/* Traduce valoarea din date în textul afișat pe badge.
   În date rămâne "flac" (litere mici, folosit și în clasa CSS),
   iar pe ecran apare "FLAC". */
const ETICHETE_FORMAT = { flac: "FLAC", mp3: "MP3", synth: "SYNTH" };

export default function PiesaCard({ piesa, peDisc, ruleaza, liked, onAlege, onLike, onToggle, onDelete }) {
  // Clasele cardului: "done" = redată, "on-deck" = e acum pe disc
  let clase = "item-card";
  if (piesa.redata) clase += " done";
  if (peDisc) clase += " on-deck";

  return (
    <li className={clase}>
      {/* Mini-disc cu coperta: buton care pune piesa pe disc.
          Se învârte doar cât piesa asta rulează. Fără copertă,
          eticheta din mijloc are culoarea genului (data-gen). */}
      <button
        type="button"
        className={ruleaza ? "mini-disc spinning" : "mini-disc"}
        data-gen={piesa.gen}
        onClick={onAlege}
        aria-label={`Redă ${piesa.titlu}`}
        title="Play"
      >
        {piesa.cover ? <img src={piesa.cover} alt="" /> : <span className="mini-label"></span>}
        {/* Triunghiul ▶ apare peste disc la hover */}
        <svg className="mini-play" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      </button>

      {/* label înconjoară checkbox-ul și textul: bifarea merge cu click oriunde pe titlu */}
      <label className="piesa-main">
        {/* Checkbox CONTROLAT: checked arată ce spun datele,
            onChange anunță App-ul. Fără onChange, React avertizează în consolă. */}
        <input
          type="checkbox"
          checked={piesa.redata}
          onChange={() => onToggle(piesa.id)}
        />

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
      </label>

      <div className="card-side">
        <div className="card-side-top">
          {/* Randare condiționată cu &&: apare doar când condiția e adevărată */}
          {peDisc && <span className="on-deck-tag">◉ ON_DECK</span>}

          <button
            type="button"
            className={liked ? "like-btn on" : "like-btn"}
            aria-pressed={liked}
            aria-label={liked ? `Scoate ${piesa.titlu} din Liked` : `Adaugă ${piesa.titlu} la Liked`}
            onClick={onLike}
          >
            {liked ? "♥" : "♡"}
          </button>
        </div>

        {/* Textul stării, ales după valoarea booleană */}
        <span className="status">{piesa.redata ? "PLAYED" : "PENDING"}</span>

        {/* () => onDelete(piesa.id): funcția se apelează la CLICK.
            onClick={onDelete(piesa.id)} ar apela-o imediat, la randare,
            și ar șterge toată lista fără niciun click.
            aria-label spune cititorului de ecran CE se șterge. */}
        <button
          type="button"
          className="btn-danger"
          onClick={() => onDelete(piesa.id)}
          aria-label={`Șterge ${piesa.titlu}`}
        >
          ✕ DELETE
        </button>
      </div>
    </li>
  );
}