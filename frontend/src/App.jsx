/* ============================================================
   CYBERWAVE // App.jsx
   Componenta principală a aplicației.
   Etapa 5: lista de piese stă în STATE (useState). Bifarea și
   ștergerea se fac din pagină, prin funcțiile imutabile din Etapa 2,
   iar contorul din antet se recalculează singur. Tot cu state,
   un buton din antet comută tema luminoasă / întunecată.
   Nu se redă sunet real: timpul piesei e simulat.
   ============================================================ */

import { useState, useEffect } from "react";
import PiesaList from "./components/PiesaList.jsx";
import Player from "./components/Player.jsx";
import Genuri from "./components/Genuri.jsx";
import PlaylistGrid from "./components/PlaylistGrid.jsx";


/* ------------------------------------------------------------
   DATE INIȚIALE (deasupra funcției App)
   Sunt doar valorile de PORNIRE, folosite o singură dată, la prima
   randare. De aici înainte, ce se afișează vine din state.
   Câmpuri: id, titlu, redata (bifat = PLAYED), format, gen, bpm,
   durata (secunde), liked (doar la pornire), cover (null = fără copertă).
   ------------------------------------------------------------ */
const PIESE_INITIALE = [
  { id: 1, titlu: "MASTER_BOOT_RECORD - CHKDSK", redata: false, format: "flac", gen: "darksynth", bpm: 140, durata: 252, liked: true, cover: "/covers/cover-01.svg" },
  { id: 2, titlu: "PERTURBATOR - FUTURE_CLUB", redata: true, format: "mp3", gen: "synthwave", bpm: 120, durata: 241, liked: true, cover: null },
  { id: 3, titlu: "KEYGEN_CHURCH - TENEBRE", redata: false, format: "synth", gen: "darksynth", bpm: 100, durata: 318, liked: false, cover: null },
];

/* Sugestiile din panoul RANDOM (câte una pe gen) */
const SUGESTII_INITIALE = [
  { id: 101, titlu: "NEON_GHOST - NIGHT_DRIVE.EXE", redata: false, format: "mp3", gen: "synthwave", bpm: 110, durata: 214, liked: false, cover: null },
  { id: 102, titlu: "VOID_RUNNER - KERNEL_PANIC", redata: false, format: "flac", gen: "industrial", bpm: 132, durata: 276, liked: false, cover: null },
  { id: 103, titlu: "8BIT_ORACLE - SAVE_STATE", redata: false, format: "synth", gen: "chiptune", bpm: 150, durata: 168, liked: false, cover: null },
  { id: 104, titlu: "MALL_ECHO - FOOD_COURT_94", redata: false, format: "mp3", gen: "vaporwave", bpm: 85, durata: 233, liked: false, cover: null },
  { id: 105, titlu: "RAINY_TERMINAL - CACHE_MISS", redata: false, format: "flac", gen: "lo-fi", bpm: 72, durata: 189, liked: false, cover: null },
  { id: 106, titlu: "SUBSTRATE - ORBITAL_DRIFT", redata: false, format: "flac", gen: "ambient", bpm: 60, durata: 402, liked: false, cover: null },
  { id: 107, titlu: "AMEN_PROTOCOL - PACKET_STORM", redata: false, format: "mp3", gen: "drum&bass", bpm: 174, durata: 225, liked: false, cover: null },
];

/* Playlisturile de la pornire: fiecare ține doar id-urile pieselor lui */
const PLAYLISTURI_INITIALE = [
  { id: 1, nume: "NIGHT_DRIVE", gen: "synthwave", pieseIds: [101, 2, 104] },
  { id: 2, nume: "BOOT_SEQUENCE", gen: "darksynth", pieseIds: [1, 3, 102] },
  { id: 3, nume: "CODE_FOCUS", gen: "lo-fi", pieseIds: [105, 106] },
  { id: 4, nume: "BOSS_FIGHT", gen: "chiptune", pieseIds: [103, 107] },
];

