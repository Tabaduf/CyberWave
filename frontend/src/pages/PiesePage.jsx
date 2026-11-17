/* ============================================================
   CYBERWAVE // pages/PiesePage.jsx
   Etapa 8: pagina principală, la adresa "/" (TaskuriPage din ghid).
   Conținutul e cel din App.jsx de la Etapa 7: meniurile (taburi +
   genuri), formularul, player-ul cu discul și panoul tabului ales.
   Diferențe față de Etapa 7:
     - starea vine din Layout, prin useOutletContext() (vezi
       hooks/useCyberwave.js), ca muzica să nu se oprească la navigare;
     - contorul de piese s-a mutat din antet în panoul listei,
       pentru că antetul e acum comun tuturor paginilor;
     - titlul fiecărui card e link spre /piese/:id;
     - clasele vin din PiesePage.module.css.
   ============================================================ */

import { useOutletContext } from "react-router-dom";
import PiesaList from "../components/PiesaList.jsx";
import PiesaForm from "../components/PiesaForm.jsx";
import Player from "../components/Player.jsx";
import Genuri from "../components/Genuri.jsx";
import PlaylistGrid from "../components/PlaylistGrid.jsx";
import FeedList from "../components/FeedList.jsx";
import StatisticiLog from "../components/StatisticiLog.jsx";
import styles from "./PiesePage.module.css";

/* Meniurile de sus */
const TABURI = [
  { id: "queue", text: "≡ QUEUE" },
  { id: "liked", text: "♥ LIKED_SONGS" },
  { id: "random", text: "⤨ RANDOM" },
  { id: "foryou", text: "✦ FOR_YOU" },
  { id: "playlists", text: "▤ PLAYLISTS" },
  { id: "syslog", text: "▣ SYS_LOG" },
];

