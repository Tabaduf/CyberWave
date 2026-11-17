/* ============================================================
   CYBERWAVE // hooks/useCyberwave.js
   Etapa 8: starea comună a aplicației (datele de la API, player-ul,
   muzica, jocul, like-urile, playlisturile), mutată din App.jsx.

   De ce un hook și nu direct în pagina cu lista (ca TaskuriPage
   din ghid)? Pentru că muzica trebuie să cânte în continuare când
   navighezi pe pagina de detaliu sau pe /despre. Hook-ul e apelat
   o singură dată, în Layout, care rămâne montat pe toate paginile;
   paginile primesc rezultatul prin <Outlet context={...} />.

   Istoric (din comentariile App.jsx):
   Etapa 5: lista de piese stă în STATE; tema luminoasă / întunecată.
   Etapa 6: datele vin de la API (json-server) prin api.js, cu trei
   stări: se încarcă / a reușit / a eșuat.
   Etapa 7: adăugarea, bifarea, ștergerea, like-urile și playlisturile
   se salvează pe server. Regula: ÎNTÂI serverul, APOI state-ul.
   ============================================================ */

import { useState, useEffect } from "react";
import useStatistici from "./useStatistici.js";
import { profilAscultare, genereazaFeed } from "../recomandari.js";
import { porneste, opreste, seteazaVolum } from "../audio/sintetizator.js";
import {
  fetchPiese,
  fetchSugestii,
  fetchPlaylisturi,
  createPiesa,
  updatePiesa,
  deletePiesa,
  updateSugestie,
  deleteSugestie,
  createPlaylist,
  updatePlaylist,
} from "../api.js";

/* Cât avansează timpul simulat la fiecare pas (secunde) */
const PAS = 0.25;

/* Cât durează animația de derulare înapoi (milisecunde, la fel ca în CSS) */
const DURATA_REWIND = 900;

