/* ============================================================
   CYBERWAVE // Vinil.jsx
   Discul de vinil cu coperta piesei în centru și brațul pick-up.
   - viteza de rotație vine din BPM-ul piesei;
   - culorile vin din genul piesei (paleta e pusă pe .app);
   - poziția brațului urmărește cât s-a derulat din piesă.

   MOD DJ:
   1) SCRATCH - prinzi discul și îl învârți: muzica stă, piesa se
      derulează înainte / înapoi, cu sunet de scratch.
   2) RIDICARE - dacă tragi discul în afara marginii lui, "sare" de pe
      platan și îl ții în mână (muzica se oprește).
      - îi dai drumul încet  -> dispare repede (fade) și revine pe platan;
      - îl arunci tare într-un perete al ecranului -> se SPARGE,
        iar playerul trece la piesa următoare;
      - aruncat prea încet, ricoșează din pereți, se oprește și revine.
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { scratch, sparge } from "../audio/sintetizator.js";

/* Unghiurile brațului (grade), măsurate pe desen:
   REPAUS = ridicat, lângă disc; START = marginea discului
   (începutul piesei); FINAL = lângă eticheta din mijloc (finalul piesei). */
const UNGHI_REPAUS = -10;
const UNGHI_START = 3;
const UNGHI_FINAL = 24;

/* O tură completă de mână mută piesa cu atâtea secunde */
const SECUNDE_PE_TURA = 6;

/* Fizica discului aruncat */
const PRAG_RIDICARE = 1.15;   // la ce distanță de centru (× raza) discul sare de pe platan
const PRAG_SPARGERE = 1300;   // viteza (px/s) spre perete de la care discul se sparge
const FRECARE = 0.2;          // cât din viteză rămâne după o secundă de zbor (aerul îl frânează)
const VITEZA_OPRIRE = 90;     // sub această viteză, discul "obosește" și dispare
const INALTIME_BARA = 84;     // bara de jos e și ea un "perete"
const NR_CIOBURI = 12;

/* Fața discului (șanțuri + eticheta cu coperta).
   Folosită de 3 ori: pe platan, discul ținut în mână și fiecare ciob. */
