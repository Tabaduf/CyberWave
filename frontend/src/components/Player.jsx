/* ============================================================
   CYBERWAVE // Player.jsx
   Panoul din stânga: discul, piesa curentă, bara de progres
   butoanele ⏮  ▶/❚❚  ⏭  ⟲, plus ♥ LIKE și + PLAYLIST.
   Nu ține nicio stare: primește totul prin props de la App
   și anunță click-urile prin funcțiile on... primite tot prin props.
   Etapa 8: clasele vin din Player.module.css; .panel, .empty,
   .meta-text și .action-btn sunt clasele comune din index.css.
   ============================================================ */

import Vinil from "./Vinil.jsx";
import MeniuPlaylist from "./MeniuPlaylist.jsx";
import { Iconita, BaraProgres } from "./Comenzi.jsx";
import styles from "./Player.module.css";

export default function Player({
  piesa,
  ruleaza,
  timp,
  rewind,
  scratching,
  discRidicat,
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
  onScratchStart,
  onScratch,
  onScratchEnd,
  onRidica,
  onRevenire,
  onSpart,
  onTintaPlaylist,
  onDropPlaylist,
}) {
  // Return timpuriu: nicio piesă de redat
  if (!piesa) {
    return (
      <section className={`panel ${styles.player}`}>
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
  if (scratching) stare = "◎ SCRATCHING";
  if (discRidicat) stare = "⏏ DISC LIFTED";

  return (
    <section className={`panel ${styles.player}`}>
      <h2 className={styles.title}>
        &gt;&gt; NOW_PLAYING
        {/* Mini-egalizator: barele sar doar cât timp rulează */}
        <span className={styles.eq} aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
        </span>
      </h2>

      {/* key={piesa.id}: la altă piesă, React creează un disc nou,
          deci rulează din nou animația de "schimbare a discului" */}
      <Vinil
        key={piesa.id}
        piesa={piesa}
        ruleaza={ruleaza}
        rewind={rewind}
        progres={progres}
        scratching={scratching}
        onScratchStart={onScratchStart}
        onScratch={onScratch}
        onScratchEnd={onScratchEnd}
        onRidica={onRidica}
        onRevenire={onRevenire}
        onSpart={onSpart}
        onTintaPlaylist={onTintaPlaylist}
        onDropPlaylist={onDropPlaylist}
      />

      <div className={styles.info}>
        <h3>{piesa.titlu}</h3>
        <p className="meta-text">
          {piesa.format.toUpperCase()} · {piesa.gen.toUpperCase()} · {piesa.bpm} BPM
        </p>
        <p className={styles.state}>{stare}</p>
      </div>

      {/* ♥ și + PLAYLIST pentru piesa de pe disc; listele se actualizează imediat */}
      <div className={styles.actions}>
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

      {/* Bara de progres comună (Comenzi.jsx): click = derulare */}
      <BaraProgres timp={timp} durata={piesa.durata} rewind={rewind} onDerulare={onDerulare} />

      <div className={styles.controls}>
        <button type="button" className={styles.ctl} onClick={onInapoi} title="Înapoi" aria-label="Înapoi">
          <Iconita nume="inapoi" />
        </button>

        {/* Un singur buton: iconița și textul se schimbă după stare */}
        <button
          type="button"
          className={`${styles.ctl} ${styles.main}${ruleaza ? ` ${styles.activ}` : ""}`}
          onClick={onPlayPause}
          title={ruleaza ? "Pauză" : "Play"}
          aria-label={ruleaza ? "Pauză" : "Play"}
        >
          <Iconita nume={ruleaza ? "pause" : "play"} />
        </button>

        <button type="button" className={styles.ctl} onClick={onInainte} title="Înainte" aria-label="Înainte">
          <Iconita nume="inainte" />
        </button>

        <button
          type="button"
          className={`${styles.ctl} ${styles.repeat}${rewind ? ` ${styles.activ}` : ""}`}
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