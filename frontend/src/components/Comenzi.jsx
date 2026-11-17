/* ============================================================
   CYBERWAVE // Comenzi.jsx
   Piese mici de interfață folosite în mai multe locuri:
   în panoul Player și în bara de jos (PlayerBar).
   Un fișier poate exporta mai multe lucruri: aici avem
   export-uri cu nume, importate cu { Iconita, BaraProgres }.
   Etapa 8: formatTimp s-a mutat în ../format.js (un fișier de
   componente exportă doar componente), iar stilurile barei de
   progres stau în Comenzi.module.css.
   ============================================================ */

import { formatTimp } from "../format.js";
import styles from "./Comenzi.module.css";

/* Iconițe SVG desenate din cod (arată la fel pe orice sistem, spre
   deosebire de simbolurile text, pe care Windows le poate afișa ca emoji) */
const ICONITE = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  inapoi: "M6 5h2v14H6zM20 5v14L9 12z",
  inainte: "M16 5h2v14h-2zM4 5v14l11-7z",
  repeat: "M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z",
  // difuzor + unde sonore (volum mare / mic / oprit)
  volumMare: "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z",
  volumMic: "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z",
  mut: "M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z",
  joc: "M7 6h10a5 5 0 0 1 0 10h-1l-2-2h-4l-2 2H7A5 5 0 0 1 7 6zm0 3v2H5v2h2v2h2v-2h2v-2H9V9H7zm9.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
};

export function Iconita({ nume, marime = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={marime} height={marime} aria-hidden="true">
      <path d={ICONITE[nume]} fill="currentColor" />
    </svg>
  );
}

/* Bara de progres + timpii. Click pe bară = derulare la acel punct.
   compact = timpii stau pe același rând cu bara (în bara de jos). */
export function BaraProgres({ timp, durata, rewind, onDerulare, compact = false }) {
  const progres = timp / durata;

  // Poziția click-ului față de lățimea barei = procentul dorit
  function laClickPeBara(e) {
    const bara = e.currentTarget.getBoundingClientRect();
    const procent = (e.clientX - bara.left) / bara.width;
    onDerulare(procent * durata);
  }

  const bara = (
    <div
      className={rewind ? `${styles.progress} ${styles.rewinding}` : styles.progress}
      onClick={laClickPeBara}
      title="Click pentru derulare"
    >
      <span className={styles.fill} style={{ width: `${progres * 100}%` }}></span>
    </div>
  );

  // Varianta compactă: 00:12 [=====-----] 04:12
  if (compact) {
    return (
      <div className={styles.row}>
        <span className={styles.label}>{formatTimp(timp)}</span>
        {bara}
        <span className={styles.label}>{formatTimp(durata)}</span>
      </div>
    );
  }

  return (
    <>
      {bara}
      <div className={styles.time}>
        <span>{formatTimp(timp)}</span>
        <span>{formatTimp(durata)}</span>
      </div>
    </>
  );
}
