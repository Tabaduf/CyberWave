/* ============================================================
   CYBERWAVE // App.jsx
   Componenta principală a aplicației.
   Ține datele și STAREA aplicației (piesa de pe disc, play/pauză,
   timpul derulat, piesele apreciate, playlisturile) și le trimite
   prin props către componentele care le afișează.
   Nu se redă sunet real: timpul piesei e simulat.
   ============================================================ */

import { useState, useEffect } from "react";
import PiesaList from "./components/PiesaList.jsx";
import Player from "./components/Player.jsx";
import Genuri from "./components/Genuri.jsx";
import PlaylistGrid from "./components/PlaylistGrid.jsx";


/* ------------------------------------------------------------
   DATE (deasupra funcției App)
   Codul de aici rulează o singură dată. Tot ce e în interiorul
   lui App se recreează la fiecare actualizare a ecranului.
   Câmpuri noi față de Etapa 2: gen, bpm, durata (secunde), liked, cover.
   cover: null -> pe disc apare "no img found :("
   liked e doar valoarea de PORNIRE; apoi aprecierile trăiesc în stare.
   ------------------------------------------------------------ */
const piese = [
  { id: 1, titlu: "MASTER_BOOT_RECORD - CHKDSK", redata: false, format: "flac", gen: "darksynth", bpm: 140, durata: 252, liked: true, cover: "/covers/cover-01.svg" },
  { id: 2, titlu: "PERTURBATOR - FUTURE_CLUB", redata: true, format: "mp3", gen: "synthwave", bpm: 120, durata: 241, liked: true, cover: null },
  { id: 3, titlu: "KEYGEN_CHURCH - TENEBRE", redata: false, format: "synth", gen: "darksynth", bpm: 100, durata: 318, liked: false, cover: null },
];

/* Sugestii pentru panoul RANDOM (date de test, câte una pe gen) */
const sugestii = [
  { id: 101, titlu: "NEON_GHOST - NIGHT_DRIVE.EXE", redata: false, format: "mp3", gen: "synthwave", bpm: 110, durata: 214, liked: false, cover: null },
  { id: 102, titlu: "VOID_RUNNER - KERNEL_PANIC", redata: false, format: "flac", gen: "industrial", bpm: 132, durata: 276, liked: false, cover: null },
  { id: 103, titlu: "8BIT_ORACLE - SAVE_STATE", redata: false, format: "synth", gen: "chiptune", bpm: 150, durata: 168, liked: false, cover: null },
  { id: 104, titlu: "MALL_ECHO - FOOD_COURT_94", redata: false, format: "mp3", gen: "vaporwave", bpm: 85, durata: 233, liked: false, cover: null },
  { id: 105, titlu: "RAINY_TERMINAL - CACHE_MISS", redata: false, format: "flac", gen: "lo-fi", bpm: 72, durata: 189, liked: false, cover: null },
  { id: 106, titlu: "SUBSTRATE - ORBITAL_DRIFT", redata: false, format: "flac", gen: "ambient", bpm: 60, durata: 402, liked: false, cover: null },
  { id: 107, titlu: "AMEN_PROTOCOL - PACKET_STORM", redata: false, format: "mp3", gen: "drum&bass", bpm: 174, durata: 225, liked: false, cover: null },
];

/* Toate piesele într-un singur array, ca să găsim orice piesă după id */
const toatePiesele = [...piese, ...sugestii];

