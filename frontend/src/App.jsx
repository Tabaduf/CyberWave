/* ============================================================
   CYBERWAVE // App.jsx
   Componenta principală a aplicației.
   Etapa 5: lista de piese stă în STATE (useState). Bifarea și
   ștergerea se fac din pagină, prin funcțiile imutabile din Etapa 2,
   iar contorul din antet se recalculează singur. Tot cu state,
   un buton din antet comută tema luminoasă / întunecată.
   Extra: muzica e generată în browser (audio/sintetizator.js),
   bara de jos controlează piesa și volumul, iar PLAY GAME
   deschide jocul Tunnel Runner peste pagină. Discul se poate
   "scratch-ui" ca la DJ, iar tabul SYS_LOG arată statisticile.
   Tabul FOR_YOU generează recomandări din statisticile de ascultare.
   Etapa 6: datele nu mai sunt în cod. Vin de la un API (json-server,
   din db.json) prin api.js, la deschiderea paginii, cu trei stări:
   se încarcă / a reușit / a eșuat.
   ============================================================ */

import { useState, useEffect } from "react";
import PiesaList from "./components/PiesaList.jsx";
import Player from "./components/Player.jsx";
import Genuri from "./components/Genuri.jsx";
import PlaylistGrid from "./components/PlaylistGrid.jsx";
import PlayerBar from "./components/PlayerBar.jsx";
import JocTunel from "./components/JocTunel.jsx";
import StatisticiLog from "./components/StatisticiLog.jsx";
import useStatistici from "./hooks/useStatistici.js";
import FeedList from "./components/FeedList.jsx";
import { profilAscultare, genereazaFeed } from "./recomandari.js";
import { porneste, opreste, seteazaVolum } from "./audio/sintetizator.js";
import { fetchPiese, fetchSugestii, fetchPlaylisturi } from "./api.js";


/* ------------------------------------------------------------
   DATELE (Etapa 6)
   Piesele, sugestiile și playlisturile nu mai sunt scrise aici:
   stau în frontend/db.json și sunt cerute de la API la pornire
   (vezi useEffect-ul de încărcare din App și fișierul api.js).
   Câmpurile unei piese: id, titlu, redata (bifat = PLAYED), format,
   gen, bpm, durata (secunde), liked (la pornire), cover (null = fără).
   ------------------------------------------------------------ */

