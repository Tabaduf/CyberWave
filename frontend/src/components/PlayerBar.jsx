/* ============================================================
   CYBERWAVE // PlayerBar.jsx
   Bara de control fixată jos, în stilul Spotify:
     stânga   - coperta mică, titlul, ♥
     mijloc   - ⏮ ▶/❚❚ ⏭ ⟲ și bara de progres
     dreapta  - volumul (slider) și butonul PLAY GAME / EXIT GAME
   Rămâne vizibilă și în timpul jocului, ca muzica să poată fi
   controlată de oriunde. Nu ține stare: totul vine prin props.
   ============================================================ */

import { Iconita, BaraProgres } from "./Comenzi.jsx";

export default function PlayerBar({
  piesa,
  ruleaza,
  timp,
  rewind,
  liked,
  volum,
  mut,
  inJoc,
  onPlayPause,
  onInapoi,
  onInainte,
  onRepeat,
  onDerulare,
  onLike,
  onVolum,
  onMut,
  onJoc,
}) {
  // Iconița difuzorului depinde de volum
  const volumAfisat = mut ? 0 : volum;
  let iconitaVolum = "volumMare";
  if (volumAfisat === 0) iconitaVolum = "mut";
  else if (volumAfisat < 50) iconitaVolum = "volumMic";

  return (
    <footer className="player-bar" aria-label="Control muzică">
      {/* Unda animată din Etapa 1, acum pe marginea de sus a barei */}
      <div className="wave" aria-hidden="true"></div>

      {/* STÂNGA: piesa curentă */}
      <div className="bar-left">
        {piesa ? (
          <>
            <span className={ruleaza ? "mini-disc spinning" : "mini-disc"} data-gen={piesa.gen} aria-hidden="true">
              {piesa.cover ? <img src={piesa.cover} alt="" /> : <span className="mini-label"></span>}
            </span>
            <div className="bar-track">
              <span className="bar-title">{piesa.titlu}</span>
              <span className="meta-text">
                {piesa.gen.toUpperCase()} · {piesa.bpm} BPM
              </span>
            </div>
            <button
              type="button"
              className={liked ? "like-btn on" : "like-btn"}
              onClick={onLike}
              aria-pressed={liked}
              aria-label={liked ? "Scoate din Liked" : "Adaugă la Liked"}
            >
              {liked ? "♥" : "♡"}
            </button>
          </>
        ) : (
          <span className="meta-text">[SYS_MSG]: NO TRACK LOADED.</span>
        )}
      </div>

      {/* MIJLOC: comenzile și progresul */}
      <div className="bar-center">
        <div className="bar-controls">
          <button type="button" className="bar-btn" onClick={onInapoi} disabled={!piesa} aria-label="Înapoi">
            <Iconita nume="inapoi" marime={18} />
          </button>
          <button
            type="button"
            className="bar-btn bar-main"
            onClick={onPlayPause}
            disabled={!piesa}
            aria-label={ruleaza ? "Pauză" : "Play"}
          >
            <Iconita nume={ruleaza ? "pause" : "play"} marime={20} />
          </button>
          <button type="button" className="bar-btn" onClick={onInainte} disabled={!piesa} aria-label="Înainte">
            <Iconita nume="inainte" marime={18} />
          </button>
          <button
            type="button"
            className={rewind ? "bar-btn activ" : "bar-btn"}
            onClick={onRepeat}
            disabled={!piesa || rewind}
            aria-label="Repeat"
          >
            <Iconita nume="repeat" marime={18} />
          </button>
        </div>

        {piesa && (
          <BaraProgres timp={timp} durata={piesa.durata} rewind={rewind} onDerulare={onDerulare} compact />
        )}
      </div>

      {/* DREAPTA: volumul și jocul */}
      <div className="bar-right">
        <button
          type="button"
          className="bar-btn"
          onClick={onMut}
          aria-label={mut ? "Pornește sunetul" : "Oprește sunetul"}
          aria-pressed={mut}
        >
          <Iconita nume={iconitaVolum} marime={18} />
        </button>

        {/* Slider CONTROLAT: value vine din state, onChange îl schimbă.
            --val colorează partea din stânga a șinei (vezi App.css). */}
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="100"
          value={volumAfisat}
          onChange={(e) => onVolum(Number(e.target.value))}
          style={{ "--val": `${volumAfisat}%` }}
          aria-label="Volum"
        />
        <span className="volume-value">{volumAfisat}</span>

        <button type="button" className={inJoc ? "game-btn activ" : "game-btn"} onClick={onJoc}>
          <Iconita nume="joc" marime={18} />
          {inJoc ? "EXIT GAME" : "PLAY GAME"}
        </button>
      </div>
    </footer>
  );
}
