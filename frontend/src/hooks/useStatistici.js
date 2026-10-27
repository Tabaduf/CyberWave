/* ============================================================
   CYBERWAVE // hooks/useStatistici.js
   Un "custom hook": o funcție care începe cu "use" și folosește
   alte hook-uri React (useState, useEffect). Ține toată logica
   statisticilor într-un singur loc, ca App.jsx să nu se aglomereze.

   Ce strânge:
   - cât timp ai ascultat fiecare piesă și fiecare gen;
   - de câte ori ai pornit / sărit piese;
   - statisticile jocului (runde, lovituri, blocuri sparte, lasere);
   - un jurnal (log) cu ultimele acțiuni, ca un terminal.

   Datele se păstrează în browser (localStorage), ca să nu se piardă
   la refresh. Dacă localStorage e blocat, merg doar până la refresh.
   ============================================================ */

import { useState, useEffect } from "react";

const CHEIE = "cyberwave-stats";
const MAX_LOG = 80; // câte rânduri păstrează jurnalul

/* Statisticile goale, de la care pornește un utilizator nou */
function statisticiGoale() {
  return {
    start: Date.now(),
    secunde: {},  // { idPiesa: secunde ascultate }
    genuri: {},   // { gen: secunde ascultate }
    porniri: {},  // { idPiesa: de câte ori a fost pornită }
    titluri: {},  // { idPiesa: titlu } - ca să știm numele și după ștergere
    skipuri: 0,
    scratch: 0,
    joc: { runde: 0, lovituri: 0, blocuri: 0, lasere: 0, record: 0 },
    log: [],
  };
}

/* Citirea de la pornire. useState o apelează o singură dată. */
function citeste() {
  try {
    const salvat = JSON.parse(localStorage.getItem(CHEIE));
    // Combinăm cu valorile goale, ca un câmp nou adăugat în cod să existe mereu
    if (salvat) return { ...statisticiGoale(), ...salvat, joc: { ...statisticiGoale().joc, ...salvat.joc } };
  } catch {
    // date stricate sau localStorage blocat: pornim de la zero
  }
  return statisticiGoale();
}

/* Un rând nou de jurnal */
function rand(tip, text) {
  return { id: `${Date.now()}-${Math.random()}`, ora: Date.now(), tip, text };
}

/* Adaugă un rând la jurnal și păstrează doar ultimele MAX_LOG */
const cuLog = (prev, tip, text) => [...prev.log, rand(tip, text)].slice(-MAX_LOG);

export default function useStatistici() {
  const [statistici, setStatistici] = useState(citeste);

  // La fiecare schimbare, salvăm în browser
  useEffect(() => {
    try {
      localStorage.setItem(CHEIE, JSON.stringify(statistici));
    } catch {
      // fără salvare: statisticile rămân doar în memorie
    }
  }, [statistici]);

  /* Toate funcțiile de mai jos folosesc forma setStatistici((prev) => ...)
     și construiesc obiecte NOI, ca în Etapa 5. */

  // Un rând simplu în jurnal (ex.: LIKE, THEME, DELETE)
  function logheaza(tip, text) {
    setStatistici((prev) => ({ ...prev, log: cuLog(prev, tip, text) }));
  }

  // Timp de ascultare: chemat de ceasul piesei la fiecare pas
  function adaugaAscultare(piesa, secunde) {
    setStatistici((prev) => ({
      ...prev,
      secunde: { ...prev.secunde, [piesa.id]: (prev.secunde[piesa.id] ?? 0) + secunde },
      genuri: { ...prev.genuri, [piesa.gen]: (prev.genuri[piesa.gen] ?? 0) + secunde },
      titluri: { ...prev.titluri, [piesa.id]: piesa.titlu },
    }));
  }

  // O piesă a fost încărcată pe disc
  function adaugaPornire(piesa) {
    setStatistici((prev) => ({
      ...prev,
      porniri: { ...prev.porniri, [piesa.id]: (prev.porniri[piesa.id] ?? 0) + 1 },
      titluri: { ...prev.titluri, [piesa.id]: piesa.titlu },
      log: cuLog(prev, "LOAD", piesa.titlu),
    }));
  }

  // Utilizatorul a sărit peste piesă (⏮ / ⏭)
  function adaugaSkip(piesa, directie) {
    setStatistici((prev) => ({
      ...prev,
      skipuri: prev.skipuri + 1,
      log: cuLog(prev, "SKIP", `${directie > 0 ? ">>" : "<<"} ${piesa.titlu}`),
    }));
  }

  // Un scratch pe vinil, cu câte secunde a mutat piesa
  function adaugaScratch(secunde) {
    const semn = secunde >= 0 ? "+" : "-";
    setStatistici((prev) => ({
      ...prev,
      scratch: prev.scratch + 1,
      log: cuLog(prev, "SCRATCH", `${semn}${Math.abs(secunde).toFixed(1)}s`),
    }));
  }

  // Evenimentele din joc
  function evenimentJoc(tip, valoare) {
    setStatistici((prev) => {
      const joc = { ...prev.joc };
      let log = prev.log;
      if (tip === "start") {
        joc.runde++;
        log = cuLog(prev, "GAME", "TUNNEL_RUNNER STARTED");
      } else if (tip === "iesire") {
        log = cuLog(prev, "GAME", "TUNNEL_RUNNER CLOSED");
      } else if (tip === "lovire") {
        joc.lovituri++;
        joc.record = Math.max(joc.record, valoare);
        log = cuLog(prev, "CRASH", `COLLISION AT SCORE ${valoare}`);
      } else if (tip === "bloc") {
        joc.blocuri++;
        log = cuLog(prev, "BLAST", "BLOCK DESTROYED");
      } else if (tip === "laser") {
        joc.lasere++;
      }
      return { ...prev, joc, log };
    });
  }

  // $ clear: totul de la zero
  function reseteaza() {
    setStatistici({ ...statisticiGoale(), log: [rand("SYS", "LOG CLEARED. COUNTERS RESET.")] });
  }

  return {
    statistici,
    logheaza,
    adaugaAscultare,
    adaugaPornire,
    adaugaSkip,
    adaugaScratch,
    evenimentJoc,
    reseteaza,
  };
}
