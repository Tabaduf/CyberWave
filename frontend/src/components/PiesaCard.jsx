/* ============================================================
   CYBERWAVE // PiesaCard.jsx
   Un singur card din listă. Primește piesa și funcțiile prin props.
   Cardul NU modifică datele: doar anunță ce a făcut utilizatorul,
   apelând funcțiile primite de la pagină (onToggle, onDelete, ...).
     - mini-discul        -> pune piesa pe disc și o pornește
     - checkbox           -> PENDING <-> PLAYED
     - titlul (link)      -> pagina de detaliu a piesei (Etapa 8)
     - ♥                  -> intră / iese din LIKED_SONGS
     - ✕ DELETE           -> șterge piesa
   Etapa 7: atributele data-testid (item, item-toggle, item-delete)
   sunt reperele pentru verificarea automată. data-id = id-ul piesei.
   Etapa 8: titlul devine <Link>, cu data-testid="item-link" (în locul
   lui item-title); clasele vin din PiesaCard.module.css (styles.nume),
   iar cele comune (badge, gen-tag, mini-disc ...) din index.css.
   ============================================================ */

import { Link } from "react-router-dom";
import { ETICHETE_FORMAT } from "../constants.js";
import styles from "./PiesaCard.module.css";

export default function PiesaCard({ piesa, link, peDisc, ruleaza, liked, onAlege, onLike, onToggle, onDelete }) {
  // Clasele cardului: done = redată, onDeck = e acum pe disc
  let clase = styles.card;
  if (piesa.redata) clase += ` ${styles.done}`;
  if (peDisc) clase += ` ${styles.onDeck}`;

  return (
    <li className={clase} data-testid="item" data-id={piesa.id}>
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

      {/* Etapa 8: <label> devine <div>, pentru că titlul e acum link.
          Checkbox-ul primește aria-label, ca cititorul de ecran să știe ce bifează. */}
      <div className={styles.main}>
        {/* Checkbox CONTROLAT: checked arată ce spun datele, onChange anunță pagina */}
        <input
          type="checkbox"
          checked={piesa.redata}
          onChange={() => onToggle(piesa.id)}
          aria-label={`Marchează ${piesa.titlu} ca redată`}
          data-testid="item-toggle"
        />

        <div className={styles.details}>
          {/* Link schimbă doar adresa, fără reîncărcarea paginii: muzica nu se oprește */}
          <Link to={link} className={styles.title} data-testid="item-link">
            {piesa.titlu}
          </Link>

          <div className={styles.meta}>
            {/* Clasa globală se construiește din valoare: "flac" -> "badge-flac" (index.css) */}
            <span className={`badge badge-${piesa.format}`}>
              {ETICHETE_FORMAT[piesa.format]}
            </span>

            {/* Genul apare în culorile lui (data-gen alege paleta, vezi index.css) */}
            <span className="gen-tag" data-gen={piesa.gen}>{piesa.gen.toUpperCase()}</span>
            <span className="meta-text">{piesa.bpm} BPM</span>
          </div>
        </div>
      </div>

      <div className={styles.side}>
        <div className={styles.sideTop}>
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
        <span className={styles.status}>{piesa.redata ? "PLAYED" : "PENDING"}</span>

        {/* () => onDelete(piesa.id): funcția se apelează la CLICK, nu la randare */}
        <button
          type="button"
          className="btn-danger"
          onClick={() => onDelete(piesa.id)}
          aria-label={`Șterge ${piesa.titlu}`}
          data-testid="item-delete"
        >
          ✕ DELETE
        </button>
      </div>
    </li>
  );
}