export default function PiesePage() {
  // Starea comună, trimisă de Layout prin <Outlet context={...} />
  const app = useOutletContext();
  const { piese, sugestii, playlisturi, likedIds, loading, error, tab, gen, curentId, filtreaza } = app;

  /* Adresa paginii de detaliu: /piese/:id (resursa din tw.json).
     Piesele din RANDOM stau pe server la /sugestii, deci pagina de
     detaliu primește resursa în query string: ?sursa=sugestii. */
  function linkPiesa(piesa) {
    return app.resursaPiesei(piesa.id) === "sugestii"
      ? `/piese/${piesa.id}?sursa=sugestii`
      : `/piese/${piesa.id}`;
  }

  // Funcțiile pentru carduri, aceleași pentru toate listele
  const actiuni = { ...app.actiuniCard, linkCatre: linkPiesa };

  return (
    <>
      {/* Meniurile listei, lipite sus la scroll */}
      <nav className={styles.toolbar} aria-label="Meniu">
        <div className={styles.tabs} role="tablist">
          {TABURI.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? `${styles.tab} ${styles.activ}` : styles.tab}
              onClick={() => app.handleTab(t.id)}
            >
              {t.text}
              {/* Numărul de piese apreciate, actualizat în timp real */}
              {t.id === "liked" && <span className={styles.tabCount}>{likedIds.length}</span>}
            </button>
          ))}
        </div>
        <Genuri gen={gen} onAlege={app.setGen} />
      </nav>

      <div className={styles.grid}>
        {/* Stânga: formularul (Etapa 7), apoi discul și comenzile */}
        <div className={styles.left}>
          <section className="panel">
            <h2>&gt;&gt; INPUT_NEW_TRACK</h2>
            <PiesaForm onAdd={app.handleAdd} />
          </section>

          {/* {...comenziPlayer} = aceleași props ca bara de jos */}
          <Player
            {...app.comenziPlayer}
            scratching={app.scratching}
            discRidicat={app.discRidicat}
            onScratchStart={app.handleScratchStart}
            onScratch={app.handleScratch}
            onScratchEnd={app.handleScratchEnd}
            onRidica={app.handleRidica}
            onRevenire={app.handleRevenire}
            onSpart={app.handleSpart}
            onTintaPlaylist={app.setPlaylistTinta}
            onDropPlaylist={app.handleDropPlaylist}
            playlisturi={playlisturi}
            onComutaPlaylist={(playlistId) => app.handleComutaPlaylist(playlistId, curentId)}
            onCreeazaPlaylist={(nume) => app.handleCreeazaPlaylist(nume, app.piesaCurenta)}
          />
        </div>

        {/* Dreapta: se desenează doar panoul tabului ales (randare condiționată).
            key={tab} face panoul nou la fiecare schimbare -> animația de intrare rulează din nou. */}
        <section className={`panel ${styles.tabPanel}`} key={tab}>
          {/* Contorul: valori derivate din state (mutat din antet în Etapa 8) */}
          <p className={styles.summary}>
            {loading
              ? "[SYS_MSG]: LINKING TO API..."
              : `[SYS_MSG]: ${piese.length} TRACKS FOUND. ${app.inAsteptare} PENDING. ${likedIds.length} LIKED.`}
          </p>

          {/* ETAPA 6-7: stările încărcării. Lista se desenează după încărcare
              chiar dacă există o eroare, ca o salvare eșuată să nu ascundă lista. */}
          {loading && (
            <p className="info" data-testid="loading">
              [SYS]: LOADING TRACK DATABASE FROM API<span className="cursor">_</span>
            </p>
          )}
          {error && (
            <div className="error" role="alert" data-testid="error">
              <p>
                [ERR]: {error}. IS THE API RUNNING? START IT WITH <code>npm run api</code> (PORT 3001), THEN RETRY.
              </p>
              <div className="error-actions">
                <button type="button" className="error-retry" onClick={app.handleReincearca}>
                  ⟳ RETRY
                </button>
                <button type="button" className="error-retry" onClick={() => app.setError(null)} aria-label="Închide mesajul">
                  ✕
                </button>
              </div>
            </div>
          )}
          {!loading && (
            <>
              {tab === "queue" && (
                <>
                  <h2>&gt;&gt; AUDIO_QUEUE</h2>
                  <PiesaList
                    piese={filtreaza(piese)}
                    {...actiuni}
                    mesajGol={gen === "all" ? undefined : "[SYS_MSG]: NO TRACKS OF THIS GENRE IN QUEUE."}
                  />
                </>
              )}

              {tab === "liked" && (
                <>
                  <h2>&gt;&gt; LIKED_SONGS</h2>
                  <PiesaList
                    piese={filtreaza(app.pieseApreciate)}
                    {...actiuni}
                    mesajGol="[SYS_MSG]: NO LIKED TRACKS HERE. PRESS ♡ ON A TRACK."
                  />
                </>
              )}

              {tab === "random" && (
                <>
                  <h2>&gt;&gt; RANDOM.SEED</h2>
                  <PiesaList
                    piese={filtreaza(sugestii)}
                    {...actiuni}
                    mesajGol="[SYS_MSG]: NOTHING TO SHUFFLE HERE."
                  />
                </>
              )}

              {tab === "foryou" && (
                <>
                  <h2>&gt;&gt; FOR_YOU</h2>
                  <FeedList
                    profil={app.profil}
                    // din id-uri -> piese, apoi filtrul de gen de sus
                    feed={app.feed
                      .map((r) => ({ ...r, piesa: app.pieseGenerate.find((p) => p.id === r.id) }))
                      .filter((r) => r.piesa && (gen === "all" || r.piesa.gen === gen))}
                    curentId={curentId}
                    ruleaza={app.ruleaza}
                    likedIds={likedIds}
                    onAlege={app.handleAlegePiesa}
                    onLike={app.handleLike}
                    onAdaugaInCoada={app.handleAdaugaInCoada}
                    onRegenereaza={app.handleRegenereaza}
                  />
                </>
              )}

              {tab === "syslog" && (
                <>
                  <h2>&gt;&gt; SYS_LOG</h2>
                  <StatisticiLog
                    statistici={app.stats.statistici}
                    likes={likedIds.length}
                    nrPlaylisturi={playlisturi.length}
                    onReseteaza={app.stats.reseteaza}
                  />
                </>
              )}

              {tab === "playlists" && (
                <>
                  <h2>&gt;&gt; PLAYLISTS</h2>
                  <PlaylistGrid
                    playlisturi={filtreaza(playlisturi)}
                    toatePiesele={app.toatePiesele}
                    curentId={curentId}
                    tintaId={app.playlistTinta}
                    animatie={app.animatiePlaylist}
                    onAlege={app.handleAlegePlaylist}
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
