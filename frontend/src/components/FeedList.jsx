/* ============================================================
   CYBERWAVE // FeedList.jsx
   Panoul FOR_YOU: profilul tău muzical și feed-ul de recomandări.
   Fiecare recomandare arată piesa, cât de bine se potrivește (%)
   și de ce a fost aleasă. Poți s-o asculți (mini-discul), s-o
   apreciezi (♥) sau s-o adaugi în coadă (+ QUEUE).
   Componenta doar afișează: datele și acțiunile vin din pagină.
   Etapa 8: cardurile arată la fel ca în listă, deci folosesc clasele
   din PiesaCard.module.css (card); restul vin din FeedList.module.css.
   Piesele din feed nu sunt pe server, deci titlul lor nu e link.
   ============================================================ */

import card from "./PiesaCard.module.css";
import styles from "./FeedList.module.css";

const LATIME_BARA = 12; // câte caractere are bara de potrivire

export default function FeedList({ profil, feed, curentId, ruleaza, likedIds, onAlege, onLike, onAdaugaInCoada, onRegenereaza }) {
  // Primele 3 genuri din profil, ca text: "DARKSYNTH 62% · SYNTHWAVE 30%"
  const rezumat = profil.genuri
    .slice(0, 3)
    .map((g) => `${g.gen.toUpperCase()} ${Math.round(g.procent * 100)}%`)
    .join(" · ");

  return (
    <div className={styles.feed}>
      {/* Profilul: din ce a fost calculat feed-ul */}
      <div className={styles.profile}>
        <p className={styles.cmd}>
          $ recommend --based-on listening_stats
          <button type="button" className={styles.refresh} onClick={onRegenereaza}>
            ⟳ REGENERATE
          </button>
        </p>
        <p className={styles.profileLine}>
          {profil.areDate
            ? `PROFILE: ${rezumat} · AVG ${profil.bpmMediu} BPM`
            : "PROFILE: NO DATA YET · PLAY OR LIKE A FEW TRACKS. SHOWING A DISCOVERY MIX."}
        </p>
      </div>

      {feed.length === 0 ? (
        <p className="empty">[SYS_MSG]: FEED EMPTY. PRESS ⟳ REGENERATE.</p>
      ) : (
        <ul className={styles.list}>
          {feed.map(({ piesa, potrivire, motiv }) => {
            const peDisc = piesa.id === curentId;
            const liked = likedIds.includes(piesa.id);
            const pline = Math.round((potrivire / 100) * LATIME_BARA);
            const listaPiese = feed.map((r) => r.piesa); // ordinea pentru ⏮ / ⏭

            let clase = `${card.card} ${styles.feedCard}`;
            if (peDisc) clase += ` ${card.onDeck}`;

            return (
              <li key={piesa.id} className={clase}>
                {/* Mini-disc = buton de play */}
                <button
                  type="button"
                  className={peDisc && ruleaza ? "mini-disc spinning" : "mini-disc"}
                  data-gen={piesa.gen}
                  onClick={() => onAlege(piesa, listaPiese)}
                  aria-label={`Redă ${piesa.titlu}`}
                  title="Play"
                >
                  <span className="mini-label"></span>
                  <svg className="mini-play" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                </button>

                <div className={card.details}>
                  <h3 className={card.titleText}>{piesa.titlu}</h3>
                  <div className={card.meta}>
                    <span className="gen-tag" data-gen={piesa.gen}>{piesa.gen.toUpperCase()}</span>
                    <span className="meta-text">{piesa.bpm} BPM</span>
                    {/* Bara de potrivire, în stilul terminalului */}
                    <span className={styles.match} data-gen={piesa.gen}>
                      {"█".repeat(pline)}
                      <span className={styles.barRest}>{"░".repeat(LATIME_BARA - pline)}</span> {potrivire}%
                    </span>
                  </div>
                  <p className={styles.motiv}>{"// "}{motiv}</p>
                </div>

                <div className={card.side}>
                  <div className={card.sideTop}>
                    {peDisc && <span className="on-deck-tag">◉ ON_DECK</span>}
                    <button
                      type="button"
                      className={liked ? "like-btn on" : "like-btn"}
                      aria-pressed={liked}
                      aria-label={liked ? `Scoate ${piesa.titlu} din Liked` : `Adaugă ${piesa.titlu} la Liked`}
                      onClick={() => onLike(piesa)}
                    >
                      {liked ? "♥" : "♡"}
                    </button>
                  </div>
                  <button type="button" className={styles.add} onClick={() => onAdaugaInCoada(piesa)}>
                    + QUEUE
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