/* Tema de pornire: cea a sistemului de operare */
function temaInitiala() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function useCyberwave() {
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
  const [tema, setTema] = useState(temaInitiala);   // funcția, fără (): rulează o singură dată

  // Etapa 8: tabul și genul stau aici, nu în pagină, ca la întoarcerea
  // de pe pagina de detaliu lista să fie exact cum ai lăsat-o
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

  // Id-urile pieselor apreciate (completate din câmpul liked, după încărcare)
  const [likedIds, setLikedIds] = useState([]);
  const [playlisturi, setPlaylisturi] = useState([]);

  const [mesaj, setMesaj] = useState(null);         // notificarea de jos (toast)
  const [volum, setVolum] = useState(60);           // 0..100, din slider
  const [mut, setMut] = useState(false);            // sunet oprit din butonul difuzor
  const [inJoc, setInJoc] = useState(false);        // jocul e deschis peste pagină

  /* --- ETAPA 6: ÎNCĂRCAREA DATELOR DE LA API ---
     Rulează după prima randare și din nou doar când se schimbă
     "incercare" (butonul RETRY). Promise.all trimite cele 3 cereri
     deodată și așteaptă toate răspunsurile; dacă una eșuează, ajungem în catch. */
  useEffect(() => {
    let ignore = false; // devine true dacă Layout dispare înainte să sosească răspunsul

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
        if (!ignore) setError(`COULD NOT LOAD DATA (${err.message})`);
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

  /* --- VALORI DERIVATE ---
     Se recalculează din state la fiecare randare, deci nu pot rămâne
     în urma datelor. Contorul NU stă într-un useState separat. */
  const toatePiesele = [...piese, ...sugestii, ...pieseGenerate];

  // Profilul muzical, recalculat din statistici și like-uri la fiecare randare
  const profil = profilAscultare(stats.statistici, toatePiesele, likedIds);
  const piesaCurenta = toatePiesele.find((p) => p.id === curentId) ?? null;
  const inAsteptare = piese.filter((p) => !p.redata).length;
  const pieseApreciate = toatePiesele.filter((p) => likedIds.includes(p.id));

  // Păstrează doar elementele genului ales ("all" = toate)
  const filtreaza = (lista) => lista.filter((p) => gen === "all" || p.gen === gen);

  /* ------------------------------------------------------------
     ETAPA 7: SALVAREA PE SERVER
     O piesă poate sta în 3 locuri: coada (/piese), sugestiile
     (/sugestii) sau feed-ul FOR_YOU (generat local, nu e pe server).
     resursaPiesei spune unde e, ca să știm ce cerere trimitem.
     Etapa 8: tot ea alege adresa paginii de detaliu.
     ------------------------------------------------------------ */
  function resursaPiesei(id) {
    if (piese.some((p) => p.id === id)) return "piese";
    if (sugestii.some((p) => p.id === id)) return "sugestii";
    return null; // piesă generată în FOR_YOU: modificările rămân locale
  }

  // PATCH pe resursa potrivită; întoarce piesa așa cum a salvat-o serverul
  function salveazaPiesa(resursa, id, schimbari) {
    return resursa === "piese" ? updatePiesa(id, schimbari) : updateSugestie(id, schimbari);
  }

  // Pune în listă obiectul ÎNTORS DE SERVER (nu o copie făcută local)
  function inlocuiestePiesa(resursa, actualizata) {
    const inlocuieste = (prev) => prev.map((p) => (p.id === actualizata.id ? actualizata : p));
    if (resursa === "piese") setPiese(inlocuieste);
    else if (resursa === "sugestii") setSugestii(inlocuieste);
    else setPieseGenerate(inlocuieste);
  }

  // Eroare la o salvare: mesajul apare deasupra listei, iar lista rămâne pe ecran
  function eroareSalvare(err) {
    setError(`COULD NOT SAVE CHANGES (${err.message})`);
  }

  // Afișează o notificare scurtă jos pe ecran
  function arataMesaj(text) {
    setMesaj({ id: Date.now(), text }); // id nou -> animația pornește din nou
  }

  // Adăugarea din formular. Fără try: eroarea ajunge înapoi în PiesaForm,
  // care o afișează lângă câmpuri și păstrează textul scris.
  async function handleAdd(piesaNoua) {
    const creata = await createPiesa(piesaNoua); // serverul întoarce piesa CU id
    setPiese((prev) => [...prev, creata]);
    setCoadaIds((prev) => [...prev, creata.id]);
    if (curentId === null) setCurentId(creata.id); // coada era goală: piesa nouă ajunge pe disc
    setError(null);
    arataMesaj(`ADDED: ${creata.titlu}`);
    stats.logheaza("ADD", creata.titlu);
  }

  // Bifat <-> nebifat: PATCH doar cu câmpul schimbat, apoi piesa întoarsă de server
  async function handleToggleRedata(id) {
    const piesa = toatePiesele.find((p) => p.id === id);
    const resursa = resursaPiesei(id);
    try {
      const actualizata = resursa
        ? await salveazaPiesa(resursa, id, { redata: !piesa.redata })
        : { ...piesa, redata: !piesa.redata }; // piesă din FOR_YOU: doar local
      inlocuiestePiesa(resursa, actualizata);
      stats.logheaza("MARK", `${actualizata.redata ? "PLAYED" : "PENDING"} ${piesa.titlu}`);
    } catch (err) {
      eroareSalvare(err);
    }
  }

  // Ștergere: DELETE pe server, apoi scoatem piesa și din playlisturile care o conțin
  // (și ele salvate pe server), din liked și din ordinea de redare.
  async function handleDelete(id) {
    const piesa = toatePiesele.find((p) => p.id === id);
    const resursa = resursaPiesei(id);
    try {
      if (resursa === "piese") await deletePiesa(id);
      if (resursa === "sugestii") await deleteSugestie(id);

      // Playlisturile care conțineau piesa: PATCH cu lista fără ea
      const afectate = playlisturi.filter((pl) => pl.pieseIds.includes(id));
      const salvate = await Promise.all(
        afectate.map((pl) => updatePlaylist(pl.id, { pieseIds: pl.pieseIds.filter((x) => x !== id) }))
      );
      setPlaylisturi((prev) => prev.map((pl) => salvate.find((s) => s.id === pl.id) ?? pl));

      setPiese((prev) => prev.filter((p) => p.id !== id));
      setSugestii((prev) => prev.filter((p) => p.id !== id));
      setPieseGenerate((prev) => prev.filter((p) => p.id !== id));
      setFeed((prev) => prev.filter((r) => r.id !== id));
      setLikedIds((prev) => prev.filter((x) => x !== id));
      setCoadaIds((prev) => prev.filter((x) => x !== id));

      // Dacă ștergem piesa de pe disc, oprim player-ul
      if (id === curentId) {
        setCurentId(null);
        setRuleaza(false);
        setTimp(0);
      }
      arataMesaj(`DELETED ${piesa.titlu}`);
      stats.logheaza("DELETE", piesa.titlu);
    } catch (err) {
      eroareSalvare(err);
    }
  }

  // Piesa s-a terminat: o marcăm PLAYED (și pe server), fără să o comutăm înapoi
  async function marcheazaRedata(id) {
    const piesa = toatePiesele.find((p) => p.id === id);
    if (!piesa || piesa.redata) return;
    const resursa = resursaPiesei(id);
    try {
      const actualizata = resursa ? await salveazaPiesa(resursa, id, { redata: true }) : { ...piesa, redata: true };
      inlocuiestePiesa(resursa, actualizata);
    } catch (err) {
      eroareSalvare(err);
    }
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

  // + QUEUE: piesa trece din feed în coadă, deci acum se salvează pe server.
  // Serverul îi dă un id nou, așa că înlocuim id-ul vechi (cel generat local)
  // peste tot unde apărea: liked, disc, ordinea de redare și playlisturi.
  async function handleAdaugaInCoada(piesa) {
    const idVechi = piesa.id;
    const date = { ...piesa, liked: likedIds.includes(idVechi) };
    delete date.id; // POST fără id
    try {
      const creata = await createPiesa(date);
      const schimbaId = (id) => (id === idVechi ? creata.id : id);

      const afectate = playlisturi.filter((pl) => pl.pieseIds.includes(idVechi));
      const salvate = await Promise.all(
        afectate.map((pl) => updatePlaylist(pl.id, { pieseIds: pl.pieseIds.map(schimbaId) }))
      );
      setPlaylisturi((prev) => prev.map((pl) => salvate.find((s) => s.id === pl.id) ?? pl));

      setPiese((prev) => [...prev, creata]);
      setPieseGenerate((prev) => prev.filter((p) => p.id !== idVechi));
      setFeed((prev) => prev.filter((r) => r.id !== idVechi));
      setLikedIds((prev) => prev.map(schimbaId));
      setCoadaIds((prev) => prev.map(schimbaId));
      if (curentId === idVechi) setCurentId(creata.id);

      arataMesaj(`ADDED TO QUEUE: ${creata.titlu}`);
      stats.logheaza("QUEUE", `+ ${creata.titlu}`);
    } catch (err) {
      eroareSalvare(err);
    }
  }

  // Schimbarea tabului; prima deschidere a lui FOR_YOU generează feed-ul
  function handleTab(id) {
    setTab(id);
    if (id === "foryou" && feed.length === 0) handleRegenereaza();
  }

  /* --- ETAPA 5: TEMA LUMINOASĂ / ÎNTUNECATĂ ---
     State-ul ține minte tema pentru textul butonului; atributul
     data-theme de pe <html> schimbă variabilele CSS (vezi index.css).
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

  // ♥: dacă piesa e apreciată o scoatem, altfel o adăugăm (câmpul liked, salvat pe server)
  async function handleLike(piesa) {
    const eraApreciata = likedIds.includes(piesa.id);
    const resursa = resursaPiesei(piesa.id);
    try {
      if (resursa) {
        const actualizata = await salveazaPiesa(resursa, piesa.id, { liked: !eraApreciata });
        inlocuiestePiesa(resursa, actualizata);
      }
      setLikedIds((prev) =>
        eraApreciata ? prev.filter((id) => id !== piesa.id) : [...prev, piesa.id]
      );
      arataMesaj(eraApreciata ? "♡ REMOVED FROM LIKED_SONGS" : "♥ ADDED TO LIKED_SONGS");
      stats.logheaza(eraApreciata ? "UNLIKE" : "LIKE", piesa.titlu);
    } catch (err) {
      eroareSalvare(err);
    }
  }

  // Pune în listă playlistul întors de server
  function inlocuiestePlaylist(salvat) {
    setPlaylisturi((prev) => prev.map((pl) => (pl.id === salvat.id ? salvat : pl)));
  }

  // Adaugă piesa în playlist sau o scoate, dacă era deja acolo (PATCH pe playlist)
  async function handleComutaPlaylist(playlistId, piesaId) {
    const playlist = playlisturi.find((pl) => pl.id === playlistId);
    const exista = playlist.pieseIds.includes(piesaId);
    const pieseIds = exista
      ? playlist.pieseIds.filter((id) => id !== piesaId)
      : [...playlist.pieseIds, piesaId];
    try {
      inlocuiestePlaylist(await updatePlaylist(playlistId, { pieseIds }));
      arataMesaj(exista ? `REMOVED FROM ${playlist.nume}` : `ADDED TO ${playlist.nume}`);
      stats.logheaza("PLAYLIST", `${exista ? "-" : "+"} ${playlist.nume}`);
    } catch (err) {
      eroareSalvare(err);
    }
  }

  // Playlist nou, care pornește cu piesa curentă (POST, id-ul îl dă serverul).
  // Validare ca în Etapa 2: numele nu poate fi gol și nici repetat.
  // Întoarce true / false, ca meniul să știe dacă să se închidă.
  async function handleCreeazaPlaylist(numeBrut, piesa) {
    const nume = numeBrut.trim().toUpperCase().replace(/\s+/g, "_"); // "chill mix" -> "CHILL_MIX"
    if (nume === "") return false;
    if (playlisturi.some((pl) => pl.nume === nume)) {
      arataMesaj(`${nume} ALREADY EXISTS`);
      return false;
    }
    try {
      const creat = await createPlaylist({ nume, gen: piesa.gen, pieseIds: [piesa.id] });
      setPlaylisturi((prev) => [...prev, creat]);
      arataMesaj(`CREATED ${nume}`);
      stats.logheaza("PLAYLIST", `NEW ${nume}`);
      return true;
    } catch (err) {
      eroareSalvare(err);
      return false;
    }
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
  async function handleDropPlaylist(playlistId) {
    const playlist = playlisturi.find((pl) => pl.id === playlistId);
    const nou = !playlist.pieseIds.includes(curentId);

    if (nou) {
      try {
        inlocuiestePlaylist(await updatePlaylist(playlistId, { pieseIds: [...playlist.pieseIds, curentId] }));
        arataMesaj(`DROPPED INTO ${playlist.nume}`);
        stats.logheaza("PLAYLIST", `+ ${playlist.nume} (DROP)`);
      } catch (err) {
        eroareSalvare(err);
      }
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

  // Comenzile player-ului, folosite și de panoul Player, și de bara de jos
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

  /* Tot ce au nevoie Layout-ul și paginile, într-un singur obiect */
  return {
    // date și stări
    piese,
    sugestii,
    playlisturi,
    pieseGenerate,
    toatePiesele,
    pieseApreciate,
    feed,
    profil,
    likedIds,
    inAsteptare,
    loading,
    error,
    tema,
    tab,
    gen,
    curentId,
    piesaCurenta,
    ruleaza,
    scratching,
    discRidicat,
    playlistTinta,
    animatiePlaylist,
    mesaj,
    volum,
    mut,
    inJoc,
    stats,
    actiuniCard,
    comenziPlayer,
    // funcții
    filtreaza,
    resursaPiesei,
    setError,
    setGen,
    setMut,
    setPlaylistTinta,
    handleReincearca,
    handleAdd,
    handleTab,
    handleTema,
    handleAlegePiesa,
    handleAlegePlaylist,
    handleLike,
    handleComutaPlaylist,
    handleCreeazaPlaylist,
    handleRegenereaza,
    handleAdaugaInCoada,
    handleScratchStart,
    handleScratch,
    handleScratchEnd,
    handleRidica,
    handleRevenire,
    handleSpart,
    handleDropPlaylist,
    handleJoc,
    handleVolum,
  };
}
