/* ============================================================
   CYBERWAVE // StatisticiLog.jsx
   Panoul SYS_LOG: statisticile de ascultare afișate ca un raport
   de sistem într-un terminal.
     $ sysinfo   - totaluri și "clasa" utilizatorului
     $ genre     - ce genuri asculți, cu bare ASCII
     $ top       - piesele ascultate cel mai mult
     $ game      - statisticile jocului
     $ tail log  - ultimele acțiuni, cu ora
   Componenta doar CALCULEAZĂ și AFIȘEAZĂ: datele vin din useStatistici.
   Etapa 8: clasele vin din StatisticiLog.module.css.
   ============================================================ */

/* "Clasa" utilizatorului, după genul ascultat cel mai mult */
const CLASE = {
  synthwave: "NEON_DRIFTER",
  darksynth: "DARKSYNTH_OPERATIVE",
  chiptune: "8BIT_RUNNER",
  industrial: "STEEL_MACHINIST",
  vaporwave: "MALL_GHOST",
  "lo-fi": "RAINY_DAY_CODER",
  "drum&bass": "BREAKBEAT_COURIER",
  ambient: "ORBITAL_DREAMER",
};

import styles from "./StatisticiLog.module.css";

const LATIME_BARA = 20; // câte caractere are o bară de gen

/* 3725 secunde -> "01:02:05" */
function formatDurata(secunde) {
  const s = Math.floor(secunde);
  const ore = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [ore, min, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/* Ora unui rând de jurnal: "17:28:03" */
function formatOra(timestamp) {
  return new Date(timestamp).toLocaleTimeString("ro-RO", { hour12: false });
}

/* Suma valorilor unui obiect { a: 1, b: 2 } -> 3 */
const suma = (obiect) => Object.values(obiect).reduce((total, v) => total + v, 0);

export default function StatisticiLog({ statistici, likes, nrPlaylisturi, onReseteaza }) {
  /* --- Valori calculate din statistici --- */
  const timpTotal = suma(statistici.secunde);
  const porniriTotal = suma(statistici.porniri);
  const pieseUnice = Object.keys(statistici.porniri).length;

  // Genurile, de la cel mai ascultat la cel mai puțin
  const genuri = Object.entries(statistici.genuri)
    .map(([gen, secunde]) => ({ gen, secunde, procent: timpTotal > 0 ? secunde / timpTotal : 0 }))
    .sort((a, b) => b.secunde - a.secunde);
  const genTop = genuri.length > 0 ? genuri[0].gen : null;

  // Top 5 piese după timpul ascultat
  const topPiese = Object.entries(statistici.secunde)
    .map(([id, secunde]) => ({ id, secunde, titlu: statistici.titluri[id] ?? `TRACK #${id}` }))
    .sort((a, b) => b.secunde - a.secunde)
    .slice(0, 5);

  // Ultimele rânduri din jurnal (cel mai nou jos, ca într-un terminal)
  const ultimele = statistici.log.slice(-14);
  const joc = statistici.joc;

  return (
    <div className={styles.syslog}>
      {/* $ sysinfo */}
      <section className={styles.block}>
        <p className={styles.cmd}>$ sysinfo --user</p>
        <dl className={styles.info}>
          <dt>USER_CLASS</dt>
          <dd className={styles.accent}>{genTop ? CLASE[genTop] ?? "UNKNOWN_SIGNAL" : "NO_DATA_YET"}</dd>
          <dt>LISTEN_TIME</dt>
          <dd>{formatDurata(timpTotal)}</dd>
          <dt>TRACKS_LOADED</dt>
          <dd>{porniriTotal} ({pieseUnice} UNIQUE)</dd>
          <dt>SKIPS</dt>
          <dd>{statistici.skipuri}</dd>
          <dt>SCRATCHES</dt>
          <dd>{statistici.scratch}</dd>
          <dt>LIKED / PLAYLISTS</dt>
          <dd>{likes} / {nrPlaylisturi}</dd>
          <dt>LOG_SINCE</dt>
          <dd>{new Date(statistici.start).toLocaleString("ro-RO", { hour12: false })}</dd>
        </dl>
      </section>

      {/* $ genre: o bară ASCII pentru fiecare gen, în culorile lui (data-gen) */}
      <section className={styles.block}>
        <p className={styles.cmd}>$ genre --distribution</p>
        {genuri.length === 0 ? (
          <p className={styles.empty}>// press PLAY to start collecting data</p>
        ) : (
          <ul className={styles.bars}>
            {genuri.map((g) => {
              const pline = Math.round(g.procent * LATIME_BARA);
              return (
                <li key={g.gen} data-gen={g.gen}>
                  <span className={styles.barName}>{g.gen.toUpperCase()}</span>
                  <span className={styles.barAscii}>
                    {"█".repeat(pline)}
                    <span className={styles.barRest}>{"░".repeat(LATIME_BARA - pline)}</span>
                  </span>
                  <span className={styles.barPct}>{Math.round(g.procent * 100)}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* $ top */}
      <section className={styles.block}>
        <p className={styles.cmd}>$ top --tracks -n 5</p>
        {topPiese.length === 0 ? (
          <p className={styles.empty}>// no tracks played yet</p>
        ) : (
          <ol className={styles.top}>
            {topPiese.map((p) => (
              <li key={p.id}>
                <span className={styles.topTitle}>{p.titlu}</span>
                <span className={styles.topTime}>{formatDurata(p.secunde)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* $ game */}
      <section className={styles.block}>
        <p className={styles.cmd}>$ game --stats tunnel_runner</p>
        <dl className={styles.info}>
          <dt>RUNS</dt>
          <dd>{joc.runde}</dd>
          <dt>BEST_SCORE</dt>
          <dd className={styles.accent}>{String(joc.record).padStart(6, "0")}</dd>
          <dt>COLLISIONS</dt>
          <dd>{joc.lovituri}</dd>
          <dt>LASERS_FIRED</dt>
          <dd>{joc.lasere}</dd>
          <dt>BLOCKS_DESTROYED</dt>
          <dd>{joc.blocuri}</dd>
        </dl>
      </section>

      {/* $ tail: jurnalul, cu un cursor care clipește la final */}
      <section className={`${styles.block} ${styles.wide}`}>
        <p className={styles.cmd}>
          $ tail -n 14 /var/log/cyberwave.log
          <button type="button" className={styles.clear} onClick={onReseteaza}>
            $ clear
          </button>
        </p>
        <ol className={styles.lines}>
          {ultimele.map((r) => (
            <li key={r.id} className={styles[`log-${r.tip.toLowerCase()}`]}>
              <span className={styles.ora}>[{formatOra(r.ora)}]</span>
              <span className={styles.tip}>{r.tip}</span>
              <span className={styles.text}>{r.text}</span>
            </li>
          ))}
          <li className={styles.logCursor} aria-hidden="true">
            &gt; <span className="cursor">_</span>
          </li>
        </ol>
      </section>
    </div>
  );
}
