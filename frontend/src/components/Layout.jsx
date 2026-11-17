/* ============================================================
   CYBERWAVE // Layout.jsx
   Etapa 8: tot ce e comun tuturor paginilor, scris o singură dată:
     - antetul (titlul, butonul de temă, navigația cu NavLink);
     - păianjenul ASCII din fundal și subsolul;
     - bara de jos cu player-ul, jocul și notificările (toast).
   Pagina curentă se desenează în locul lui <Outlet />.

   Starea aplicației vine din useCyberwave(), apelat AICI: Layout
   rămâne montat cât navighezi, deci muzica nu se oprește când treci
   de la listă la detaliu sau la /despre. Paginile primesc aceeași
   stare prin <Outlet context={app} /> și o citesc cu useOutletContext().
   ============================================================ */

import { NavLink, Outlet } from "react-router-dom";
import useCyberwave from "../hooks/useCyberwave.js";
import PlayerBar from "./PlayerBar.jsx";
import JocTunel from "./JocTunel.jsx";
import styles from "./Layout.module.css";

/* Păianjenul ASCII din mockup, păstrat ca text.
   String.raw și backtick-urile păstrează exact spațiile și rândurile,
   pe care JSX altfel le-ar comprima. */
const PAIANJEN = String.raw`
            ;               ,
          ,;                 '.
         ;:                    :;
        ::                      ::
        ::                      ::
        ':                      :
         :.                    :
      ;' ::                    ::  '
    .'  ';                    ;'    '.
   ::    :;                  ;:     ::
   ;      :;.              ,;:      ::
   :;      :;:            ,;"      ::
   ::.      ':;  ;.,.;  ;:'      ,.;:
    "'"...   '::,::::: ;:    .;.;""'
        '"""....;:::::;,;.;"""
    .:::.....'"':::::::'",...;::::;.
   ;:' '""'"";.,;:::::;.'""""""  ':;
  ::'         ;::;:::;::..         :;
 ::         ,;:::::::::::;:..       '::
 ;'     ,;;:;::::::::::::::;";..     ':.
::      ;:"  ::::::"""'::::::  ":     ::
 :.    ::   ::::::;   :::::::  ::     ;'
  ;    ::   :::::::   :::::::  ::    ;'
   '   ::   ::::::....:::::'   ,:   '
    '  ::    :::::::::::::"    ::
       ::     ':::::::::"'     ::
       ':        """""""'      ::
        ::                    ;:
        ':;                  ;:"
          ';                ,;'
            "'             '"
              '           '`;

/* NavLink trimite isActive: adevărat când adresa curentă se potrivește
   cu ruta linkului. Așa se marchează pagina curentă, fără cod scris de mână. */
function navClass({ isActive }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link;
}

export default function Layout() {
  const app = useCyberwave();
  const { piesaCurenta, ruleaza, tema, mesaj, inJoc } = app;

  // is-playing e clasă GLOBALĂ (text, nu din modul): după ea pornesc
  // animațiile din alte componente (egalizatorul, unda, ON_DECK).
  const claseApp = ruleaza ? `${styles.app} is-playing` : styles.app;

  return (
    // data-gen alege paleta de culori a genului piesei de pe disc (vezi index.css)
    <div className={claseApp} data-gen={piesaCurenta ? piesaCurenta.gen : "all"}>
      {/* Păianjenul: fixat în fundal, pe stânga, la mijlocul paginii */}
      <pre className={styles.spider} aria-hidden="true">{PAIANJEN}</pre>

      <header className={styles.header}>
        {/* Etapa 5: butonul de temă. Textul arată tema în care se TRECE. */}
        <button
          type="button"
          className={styles.themeToggle}
          onClick={app.handleTema}
          aria-pressed={tema === "dark"}
        >
          {tema === "dark" ? "◐ LIGHT_MODE" : "◑ DARK_MODE"}
        </button>

        <div className={styles.titlu}>
          {/* "//" pus ca text între acolade, ca să nu fie confundat cu un comentariu */}
          <h1>{"// CYBERWAVE_OS"}</h1>
          <p>SYSTEM.AUDIO.INTERFACE_v1.0</p>
        </div>

        {/* Etapa 8: navigația între pagini. end pe "/" = potrivire exactă,
            altfel linkul spre / ar rămâne activ pe toate paginile. */}
        <nav className={styles.nav} data-testid="nav" aria-label="Pagini">
          <NavLink to="/" end className={navClass}>
            ≡ PIESE
          </NavLink>
          <NavLink to="/despre" className={navClass}>
            ⓘ DESPRE
          </NavLink>
        </nav>
      </header>

      {/* Aici apare pagina potrivită cu adresa. context = starea comună. */}
      <main className={styles.main}>
        <Outlet context={app} />
      </main>

      <footer className={styles.footer}>
        [SYS] END OF FILE / CYBERWAVE TERMINAL
      </footer>

      {/* Notificarea: apare doar când există un mesaj (key = animație nouă la fiecare mesaj) */}
      {mesaj && (
        <div className={styles.toast} key={mesaj.id} role="status">
          [SYS]: {mesaj.text}
        </div>
      )}

      {/* Jocul: stă PESTE pagină, deci muzica rămâne pornită dedesubt */}
      {inJoc && (
        <JocTunel
          piesa={piesaCurenta}
          ruleaza={ruleaza}
          onIesire={app.handleJoc}
          onEveniment={app.stats.evenimentJoc}
        />
      )}

      {/* Bara de jos: aceleași comenzi pe toate paginile */}
      <PlayerBar
        {...app.comenziPlayer}
        volum={app.volum}
        mut={app.mut}
        inJoc={inJoc}
        onVolum={app.handleVolum}
        onMut={() => app.setMut((prev) => !prev)}
        onJoc={app.handleJoc}
      />
    </div>
  );
}
