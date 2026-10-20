/* ============================================================
   CYBERWAVE // Player.jsx
   Panoul din stânga: discul, piesa curentă, bara de progres
   butoanele ⏮  ▶/❚❚  ⏭  ⟲, plus ♥ LIKE și + PLAYLIST.
   Nu ține nicio stare: primește totul prin props de la App
   și anunță click-urile prin funcțiile on... primite tot prin props.
   ============================================================ */

import Vinil from "./Vinil.jsx";
import MeniuPlaylist from "./MeniuPlaylist.jsx";

/* Iconițe SVG desenate din cod (arată la fel pe orice sistem, spre
   deosebire de simbolurile text, pe care Windows le poate afișa ca emoji) */
const ICONITE = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  inapoi: "M6 5h2v14H6zM20 5v14L9 12z",
  inainte: "M16 5h2v14h-2zM4 5v14l11-7z",
  repeat: "M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z",
};

function Iconita({ nume }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d={ICONITE[nume]} fill="currentColor" />
    </svg>
  );
}

/* 75 secunde -> "01:15" (padStart adaugă zero în față) */
function formatTimp(secunde) {
  const min = Math.floor(secunde / 60);
  const sec = Math.floor(secunde % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function Player({
  piesa,
  ruleaza,
  timp,
  rewind,
  liked,
  playlisturi,
  onPlayPause,
  onInapoi,
  onInainte,
  onRepeat,
  onDerulare,
  onLike,
  onComutaPlaylist,
  onCreeazaPlaylist,
}) {
  // Return timpuriu: nicio piesă de redat
  if (!piesa) {
    return (
      <section className="panel player">
        <h2>&gt;&gt; NOW_PLAYING</h2>
        <p className="empty">[SYS_MSG]: NO TRACK LOADED.</p>
      </section>
    );
  }

  // Cât s-a derulat din piesă, între 0 (început) și 1 (final)
  const progres = timp / piesa.durata;

  // Textul de stare de sub titlu
  let stare = "❚❚ PAUSED";
  if (ruleaza) stare = "▶ PLAYING";
  if (rewind) stare = "⟲ REWINDING...";

  // Click pe bară: poziția click-ului față de lățimea barei = procentul dorit
  function laClickPeBara(e) {
    const bara = e.currentTarget.getBoundingClientRect();
    const procent = (e.clientX - bara.left) / bara.width;
    onDerulare(procent * piesa.durata);
  }

  return (
    <section className="panel player">
      <h2 className="player-title">
        &gt;&gt; NOW_PLAYING
        {/* Mini-egalizator: barele sar doar cât timp rulează */}
        <span className="eq" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </span>
      </h2>

      {/* key={piesa.id}: la altă piesă, React creează un disc nou,
          deci rulează din nou animația de "schimbare a discului" */}
      <Vinil key={piesa.id} piesa={piesa} ruleaza={ruleaza} rewind={rewind} progres={progres} />

      <div className="track-info">
        <h3>{piesa.titlu}</h3>
        <p className="meta-text">
          {piesa.format.toUpperCase()} · {piesa.gen.toUpperCase()} · {piesa.bpm} BPM
        </p>
        <p className="player-state">{stare}</p>
      </div>

      {/* ♥ și + PLAYLIST pentru piesa de pe disc; listele se actualizează imediat */}
      <div className="track-actions">
        <button
          type="button"
          className={liked ? "action-btn liked-on" : "action-btn"}
          onClick={onLike}
          aria-pressed={liked}
        >
          {liked ? "♥ LIKED" : "♡ LIKE"}
        </button>

        <MeniuPlaylist
          playlisturi={playlisturi}
          piesaId={piesa.id}
          onComuta={onComutaPlaylist}
          onCreeaza={onCreeazaPlaylist}
        />
      </div>

      {/* Bara de progres: lățimea vine din progres; click = derulare */}
      <div
        className={rewind ? "progress rewinding" : "progress"}
        onClick={laClickPeBara}
        title="Click pentru derulare"
      >
        <span className="progress-fill" style={{ width: `${progres * 100}%` }}></span>
      </div>
      <div className="progress-time">
        <span>{formatTimp(timp)}</span>
        <span>{formatTimp(piesa.durata)}</span>
      </div>

      <div className="controls">
        <button type="button" className="ctl" onClick={onInapoi} title="Înapoi" aria-label="Înapoi">
          <Iconita nume="inapoi" />
        </button>

        {/* Un singur buton: iconița și textul se schimbă după stare */}
        <button
          type="button"
          className={ruleaza ? "ctl ctl-main activ" : "ctl ctl-main"}
          onClick={onPlayPause}
          title={ruleaza ? "Pauză" : "Play"}
          aria-label={ruleaza ? "Pauză" : "Play"}
        >
          <Iconita nume={ruleaza ? "pause" : "play"} />
        </button>

        <button type="button" className="ctl" onClick={onInainte} title="Înainte" aria-label="Înainte">
          <Iconita nume="inainte" />
        </button>

        <button
          type="button"
          className={rewind ? "ctl ctl-repeat activ" : "ctl ctl-repeat"}
          onClick={onRepeat}
          disabled={rewind}
          title="Repeat: de la capăt"
          aria-label="Repeat"
        >
          <Iconita nume="repeat" />
        </button>
      </div>
    </section>
  );
}