/* Playlisturile de la pornire: fiecare ține doar id-urile pieselor lui.
   După pornire, playlisturile trăiesc în stare (se pot modifica). */
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
  /* --- STARE ---
     useState(valoareInițială) întoarce [valoarea, funcțiaDeSchimbare].
     Când apelăm funcția, React redesenează componenta cu valoarea nouă. */
  const [tab, setTab] = useState("queue");          // panoul vizibil
  const [gen, setGen] = useState("all");            // filtrul de gen
  const [coada, setCoada] = useState(piese);        // lista prin care merg ⏮ / ⏭
  const [curentId, setCurentId] = useState(1);      // piesa de pe disc
  const [ruleaza, setRuleaza] = useState(false);    // PLAY sau PAUSE
  const [timp, setTimp] = useState(0);              // secunde derulate
  const [rewind, setRewind] = useState(false);      // animația REPEAT e în curs

  // Id-urile pieselor apreciate (pornim de la câmpul liked din date)
  const [likedIds, setLikedIds] = useState(
    toatePiesele.filter((p) => p.liked).map((p) => p.id)
  );
  const [playlisturi, setPlaylisturi] = useState(PLAYLISTURI_INITIALE);
  const [mesaj, setMesaj] = useState(null);         // notificarea de jos (toast)

  /* --- VALORI CALCULATE din stare și date --- */
  const piesaCurenta = toatePiesele.find((p) => p.id === curentId);
  const inAsteptare = piese.filter((p) => !p.redata).length;
  const pieseApreciate = toatePiesele.filter((p) => likedIds.includes(p.id));

  // Păstrează doar elementele genului ales ("all" = toate)
  const filtreaza = (lista) => lista.filter((p) => gen === "all" || p.gen === gen);

  /* --- ACȚIUNI PLAYER --- */

  // Alege o piesă dintr-o listă: o pune pe disc și o pornește.
  // Lista devine "coada" prin care merg butoanele înainte / înapoi.
  function alegePiesa(piesa, lista) {
    setCoada(lista);
    setCurentId(piesa.id);
    setTimp(0);
    setRuleaza(true);
  }

  // Click pe un playlist: transformăm id-urile în piese și pornim prima
  function alegePlaylist(playlist) {
    if (playlist.pieseIds.length === 0) {
      arataMesaj(`${playlist.nume} IS EMPTY`);
      return;
    }
    const lista = playlist.pieseIds.map((id) => toatePiesele.find((p) => p.id === id));
    alegePiesa(lista[0], lista);
  }

  // Trece la piesa următoare (+1) sau anterioară (-1) din coadă.
  // % (restul împărțirii) face lista circulară: după ultima vine prima.
  function treciLa(directie) {
    const index = coada.findIndex((p) => p.id === curentId);
    const nou = (index + directie + coada.length) % coada.length;
    setCurentId(coada[nou].id);
    setTimp(0);
  }

  // Înapoi: ca la playerele reale, dacă piesa a trecut de 3 secunde,
  // prima apăsare o ia de la capăt; altfel sare la piesa anterioară.
  function inapoi() {
    if (timp > 3) setTimp(0);
    else treciLa(-1);
  }

  // REPEAT: discul se învârte rapid înapoi, apoi piesa pornește de la 0
  function repeta() {
    setRewind(true);
    setTimp(0); // brațul și bara de progres alunecă înapoi la început (tranziție CSS)
    setTimeout(() => {
      setRewind(false);
      setRuleaza(true);
    }, DURATA_REWIND);
  }

  /* --- ACȚIUNI LIKED / PLAYLISTURI ---
     Aceleași reguli ca în Etapa 2: nu modificăm array-ul vechi,
     ci construim unul NOU (filter, map, spread). Așa React vede
     schimbarea și redesenează imediat tot ce depinde de el. */

  // Afișează o notificare scurtă jos pe ecran
  function arataMesaj(text) {
    setMesaj({ id: Date.now(), text }); // id nou -> animația pornește din nou
  }

  // ♥: dacă piesa e apreciată o scoatem, altfel o adăugăm
  function comutaLike(piesa) {
    if (likedIds.includes(piesa.id)) {
      setLikedIds(likedIds.filter((id) => id !== piesa.id));
      arataMesaj(`♡ REMOVED FROM LIKED_SONGS`);
    } else {
      setLikedIds([...likedIds, piesa.id]);
      arataMesaj(`♥ ADDED TO LIKED_SONGS`);
    }
  }

  // Adaugă piesa în playlist sau o scoate, dacă era deja acolo
  function comutaInPlaylist(playlistId, piesaId) {
    const playlist = playlisturi.find((pl) => pl.id === playlistId);
    const exista = playlist.pieseIds.includes(piesaId);

    setPlaylisturi(
      playlisturi.map((pl) => {
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
  function creeazaPlaylist(numeBrut, piesa) {
    const nume = numeBrut.trim().toUpperCase().replace(/\s+/g, "_"); // "chill mix" -> "CHILL_MIX"
    if (nume === "") return false;
    if (playlisturi.some((pl) => pl.nume === nume)) {
      arataMesaj(`${nume} ALREADY EXISTS`);
      return false;
    }

    // id nou = cel mai mare id + 1 (aceeași idee ca nextId din Etapa 2)
    const id = playlisturi.reduce((max, pl) => Math.max(max, pl.id), 0) + 1;
    setPlaylisturi([...playlisturi, { id, nume, gen: piesa.gen, pieseIds: [piesa.id] }]);
    arataMesaj(`CREATED ${nume}`);
    return true;
  }

  /* --- CEASUL PIESEI ---
     useEffect rulează DUPĂ fiecare desenare a componentei.
     Cât timp e PLAY, programăm un pas de timp peste 0.25 s; pasul
     schimbă timpul -> componenta se redesenează -> se programează
     următorul pas. La final de piesă trecem la următoarea.
     Funcția din return anulează pasul programat (ex.: s-a dat PAUSE). */
  useEffect(() => {
    if (!ruleaza || rewind || !piesaCurenta) return;

    const pas = setTimeout(() => {
      if (timp + PAS >= piesaCurenta.durata) treciLa(1);
      else setTimp(timp + PAS);
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

  return (
    // data-gen alege paleta de culori a genului piesei de pe disc (vezi App.css)
    <div className={ruleaza ? "app is-playing" : "app"} data-gen={piesaCurenta ? piesaCurenta.gen : "all"}>
      {/* Păianjenul: fixat în fundal, pe stânga, la mijlocul paginii */}
      <pre className="ascii-spider" aria-hidden="true">{PAIANJEN}</pre>

      <header className="app-header">
        <div className="header-glitch">
          {/* "//" pus ca text între acolade, ca să nu fie confundat cu un comentariu */}
          <h1>{"// CYBERWAVE_OS"}</h1>
          <p>SYSTEM.AUDIO.INTERFACE_v1.0</p>
        </div>

        {/* Contorul se recalculează automat când se schimbă datele sau starea */}
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
          onPlayPause={() => setRuleaza(!ruleaza)}
          onInapoi={inapoi}
          onInainte={() => treciLa(1)}
          onRepeat={repeta}
          onDerulare={setTimp}
          onLike={() => comutaLike(piesaCurenta)}
          onComutaPlaylist={(playlistId) => comutaInPlaylist(playlistId, curentId)}
          onCreeazaPlaylist={(nume) => creeazaPlaylist(nume, piesaCurenta)}
        />

        {/* Dreapta: se desenează doar panoul tabului ales (randare condiționată).
            key={tab} face panoul nou la fiecare schimbare -> animația de intrare rulează din nou. */}
        <section className="panel tab-panel" key={tab}>
          {tab === "queue" && (
            <>
              <h2>&gt;&gt; AUDIO_QUEUE</h2>
              <PiesaList
                piese={filtreaza(piese)}
                curentId={curentId}
                ruleaza={ruleaza}
                likedIds={likedIds}
                onAlege={alegePiesa}
                onLike={comutaLike}
                mesajGol={gen === "all" ? undefined : "[SYS_MSG]: NO TRACKS OF THIS GENRE IN QUEUE."}
              />
            </>
          )}

          {tab === "liked" && (
            <>
              <h2>&gt;&gt; LIKED_SONGS</h2>
              <PiesaList
                piese={filtreaza(pieseApreciate)}
                curentId={curentId}
                ruleaza={ruleaza}
                likedIds={likedIds}
                onAlege={alegePiesa}
                onLike={comutaLike}
                mesajGol="[SYS_MSG]: NO LIKED TRACKS HERE. PRESS ♡ ON A TRACK."
              />
            </>
          )}

          {tab === "random" && (
            <>
              <h2>&gt;&gt; RANDOM.SEED</h2>
              <PiesaList
                piese={filtreaza(sugestii)}
                curentId={curentId}
                ruleaza={ruleaza}
                likedIds={likedIds}
                onAlege={alegePiesa}
                onLike={comutaLike}
                mesajGol="[SYS_MSG]: NOTHING TO SHUFFLE IN THIS GENRE."
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
                onAlege={alegePlaylist}
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