/* Meniurile de sus */
const TABURI = [
  { id: "queue", text: "≡ QUEUE" },
  { id: "liked", text: "♥ LIKED_SONGS" },
  { id: "random", text: "⤨ RANDOM" },
  { id: "foryou", text: "✦ FOR_YOU" },
  { id: "playlists", text: "▤ PLAYLISTS" },
  { id: "syslog", text: "▣ SYS_LOG" },
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
  // Etapa 6: listele pornesc goale; se umplu când răspunde API-ul
  const [piese, setPiese] = useState([]);           // coada (lista principală)
  const [sugestii, setSugestii] = useState([]);     // panoul RANDOM
  const [loading, setLoading] = useState(true);     // se așteaptă răspunsul serverului
  const [error, setError] = useState(null);         // mesajul erorii, dacă cererea a eșuat
  const [incercare, setIncercare] = useState(0);    // crește la "RETRY" -> cererea se repetă
  const [tema, setTema] = useState(temaInitiala);             // funcția, fără (): rulează o singură dată

  const [tab, setTab] = useState("queue");          // panoul vizibil
  const [gen, setGen] = useState("all");            // filtrul de gen
  const [coadaIds, setCoadaIds] = useState([]);     // ordinea pentru ⏮ / ⏭
  const [curentId, setCurentId] = useState(null);   // piesa de pe disc (null = niciuna)
  const [ruleaza, setRuleaza] = useState(false);    // PLAY sau PAUSE
  const [timp, setTimp] = useState(0);              // secunde derulate
  const [rewind, setRewind] = useState(false);      // animația REPEAT e în curs
  const [scratching, setScratching] = useState(false); // mâna e pe disc (mod DJ)
  const [discRidicat, setDiscRidicat] = useState(false); // discul e luat de pe platan
  const [playlistTinta, setPlaylistTinta] = useState(null); // playlistul peste care e ținut discul
  const [animatiePlaylist, setAnimatiePlaylist] = useState(null); // efectul "+1" după drop
  const [pieseGenerate, setPieseGenerate] = useState([]); // piesele inventate pentru FOR_YOU
  const [feed, setFeed] = useState([]); // feed-ul curent: [{ id, potrivire, motiv }]

  // Statisticile și jurnalul, din hook-ul nostru (hooks/useStatistici.js)
  const stats = useStatistici();

  // Id-urile pieselor apreciate (pornim de la câmpul liked din date)
  // Id-urile pieselor apreciate (completate din câmpul liked, după încărcare)
  const [likedIds, setLikedIds] = useState([]);
  const [playlisturi, setPlaylisturi] = useState([]);

  /* --- ETAPA 6: ÎNCĂRCAREA DATELOR DE LA API ---
     Rulează după prima randare și din nou doar când se schimbă
     "incercare" (butonul RETRY). Funcția dată lui useEffect nu poate fi
     async, de aceea definim load() înăuntru și o apelăm imediat.
     Promise.all trimite cele 3 cereri deodată și așteaptă toate răspunsurile;
     dacă una eșuează, ajungem în catch. */
  useEffect(() => {
    let ignore = false; // devine true dacă App dispare înainte să sosească răspunsul

    async function load() {
      try {
        const [pieseApi, sugestiiApi, playlisturiApi] = await Promise.all([
          fetchPiese(),
          fetchSugestii(),
          fetchPlaylisturi(),
        ]);
        if (ignore) return;
        setPiese(pieseApi);
        setSugestii(sugestiiApi);
        setPlaylisturi(playlisturiApi);
        // liked din date -> lista de id-uri apreciate
        setLikedIds([...pieseApi, ...sugestiiApi].filter((p) => p.liked).map((p) => p.id));
        // Prima piesă din coadă ajunge pe disc (dacă există)
        setCoadaIds(pieseApi.map((p) => p.id));
        setCurentId(pieseApi.length > 0 ? pieseApi[0].id : null);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    // Curățarea efectului: răspunsurile care sosesc după aceasta sunt ignorate
    return () => {
      ignore = true;
    };
  }, [incercare]);

  // RETRY: înapoi la starea de încărcare, apoi efectul de mai sus cere din nou datele
  function handleReincearca() {
    setLoading(true);
    setError(null);
    setIncercare((n) => n + 1);
  }
  const [mesaj, setMesaj] = useState(null);         // notificarea de jos (toast)
  const [volum, setVolum] = useState(60);           // 0..100, din slider
  const [mut, setMut] = useState(false);            // sunet oprit din butonul difuzor
  const [inJoc, setInJoc] = useState(false);        // jocul e deschis peste pagină

  /* --- VALORI DERIVATE ---
     Se recalculează din state la fiecare randare, deci nu pot rămâne
     în urma datelor. Contorul din antet NU stă într-un useState separat. */
  const toatePiesele = [...piese, ...sugestii, ...pieseGenerate];

  // Profilul muzical, recalculat din statistici și like-uri la fiecare randare
  const profil = profilAscultare(stats.statistici, toatePiesele, likedIds);
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
    const piesa = toatePiesele.find((p) => p.id === id);
    stats.logheaza("MARK", `${piesa.redata ? "PENDING" : "PLAYED"} ${piesa.titlu}`);
    setPiese((prev) => prev.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p)));
    setSugestii((prev) => prev.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p)));
    setPieseGenerate((prev) => prev.map((p) => (p.id === id ? { ...p, redata: !p.redata } : p)));
  }

  // Ștergere: listă nouă fără piesa respectivă. Scoatem id-ul și din
  // liked, din playlisturi și din ordinea de redare, ca să nu rămână
  // trimiteri către o piesă care nu mai există.
  function handleDelete(id) {
    const piesa = toatePiesele.find((p) => p.id === id);

    setPiese((prev) => prev.filter((p) => p.id !== id));
    setSugestii((prev) => prev.filter((p) => p.id !== id));
    setPieseGenerate((prev) => prev.filter((p) => p.id !== id));
    setFeed((prev) => prev.filter((r) => r.id !== id));
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
    stats.logheaza("DELETE", piesa.titlu);
  }

  // Marchează piesa ca redată (la finalul ei), fără să o comute înapoi
  function marcheazaRedata(id) {
    setPiese((prev) => prev.map((p) => (p.id === id ? { ...p, redata: true } : p)));
    setSugestii((prev) => prev.map((p) => (p.id === id ? { ...p, redata: true } : p)));
    setPieseGenerate((prev) => prev.map((p) => (p.id === id ? { ...p, redata: true } : p)));
  }

  /* --- FOR_YOU: feed generat din statistici --- */

  // Feed nou: piese inventate pe gustul tău (vezi recomandari.js).
  // Păstrăm doar piesele generate care sunt încă folosite undeva
  // (liked, într-un playlist sau pe disc); restul se înlocuiesc cu cele noi.
  function handleRegenereaza() {
    const idMaxim = toatePiesele.reduce((max, p) => Math.max(max, p.id), 0);
    const primulId = Math.max(1000, idMaxim + 1); // id-uri noi, ca nextId din Etapa 2
    const rezultat = genereazaFeed(profil, Date.now() % 100000, primulId);

    const folosita = (id) =>
      likedIds.includes(id) || id === curentId || playlisturi.some((pl) => pl.pieseIds.includes(id));

    setPieseGenerate((prev) => [...prev.filter((p) => folosita(p.id)), ...rezultat.map((r) => r.piesa)]);
    setFeed(rezultat.map((r) => ({ id: r.piesa.id, potrivire: r.potrivire, motiv: r.motiv })));
    stats.logheaza("FEED", `${rezultat.length} TRACKS GENERATED FOR YOU`);
  }

  // + QUEUE: piesa trece din feed în coadă (lista principală)
  function handleAdaugaInCoada(piesa) {
    setPiese((prev) => [...prev, { ...piesa }]);
    setPieseGenerate((prev) => prev.filter((p) => p.id !== piesa.id));
    setFeed((prev) => prev.filter((r) => r.id !== piesa.id));
    arataMesaj(`ADDED TO QUEUE: ${piesa.titlu}`);
    stats.logheaza("QUEUE", `+ ${piesa.titlu}`);
  }

  // Schimbarea tabului; prima deschidere a lui FOR_YOU generează feed-ul
  function handleTab(id) {
    setTab(id);
    if (id === "foryou" && feed.length === 0) handleRegenereaza();
  }

  /* --- ETAPA 5: TEMA LUMINOASĂ / ÎNTUNECATĂ ---
     State-ul ține minte tema pentru textul butonului; atributul
     data-theme de pe <html> schimbă variabilele CSS (vezi App.css).
     Scrierea pe <html> se face aici, la click, nu în corpul componentei. */
  function handleTema() {
    const noua = tema === "dark" ? "light" : "dark";
    setTema(noua);
    document.documentElement.dataset.theme = noua;
    stats.logheaza("THEME", `${noua.toUpperCase()}_MODE`);
  }

  /* --- ACȚIUNI PLAYER --- */

  // Alege o piesă dintr-o listă: o pune pe disc și o pornește.
  // Ordinea listei devine ordinea pentru butoanele înainte / înapoi.
  function handleAlegePiesa(piesa, lista) {
    setCoadaIds(lista.map((p) => p.id));
    setCurentId(piesa.id);
    setTimp(0);
    setRuleaza(true);
    stats.adaugaPornire(piesa);
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
  // dinButon = true când utilizatorul a apăsat ⏮ / ⏭ (contează ca SKIP).
  function treciLa(directie, dinButon = false) {
    const lista = coadaIds.filter((id) => toatePiesele.some((p) => p.id === id));
    if (lista.length === 0) {
      setRuleaza(false);
      return;
    }
    const index = lista.indexOf(curentId);
    const nou = (index + directie + lista.length) % lista.length;
    setCurentId(lista[nou]);
    setTimp(0);

    if (dinButon && piesaCurenta) stats.adaugaSkip(piesaCurenta, directie);
    stats.adaugaPornire(toatePiesele.find((p) => p.id === lista[nou]));
  }

  // Înapoi: dacă piesa a trecut de 3 secunde, o ia de la capăt;
  // altfel sare la piesa anterioară (ca la playerele reale).
  function handleInapoi() {
    if (timp > 3) setTimp(0);
    else treciLa(-1, true);
  }

  // REPEAT: discul se învârte rapid înapoi, apoi piesa pornește de la 0
  function handleRepeat() {
    if (piesaCurenta) stats.logheaza("REPEAT", piesaCurenta.titlu);
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
    stats.logheaza(eraApreciata ? "UNLIKE" : "LIKE", piesa.titlu);
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
    stats.logheaza("PLAYLIST", `${exista ? "-" : "+"} ${playlist.nume}`);
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
    stats.logheaza("PLAYLIST", `NEW ${nume}`);
    return true;
  }

  // Play / pauză, cu rând în jurnal
  function handlePlayPause() {
    if (piesaCurenta) stats.logheaza(ruleaza ? "PAUSE" : "PLAY", piesaCurenta.titlu);
    setRuleaza((prev) => !prev);
  }

  /* --- MOD DJ (scratch pe vinil) ---
     Cât timp mâna e pe disc, ceasul piesei și sintetizatorul stau pe loc;
     rotirea discului mută timpul înainte sau înapoi. */
  function handleScratchStart() {
    setScratching(true);
  }

  function handleScratch(secunde) {
    // Timpul rămâne între începutul și (aproape de) finalul piesei
    setTimp((prev) => Math.min(Math.max(prev + secunde, 0), piesaCurenta.durata - 0.5));
  }

  function handleScratchEnd(totalSecunde) {
    setScratching(false);
    if (Math.abs(totalSecunde) > 0.2) stats.adaugaScratch(totalSecunde);
  }

  /* --- Discul ridicat de pe platan ---
     Cât e în mână, muzica stă. Lăsat jos -> revine și piesa continuă.
     Spart de un perete -> trecem la piesa următoare (contează ca SKIP). */
  function handleRidica() {
    setDiscRidicat(true);
    if (piesaCurenta) stats.logheaza("LIFT", piesaCurenta.titlu);
  }

  function handleRevenire() {
    setDiscRidicat(false);
    stats.logheaza("DROP", "DISC RETURNED TO PLATTER");
  }

  function handleSpart() {
    if (piesaCurenta) stats.logheaza("SHATTER", piesaCurenta.titlu);
    setDiscRidicat(false);
    treciLa(1, true);
  }

  /* --- Disc lăsat peste un playlist ---
     Piesa de pe disc intră în playlist (dacă nu era deja acolo),
     cardul face o mică animație, iar muzica pornește din nou. */
  function handleDropPlaylist(playlistId) {
    const playlist = playlisturi.find((pl) => pl.id === playlistId);
    const nou = !playlist.pieseIds.includes(curentId);

    if (nou) {
      setPlaylisturi((prev) =>
        prev.map((pl) => (pl.id === playlistId ? { ...pl, pieseIds: [...pl.pieseIds, curentId] } : pl))
      );
      arataMesaj(`DROPPED INTO ${playlist.nume}`);
      stats.logheaza("PLAYLIST", `+ ${playlist.nume} (DROP)`);
    } else {
      arataMesaj(`ALREADY IN ${playlist.nume}`);
    }

    // nonce = număr nou la fiecare drop, ca animația să pornească de fiecare dată
    setAnimatiePlaylist({ id: playlistId, nou, nonce: Date.now() });
    setPlaylistTinta(null);
    setDiscRidicat(false);
  }

  // Jocul: pornire / ieșire, ambele notate în jurnal
  function handleJoc() {
    stats.evenimentJoc(inJoc ? "iesire" : "start");
    setInJoc((prev) => !prev);
  }

  /* --- CEASUL PIESEI ---
     useEffect rulează DUPĂ fiecare randare a componentei.
     Cât timp e PLAY, programăm un pas de timp peste 0.25 s; pasul
     schimbă timpul -> componenta se redesenează -> se programează
     următorul pas. La final, piesa e marcată PLAYED și pornește următoarea.
     Funcția din return anulează pasul programat (ex.: s-a dat PAUSE). */
  useEffect(() => {
    if (!ruleaza || rewind || scratching || discRidicat || !piesaCurenta) return;

    const pas = setTimeout(() => {
      stats.adaugaAscultare(piesaCurenta, PAS); // statistici: încă 0.25 s ascultate
      if (timp + PAS >= piesaCurenta.durata) {
        stats.logheaza("END", piesaCurenta.titlu);
        marcheazaRedata(piesaCurenta.id);
        treciLa(1);
      } else {
        setTimp((prev) => prev + PAS);
      }
    }, PAS * 1000);

    return () => clearTimeout(pas);
  });

  /* --- SUNETUL ---
     useEffect sincronizează React cu un sistem din afara lui (Web Audio):
     când se schimbă piesa / PLAY / PAUSE, pornim sau oprim sintetizatorul.
     Dacă aceeași piesă cântă deja, porneste() nu face nimic. */
  useEffect(() => {
    if (ruleaza && !rewind && !scratching && !discRidicat && piesaCurenta) porneste(piesaCurenta);
    else opreste();
  }, [ruleaza, rewind, scratching, discRidicat, piesaCurenta]);

  // Volumul: la fiecare mișcare a slider-ului sau apăsare pe difuzor
  useEffect(() => {
    seteazaVolum(mut ? 0 : volum / 100);
  }, [volum, mut]);

  // La închiderea aplicației, muzica se oprește ([] = doar la montare / demontare)
  useEffect(() => () => opreste(), []);

  // Mutarea slider-ului pornește și sunetul, dacă era pe mut
  function handleVolum(v) {
    setVolum(v);
    setMut(false);
  }

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

  // Comenzile player-ului, folosite și de panoul din stânga, și de bara de jos
  const comenziPlayer = {
    piesa: piesaCurenta,
    ruleaza,
    timp,
    rewind,
    liked: likedIds.includes(curentId),
    onPlayPause: handlePlayPause,
    onInapoi: handleInapoi,
    onInainte: () => treciLa(1, true),
    onRepeat: handleRepeat,
    onDerulare: setTimp,
    onLike: () => handleLike(piesaCurenta),
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
          {loading
            ? "[SYS_MSG]: LINKING TO API..."
            : `[SYS_MSG]: ${piese.length} TRACKS FOUND. ${inAsteptare} PENDING. ${likedIds.length} LIKED.`}
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
              onClick={() => handleTab(t.id)}
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
        {/* Stânga: discul și comenzile ({...comenziPlayer} = aceleași props ca bara de jos) */}
        <Player
          {...comenziPlayer}
          scratching={scratching}
          discRidicat={discRidicat}
          onScratchStart={handleScratchStart}
          onScratch={handleScratch}
          onScratchEnd={handleScratchEnd}
          onRidica={handleRidica}
          onRevenire={handleRevenire}
          onSpart={handleSpart}
          onTintaPlaylist={setPlaylistTinta}
          onDropPlaylist={handleDropPlaylist}
          playlisturi={playlisturi}
          onComutaPlaylist={(playlistId) => handleComutaPlaylist(playlistId, curentId)}
          onCreeazaPlaylist={(nume) => handleCreeazaPlaylist(nume, piesaCurenta)}
        />

        {/* Dreapta: se desenează doar panoul tabului ales (randare condiționată).
            key={tab} face panoul nou la fiecare schimbare -> animația de intrare rulează din nou.
            {...actiuniCard} trimite toate câmpurile obiectului ca props separate. */}
        <section className="panel tab-panel" key={tab}>
          {/* ETAPA 6: cele trei stări ale încărcării.
              Cât se așteaptă: mesajul de încărcare. La eroare: ce s-a întâmplat
              și ce e de făcut. Abia după succes se desenează conținutul tabului. */}
          {loading && (
            <p className="info">
              [SYS]: LOADING TRACK DATABASE FROM API<span className="cursor">_</span>
            </p>
          )}
          {error && (
            <div className="error" role="alert">
              <p>
                [ERR]: COULD NOT LOAD DATA ({error}). IS THE API RUNNING? START IT WITH <code>npm run api</code> (PORT 3001), THEN RETRY.
              </p>
              <button type="button" className="error-retry" onClick={handleReincearca}>
                ⟳ RETRY
              </button>
            </div>
          )}
          {!loading && !error && (
            <>
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

          {tab === "foryou" && (
            <>
              <h2>&gt;&gt; FOR_YOU</h2>
              <FeedList
                profil={profil}
                // din id-uri -> piese, apoi filtrul de gen de sus
                feed={feed
                  .map((r) => ({ ...r, piesa: pieseGenerate.find((p) => p.id === r.id) }))
                  .filter((r) => r.piesa && (gen === "all" || r.piesa.gen === gen))}
                curentId={curentId}
                ruleaza={ruleaza}
                likedIds={likedIds}
                onAlege={handleAlegePiesa}
                onLike={handleLike}
                onAdaugaInCoada={handleAdaugaInCoada}
                onRegenereaza={handleRegenereaza}
              />
            </>
          )}

          {tab === "syslog" && (
            <>
              <h2>&gt;&gt; SYS_LOG</h2>
              <StatisticiLog
                statistici={stats.statistici}
                likes={likedIds.length}
                nrPlaylisturi={playlisturi.length}
                onReseteaza={stats.reseteaza}
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
                tintaId={playlistTinta}
                animatie={animatiePlaylist}
                onAlege={handleAlegePlaylist}
              />
            </>
          )}
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

      {/* Jocul: randare condiționată. Stă PESTE pagină, deci App și
          muzica rămân pornite dedesubt; la ieșire totul e cum l-ai lăsat. */}
      {inJoc && (
        <JocTunel
          piesa={piesaCurenta}
          ruleaza={ruleaza}
          onIesire={handleJoc}
          onEveniment={stats.evenimentJoc}
        />
      )}

      {/* Bara de jos, în stil Spotify (înlocuiește vizualizatorul din Etapa 1) */}
      <PlayerBar
        {...comenziPlayer}
        volum={volum}
        mut={mut}
        inJoc={inJoc}
        onVolum={handleVolum}
        onMut={() => setMut((prev) => !prev)}
        onJoc={handleJoc}
      />
    </div>
  );
}