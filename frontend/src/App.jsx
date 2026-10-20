/* ============================================================
   CYBERWAVE // App.jsx
   Componenta principală a aplicației.
   Ține datele, afișează antetul cu valori calculate și
   trimite lista de piese către PiesaList (Etapa 4).
   ============================================================ */

import PiesaList from "./components/PiesaList.jsx";


/* ------------------------------------------------------------
   DATE (deasupra funcției App)
   Codul de aici rulează o singură dată. Tot ce e în interiorul
   lui App se recreează la fiecare actualizare a ecranului.
   ------------------------------------------------------------ */
const piese = [
  { id: 1, titlu: "MASTER_BOOT_RECORD - CHKDSK", redata: true, format: "flac" },
  { id: 2, titlu: "PERTURBATOR - FUTURE_CLUB", redata: true, format: "mp3" },
  { id: 3, titlu: "KEYGEN_CHURCH - TENEBRE", redata: false, format: "synth" },
];

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


/* ------------------------------------------------------------
   COMPONENTA PRINCIPALĂ
   ------------------------------------------------------------ */
export default function App() {
  // Valoare calculată din date (aceeași logică ca numaraInAsteptare din Etapa 2)
  const inAsteptare = piese.filter((p) => !p.redata).length;

  return (
    <>
      {/* Antetul din mockup: class -> className, numerele între acolade */}
      <header className="app-header">
        <pre className="ascii-spider">{PAIANJEN}</pre>

        <div className="header-glitch">
          {/* "//" pus ca text între acolade, ca să nu fie confundat cu un comentariu */}
          <h1>{"// CYBERWAVE_OS"}</h1>
          <p>SYSTEM.AUDIO.INTERFACE_v1.0</p>
        </div>

        {/* Contorul se recalculează automat când se schimbă array-ul */}
        <p className="app-count">
          [SYS_MSG]: {piese.length} TRACKS FOUND. {inAsteptare} PENDING.
        </p>
      </header>

      <main className="container">
        <section className="panel">
          <h2>&gt;&gt; AUDIO_QUEUE</h2>
          {/* Trimitem tot array-ul prin props-ul "piese";
              PiesaList desenează câte un card pentru fiecare piesă */}
          <PiesaList piese={piese} />
        </section>
      </main>

      <footer className="app-footer">
        [SYS] END OF FILE / CYBERWAVE TERMINAL
      </footer>

      {/* Vizualizatorul animat doar din CSS, fixat la baza ecranului */}
      <div className="hud-visualizer">
        <div className="wave"></div>
      </div>
    </>
  );
}