/* Meniurile de sus */
const TABURI = [
  { id: "queue", text: "≡ QUEUE" },
  { id: "liked", text: "♥ LIKED_SONGS" },
  { id: "random", text: "⤨ RANDOM" },
  { id: "playlists", text: "▤ PLAYLISTS" },
];

/* Cât avansează timpul simulat la fiecare pas (secunde) */
const PAS = 0.25;

/* Cât durează animația de derulare înapoi (milisecunde, la fel ca în CSS) */
const DURATA_REWIND = 900;

/* Tema de pornire: cea a sistemului de operare */
function temaInitiala() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

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
  /* --- STATE ---
     useState(valoareInițială) întoarce [valoarea, funcțiaDeSchimbare].
     Valoarea nu se modifică niciodată direct (fără push / splice / =):
     se apelează funcția cu o listă NOUĂ, iar React redesenează. */
  const [piese, setPiese] = useState(PIESE_INITIALE);         // coada (lista principală)
  const [sugestii, setSugestii] = useState(SUGESTII_INITIALE); // panoul RANDOM
  const [tema, setTema] = useState(temaInitiala);             // funcția, fără (): rulează o singură dată

  const [tab, setTab] = useState("queue");          // panoul vizibil
  const [gen, setGen] = useState("all");            // filtrul de gen
  const [coadaIds, setCoadaIds] = useState(PIESE_INITIALE.map((p) => p.id)); // ordinea pentru ⏮ / ⏭
  const [curentId, setCurentId] = useState(1);      // piesa de pe disc (null = niciuna)
  const [ruleaza, setRuleaza] = useState(false);    // PLAY sau PAUSE
  const [timp, setTimp] = useState(0);              // secunde derulate
  const [rewind, setRewind] = useState(false);      // animația REPEAT e în curs

  // Id-urile pieselor apreciate (pornim de la câmpul liked din date)
  const [likedIds, setLikedIds] = useState(
    [...PIESE_INITIALE, ...SUGESTII_INITIALE].filter((p) => p.liked).map((p) => p.id)
  );
  const [playlisturi, setPlaylisturi] = useState(PLAYLISTURI_INITIALE);
  const [mesaj, setMesaj] = useState(null);         // notificarea de jos (toast)

  /* --- VALORI DERIVATE ---
     Se recalculează din state la fiecare randare, deci nu pot rămâne
     în urma datelor. Contorul din antet NU stă într-un useState separat. */
  const toatePiesele = [...piese, ...sugestii];
  const piesaCurenta = toatePiesele.find((p) => p.id === curentId) ?? null;
  const inAsteptare = piese.filter((p) => !p.redata).length;
  const pieseApreciate = toatePiesele.filter((p) => likedIds.includes(p.id));

  // Păstrează doar elementele genului ales ("all" = toate)
  const filtreaza = (lista) => lista.filter((p) => gen === "all" || p.gen === gen);

  /* ------------------------------------------------------------
     ETAPA 5: BIFARE ȘI ȘTERGERE
     Prefixul handle = funcție care tratează o acțiune a utilizatorului.
     Forma cu funcție setPiese((prev) => ...) primește mereu cea mai
     recentă valoare a listei.
     O piesă e fie în coadă, fie în sugestii: aplicăm aceeași schimbare
     pe ambele liste, iar cea care nu conține id-ul rămâne neschimbată.
     ------------------------------------------------------------ */

  // Bifat <-> nebifat: listă nouă, obiect nou doar pentru piesa schimbată
  function handleToggleRedata(id) {
    setPiese((prev) => prev.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p)));
    setSugestii((prev) => prev.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p)));
  }

  // Ștergere: listă nouă fără piesa respectivă. Scoatem id-ul și din
  // liked, din playlisturi și din ordinea de redare, ca să nu rămână
  // trimiteri către o piesă care nu mai există.
  function handleDelete(id) {
    const piesa = toatePiesele.find((p) => p.id === id);

    setPiese((prev) => prev.filter((p) => p.id !== id));
    setSugestii((prev) => prev.filter((p) => p.id !== id));
    setLikedIds((prev) => prev.filter((x) => x !== id));
    setCoadaIds((prev) => prev.filter((x) => x !== id));
    setPlaylisturi((prev) =>
      prev.map((pl) => ({ ...pl, pieseIds: pl.pieseIds.filter((x) => x !== id) }))
    );

    // Dacă ștergem piesa de pe disc, oprim player-ul
    if (id === curentId) {
      setCurentId(null);
      setRuleaza(false);
      setTimp(0);
    }
    arataMesaj(`DELETED ${piesa.titlu}`);
  }

  // Marchează piesa ca redată (la finalul ei), fără să o comute înapoi
  function marcheazaRedata(id) {
    setPiese((prev) => prev.map((p) => (p.id === id ? { ...p, redata: true } : p)));
    setSugestii((prev) => prev.map((p) => (p.id === id ? { ...p, redata: true } : p)));
  }

  /* --- ETAPA 5: TEMA LUMINOASĂ / ÎNTUNECATĂ ---
     State-ul ține minte tema pentru textul butonului; atributul
     data-theme de pe <html> schimbă variabilele CSS (vezi App.css).
     Scrierea pe <html> se face aici, la click, nu în corpul componentei. */
  function handleTema() {
    const noua = tema === "dark" ? "light" : "dark";
    setTema(noua);
    document.documentElement.dataset.theme = noua;
  }

  /* --- ACȚIUNI PLAYER --- */

  // Alege o piesă dintr-o listă: o pune pe disc și o pornește.
  // Ordinea listei devine ordinea pentru butoanele înainte / înapoi.
  function handleAlegePiesa(piesa, lista) {
    setCoadaIds(lista.map((p) => p.id));
    setCurentId(piesa.id);
    setTimp(0);
    setRuleaza(true);
  }

  // Click pe un playlist: transformăm id-urile în piese și pornim prima
  function handleAlegePlaylist(playlist) {
    if (playlist.pieseIds.length === 0) {
      arataMesaj(`${playlist.nume} IS EMPTY`);
      return;
    }
    const lista = playlist.pieseIds.map((id) => toatePiesele.find((p) => p.id === id));
    handleAlegePiesa(lista[0], lista);
  }

  // Trece la piesa următoare (+1) sau anterioară (-1).
  // Păstrăm doar id-urile care încă există (unele pot fi șterse între timp).
  // % (restul împărțirii) face lista circulară: după ultima vine prima.
  function treciLa(directie) {
    const lista = coadaIds.filter((id) => toatePiesele.some((p) => p.id === id));
    if (lista.length === 0) {
      setRuleaza(false);
      return;
    }
    const index = lista.indexOf(curentId);
    const nou = (index + directie + lista.length) % lista.length;
    setCurentId(lista[nou]);
    setTimp(0);
  }

  // Înapoi: dacă piesa a trecut de 3 secunde, o ia de la capăt;
  // altfel sare la piesa anterioară (ca la playerele reale).
  function handleInapoi() {
    if (timp > 3) setTimp(0);
    else treciLa(-1);
  }

  // REPEAT: discul se învârte rapid înapoi, apoi piesa pornește de la 0
  function handleRepeat() {
    setRewind(true);
    setTimp(0); // brațul și bara de progres alunecă înapoi la început (tranziție CSS)
    setTimeout(() => {
      setRewind(false);
      setRuleaza(true);
    }, DURATA_REWIND);
  }

  /* --- ACȚIUNI LIKED / PLAYLISTURI (tot imutabile) --- */

  // Afișează o notificare scurtă jos pe ecran
  function arataMesaj(text) {
    setMesaj({ id: Date.now(), text }); // id nou -> animația pornește din nou
  }

  // ♥: dacă piesa e apreciată o scoatem, altfel o adăugăm
  function handleLike(piesa) {
    const eraApreciata = likedIds.includes(piesa.id);
    setLikedIds((prev) =>
      eraApreciata ? prev.filter((id) => id !== piesa.id) : [...prev, piesa.id]
    );
    arataMesaj(eraApreciata ? "♡ REMOVED FROM LIKED_SONGS" : "♥ ADDED TO LIKED_SONGS");
  }

  // Adaugă piesa în playlist sau o scoate, dacă era deja acolo
  function handleComutaPlaylist(playlistId, piesaId) {
    const playlist = playlisturi.find((pl) => pl.id === playlistId);
    const exista = playlist.pieseIds.includes(piesaId);

    setPlaylisturi((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl; // celelalte rămân neschimbate
        const pieseIds = exista
          ? pl.pieseIds.filter((id) => id !== piesaId)
          : [...pl.pieseIds, piesaId];
        return { ...pl, pieseIds }; // copie a playlistului, cu lista nouă
      })
    );
    arataMesaj(exista ? `REMOVED FROM ${playlist.nume}` : `ADDED TO ${playlist.nume}`);
  }

  // Playlist nou, care pornește cu piesa curentă.
  // Validare ca în Etapa 2: numele nu poate fi gol și nici repetat.
  function handleCreeazaPlaylist(numeBrut, piesa) {
    const nume = numeBrut.trim().toUpperCase().replace(/\s+/g, "_"); // "chill mix" -> "CHILL_MIX"
    if (nume === "") return false;
    if (playlisturi.some((pl) => pl.nume === nume)) {
      arataMesaj(`${nume} ALREADY EXISTS`);
      return false;
    }

    // id nou = cel mai mare id + 1 (aceeași idee ca nextId din Etapa 2)
    const id = playlisturi.reduce((max, pl) => Math.max(max, pl.id), 0) + 1;
    setPlaylisturi((prev) => [...prev, { id, nume, gen: piesa.gen, pieseIds: [piesa.id] }]);
    arataMesaj(`CREATED ${nume}`);
    return true;
  }

  /* --- CEASUL PIESEI ---
     useEffect rulează DUPĂ fiecare randare a componentei.
     Cât timp e PLAY, programăm un pas de timp peste 0.25 s; pasul
     schimbă timpul -> componenta se redesenează -> se programează
     următorul pas. La final, piesa e marcată PLAYED și pornește următoarea.
     Funcția din return anulează pasul programat (ex.: s-a dat PAUSE). */
  useEffect(() => {
    if (!ruleaza || rewind || !piesaCurenta) return;

    const pas = setTimeout(() => {
      if (timp + PAS >= piesaCurenta.durata) {
        marcheazaRedata(piesaCurenta.id);
        treciLa(1);
      } else {
        setTimp((prev) => prev + PAS);
      }
    }, PAS * 1000);

    return () => clearTimeout(pas);
  });

  /* Notificarea dispare singură după 2.2 s.
     Rulează doar când se schimbă mesajul ([mesaj] de la final). */
  useEffect(() => {
    if (!mesaj) return;
    const t = setTimeout(() => setMesaj(null), 2200);
    return () => clearTimeout(t);
  }, [mesaj]);

  // Funcțiile pentru carduri, aceleași pentru toate listele
  const actiuniCard = {
    curentId,
    ruleaza,
    likedIds,
    onAlege: handleAlegePiesa,
    onLike: handleLike,
    onToggle: handleToggleRedata,
    onDelete: handleDelete,
  };

  return (
    // data-gen alege paleta de culori a genului piesei de pe disc (vezi App.css)
    <div className={ruleaza ? "app is-playing" : "app"} data-gen={piesaCurenta ? piesaCurenta.gen : "all"}>
      {/* Păianjenul: fixat în fundal, pe stânga, la mijlocul paginii */}
      <pre className="ascii-spider" aria-hidden="true">{PAIANJEN}</pre>

      <header className="app-header">
        {/* Etapa 5: butonul de temă, primul în antet.
            Textul e derivat din state: arată tema în care se TRECE. */}
        <button
          type="button"
          className="theme-toggle"
          onClick={handleTema}
          aria-pressed={tema === "dark"}
        >
          {tema === "dark" ? "◐ LIGHT_MODE" : "◑ DARK_MODE"}
        </button>

        <div className="header-glitch">
          {/* "//" pus ca text între acolade, ca să nu fie confundat cu un comentariu */}
          <h1>{"// CYBERWAVE_OS"}</h1>
          <p>SYSTEM.AUDIO.INTERFACE_v1.0</p>
        </div>

        {/* Contorul: valori derivate din state, recalculate la fiecare randare */}
        <p className="app-count">
          [SYS_MSG]: {piese.length} TRACKS FOUND. {inAsteptare} PENDING. {likedIds.length} LIKED.
        </p>
      </header>

      {/* Meniurile de sus */}
      <nav className="top-nav" aria-label="Meniu">
        <div className="tabs" role="tablist">
          {TABURI.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "tab activ" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.text}
              {/* Numărul de piese apreciate, actualizat în timp real */}
              {t.id === "liked" && <span className="tab-count">{likedIds.length}</span>}
            </button>
          ))}
        </div>
        <Genuri gen={gen} onAlege={setGen} />
      </nav>

      <main className="container">
        {/* Stânga: discul și comenzile */}
        <Player
          piesa={piesaCurenta}
          ruleaza={ruleaza}
          timp={timp}
          rewind={rewind}
          liked={likedIds.includes(curentId)}
          playlisturi={playlisturi}
          onPlayPause={() => setRuleaza((prev) => !prev)}
          onInapoi={handleInapoi}
          onInainte={() => treciLa(1)}
          onRepeat={handleRepeat}
          onDerulare={setTimp}
          onLike={() => handleLike(piesaCurenta)}
          onComutaPlaylist={(playlistId) => handleComutaPlaylist(playlistId, curentId)}
          onCreeazaPlaylist={(nume) => handleCreeazaPlaylist(nume, piesaCurenta)}
        />

        {/* Dreapta: se desenează doar panoul tabului ales (randare condiționată).
            key={tab} face panoul nou la fiecare schimbare -> animația de intrare rulează din nou.
            {...actiuniCard} trimite toate câmpurile obiectului ca props separate. */}
        <section className="panel tab-panel" key={tab}>
          {tab === "queue" && (
            <>
              <h2>&gt;&gt; AUDIO_QUEUE</h2>
              <PiesaList
                piese={filtreaza(piese)}
                {...actiuniCard}
                mesajGol={gen === "all" ? undefined : "[SYS_MSG]: NO TRACKS OF THIS GENRE IN QUEUE."}
              />
            </>
          )}

          {tab === "liked" && (
            <>
              <h2>&gt;&gt; LIKED_SONGS</h2>
              <PiesaList
                piese={filtreaza(pieseApreciate)}
                {...actiuniCard}
                mesajGol="[SYS_MSG]: NO LIKED TRACKS HERE. PRESS ♡ ON A TRACK."
              />
            </>
          )}

          {tab === "random" && (
            <>
              <h2>&gt;&gt; RANDOM.SEED</h2>
              <PiesaList
                piese={filtreaza(sugestii)}
                {...actiuniCard}
                mesajGol="[SYS_MSG]: NOTHING TO SHUFFLE HERE."
              />
            </>
          )}

          {tab === "playlists" && (
            <>
              <h2>&gt;&gt; PLAYLISTS</h2>
              <PlaylistGrid
                playlisturi={filtreaza(playlisturi)}
                toatePiesele={toatePiesele}
                curentId={curentId}
                onAlege={handleAlegePlaylist}
              />
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        [SYS] END OF FILE / CYBERWAVE TERMINAL
      </footer>

      {/* Notificarea: apare doar când există un mesaj (key = animație nouă la fiecare mesaj) */}
      {mesaj && (
        <div className="toast" key={mesaj.id} role="status">
          [SYS]: {mesaj.text}
        </div>
      )}

      {/* Vizualizatorul animat doar din CSS, fixat la baza ecranului */}
      <div className="hud-visualizer">
        <div className="wave"></div>
      </div>
    </div>
  );
}