function FataDisc({ piesa }) {
  return (
    <div className="vinyl">
      <div className="vinyl-label">
        {/* Randare condiționată: copertă dacă există, altfel imaginea de rezervă */}
        {piesa.cover ? (
          <img src={piesa.cover} alt={`Copertă: ${piesa.titlu}`} draggable="false" />
        ) : (
          <div className="no-cover">no img found :(</div>
        )}
      </div>
    </div>
  );
}

/* Cioburile: discul tăiat în "felii" neregulate, fiecare cu direcția ei.
   (vx, vy) = viteza la impact; peretele lovit întoarce componenta lui,
   ca bucățile să sară înapoi din perete. */
function genereazaCioburi(vx, vy, peretePeX) {
  const ricoseuX = peretePeX ? -vx : vx;
  const ricoseuY = peretePeX ? vy : -vy;
  const punct = (unghi, raza) => `${50 + 50 * raza * Math.cos(unghi)}% ${50 + 50 * raza * Math.sin(unghi)}%`;

  return Array.from({ length: NR_CIOBURI }, (_, i) => {
    const a0 = (i / NR_CIOBURI) * Math.PI * 2;
    const a1 = ((i + 1) / NR_CIOBURI) * Math.PI * 2;
    const mijloc = (a0 + a1) / 2;
    const forta = 120 + Math.random() * 180;
    return {
      id: i,
      // Felie de la centru la margine, cu un "colț" rupt la mijloc
      clip: `polygon(50% 50%, ${punct(a0, 1.05)}, ${punct(mijloc, 0.75 + Math.random() * 0.3)}, ${punct(a1, 1.05)})`,
      dx: Math.cos(mijloc) * forta + ricoseuX * 0.15,
      dy: Math.sin(mijloc) * forta + ricoseuY * 0.15 + 120, // + gravitație: cad puțin
      rot: (Math.random() - 0.5) * 720,
    };
  });
}

export default function Vinil({
  piesa,
  ruleaza,
  rewind,
  progres,
  scratching,
  onScratchStart,
  onScratch,
  onScratchEnd,
  onRidica,
  onRevenire,
  onSpart,
}) {
  // Cât a fost rotit discul de mână, în total (grade)
  const [unghiManual, setUnghiManual] = useState(0);

  // Unde e discul: "platan" | "ridicat" (în mână) | "zbor" | "fade" | "spart"
  const [mod, setMod] = useState("platan");
  const [intors, setIntors] = useState(false); // tocmai a revenit pe platan (animație)
  const [start, setStart] = useState({ x: 0, y: 0, r: 100 }); // poziția de unde a fost ridicat
  const [impact, setImpact] = useState(null); // locul spargerii + cioburile

  // Date de lucru, schimbate des, fără redesenare React
  const tragere = useRef({ unghi: 0, ora: 0, total: 0, ultimulSunet: 0, cx: 0, cy: 0, r: 100 });
  const zbor = useRef({ x: 0, y: 0, vx: 0, vy: 0, rot: 0, esantioane: [] });
  const discZburatorRef = useRef(null);
  const animatieRef = useRef(0);
  const temporizatorRef = useRef(0);

  // Dacă discul dispare din pagină (ex.: altă piesă), oprim animațiile rămase
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animatieRef.current);
      clearTimeout(temporizatorRef.current);
    };
  }, []);

  // O rotație completă = o măsură muzicală (4 bătăi).
  const durataRotatie = (60 / piesa.bpm) * 4;

  // Brațul stă pe disc doar dacă discul e pe platan și piesa rulează / a început
  const pePlatan = mod === "platan";
  const peDisc = pePlatan && (ruleaza || rewind || scratching || progres > 0);
  const unghi = peDisc ? UNGHI_START + (UNGHI_FINAL - UNGHI_START) * progres : UNGHI_REPAUS;

  let clase = "vinyl-wrap";
  if (ruleaza) clase += " playing";
  if (rewind) clase += " rewinding";
  if (scratching) clase += " scratching";

  const stil = {
    "--rot": `${durataRotatie.toFixed(2)}s`,
    "--arm": `${unghi}deg`,
  };

  /* Unghiul punctului atins față de centrul discului, în radiani */
  function unghiFataDeCentru(e) {
    const t = tragere.current;
    return Math.atan2(e.clientY - t.cy, e.clientX - t.cx);
  }

  /* Mută discul ținut în mână / aruncat direct în DOM (60 de ori pe secundă,
     fără să redesenăm componenta React la fiecare cadru) */
  function aplicaPozitie() {
    const z = zbor.current;
    const el = discZburatorRef.current;
    if (el) el.style.transform = `translate(${z.x - start.r}px, ${z.y - start.r}px) rotate(${z.rot}deg)`;
  }

  /* --- Mâna pe disc --- */
  function laApasare(e) {
    if (rewind || !pePlatan) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Centrul și raza discului (din platan, care nu se rotește)
    const r = e.currentTarget.parentElement.getBoundingClientRect();
    tragere.current = {
      unghi: 0,
      ora: performance.now(),
      total: 0,
      ultimulSunet: 0,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      r: r.width / 2,
    };
    tragere.current.unghi = unghiFataDeCentru(e);
    onScratchStart();
  }

  /* --- Mâna se mișcă --- */
  function laMiscare(e) {
    // Discul e în mână: îl urmărim și ținem minte ultimele poziții (pentru viteza de aruncare)
    if (mod === "ridicat") {
      const z = zbor.current;
      const acum = performance.now();
      z.rot += (e.clientX - z.x) * 0.3; // se rotește puțin în direcția mișcării
      z.x = e.clientX;
      z.y = e.clientY;
      z.esantioane.push({ x: z.x, y: z.y, t: acum });
      z.esantioane = z.esantioane.filter((s) => acum - s.t < 100); // doar ultimele 100 ms
      aplicaPozitie();
      return;
    }
    if (!scratching) return;

    const t = tragere.current;
    const acum = performance.now();

    // Tras dincolo de margine -> discul sare de pe platan
    const distanta = Math.hypot(e.clientX - t.cx, e.clientY - t.cy);
    if (distanta > t.r * PRAG_RIDICARE) {
      ridica(e);
      return;
    }

    // Altfel: scratch. Diferența de unghi, adusă între -π și π
    const unghiNou = unghiFataDeCentru(e);
    let delta = unghiNou - t.unghi;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    const viteza = delta / Math.max(0.001, (acum - t.ora) / 1000); // radiani pe secundă
    t.unghi = unghiNou;
    t.ora = acum;

    setUnghiManual((prev) => prev + (delta * 180) / Math.PI);
    const secunde = (delta / (Math.PI * 2)) * SECUNDE_PE_TURA;
    t.total += secunde;
    onScratch(secunde);

    if (Math.abs(viteza) > 1.5 && acum - t.ultimulSunet > 45) {
      scratch(viteza);
      t.ultimulSunet = acum;
    }
  }

  /* --- Discul sare de pe platan, în mână --- */
  function ridica(e) {
    const t = tragere.current;
    onScratchEnd(0); // mișcarea de dinainte de ridicare nu se notează ca scratch
    onRidica();
    zbor.current = { x: e.clientX, y: e.clientY, vx: 0, vy: 0, rot: unghiManual, esantioane: [] };
    setStart({ x: e.clientX, y: e.clientY, r: t.r });
    setIntors(false);
    setMod("ridicat");
  }

  /* --- Mâna se ridică --- */
  function laEliberare() {
    if (mod === "ridicat") {
      // Viteza de aruncare = drumul din ultimele 100 ms / timpul lui.
      // Dacă mâna a stat pe loc înainte să dea drumul, nu mai sunt eșantioane
      // recente, deci viteza e 0 și discul doar e lăsat jos.
      const acum = performance.now();
      const s = zbor.current.esantioane.filter((e) => acum - e.t < 100);
      zbor.current.vx = 0;
      zbor.current.vy = 0;
      if (s.length >= 2) {
        const dt = Math.max(0.016, (s[s.length - 1].t - s[0].t) / 1000);
        zbor.current.vx = (s[s.length - 1].x - s[0].x) / dt;
        zbor.current.vy = (s[s.length - 1].y - s[0].y) / dt;
      }
      const viteza = Math.hypot(zbor.current.vx, zbor.current.vy);
      if (viteza < 250) disparitie(); // lăsat jos încet
      else arunca();
      return;
    }
    if (!scratching) return;
    onScratchEnd(tragere.current.total);
  }

  /* --- Zborul: fizică simplă, cadru cu cadru --- */
  function arunca() {
    setMod("zbor");
    let anterior = performance.now();

    function pas(acum) {
      const dt = Math.min(0.033, (acum - anterior) / 1000);
      anterior = acum;
      const z = zbor.current;
      const r = start.r;
      const W = window.innerWidth;
      const H = window.innerHeight - INALTIME_BARA;

      // Frecarea cu aerul și deplasarea
      const frana = Math.pow(FRECARE, dt);
      z.vx *= frana;
      z.vy *= frana;
      z.x += z.vx * dt;
      z.y += z.vy * dt;
      z.rot += Math.hypot(z.vx, z.vy) * dt * 0.4;

      // Pereții: stânga / dreapta
      if (z.x - r < 0 || z.x + r > W) {
        if (Math.abs(z.vx) > PRAG_SPARGERE) return spargere(z.vx, z.vy, true);
        z.x = Math.min(Math.max(z.x, r), W - r);
        z.vx = -z.vx * 0.5; // ricoșeu: se întoarce cu jumătate din viteză
      }
      // Pereții: sus / jos (bara de control)
      if (z.y - r < 0 || z.y + r > H) {
        if (Math.abs(z.vy) > PRAG_SPARGERE) return spargere(z.vx, z.vy, false);
        z.y = Math.min(Math.max(z.y, r), H - r);
        z.vy = -z.vy * 0.5;
      }

      aplicaPozitie();
      if (Math.hypot(z.vx, z.vy) < VITEZA_OPRIRE) return disparitie();
      animatieRef.current = requestAnimationFrame(pas);
    }
    animatieRef.current = requestAnimationFrame(pas);
  }

  /* --- Fade: discul dispare repede și revine pe platan, piesa continuă --- */
  function disparitie() {
    setMod("fade");
    temporizatorRef.current = setTimeout(() => {
      setMod("platan");
      setIntors(true);
      onRevenire();
    }, 350);
  }

  /* --- Spargerea: cioburi, sunet, apoi piesa următoare --- */
  function spargere(vx, vy, peretePeX) {
    const z = zbor.current;
    setImpact({ x: z.x, y: z.y, rot: z.rot, cioburi: genereazaCioburi(vx, vy, peretePeX) });
    setMod("spart");
    sparge();
    temporizatorRef.current = setTimeout(() => {
      setMod("platan");
      setIntors(true);
      onSpart(); // App trece la piesa următoare (discul nou intră pe platan)
    }, 700);
  }

  const diametru = start.r * 2;

  return (
    <div className={clase} style={stil}>
      {/* Brațul pick-up-ului */}
      <div className="tonearm" aria-hidden="true"></div>

      {/* Discul de pe platan. Exteriorul face rewind-ul, rotația "de mână"
          și ascultă de mouse; interiorul (FataDisc) face rotația normală.
          Cât e ridicat, rămâne invizibil, dar continuă să primească mișcările
          mouse-ului (pointer capture), ca să-l putem purta prin pagină. */}
      <div
        className={`vinyl-rewind${pePlatan ? "" : " gol"}${intors ? " intors" : ""}`}
        style={{ transform: `rotate(${unghiManual}deg)` }}
        onPointerDown={laApasare}
        onPointerMove={laMiscare}
        onPointerUp={laEliberare}
        onPointerCancel={laEliberare}
        title="Învârte = scratch · trage afară = ridică discul"
      >
        <FataDisc piesa={piesa} />
      </div>

      <span className="dj-hint" aria-hidden="true">
        {scratching ? "◎ SCRATCH" : "SPIN = SCRATCH · PULL OUT = LIFT"}
      </span>

      {/* Discul în mână / în zbor. createPortal îl desenează direct în <body>,
          deasupra întregii pagini, ca să poată zbura oriunde pe ecran.
          data-gen păstrează culorile genului și în afara aplicației. */}
      {(mod === "ridicat" || mod === "zbor" || mod === "fade") &&
        createPortal(
          <div
            ref={discZburatorRef}
            className={`disc-zbor ${mod}`}
            data-gen={piesa.gen}
            style={{
              width: diametru,
              height: diametru,
              transform: `translate(${start.x - start.r}px, ${start.y - start.r}px) rotate(${unghiManual}deg)`,
            }}
            aria-hidden="true"
          >
            <FataDisc piesa={piesa} />
          </div>,
          document.body
        )}

      {/* Cioburile, la locul impactului */}
      {mod === "spart" &&
        impact &&
        createPortal(
          <div
            className="cioburi"
            data-gen={piesa.gen}
            style={{ left: impact.x - start.r, top: impact.y - start.r, width: diametru, height: diametru }}
            aria-hidden="true"
          >
            <div className="ciob-flash"></div>
            {impact.cioburi.map((c) => (
              <div
                key={c.id}
                className="ciob"
                style={{
                  clipPath: c.clip,
                  "--dx": `${c.dx}px`,
                  "--dy": `${c.dy}px`,
                  "--rot": `${c.rot}deg`,
                  "--start": `${impact.rot}deg`,
                }}
              >
                <FataDisc piesa={piesa} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}