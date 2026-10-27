/* ============================================================
   CYBERWAVE // JocTunel.jsx
   Mini-joc "endless runner": nava zboară printr-un tub făcut din
   benzi. ← / → (sau A / D, sau atingere stânga / dreapta)
   plimbă nava pe pereții tubului, ca într-un loop. Din față vin
   blocuri; la lovire, scorul se resetează la 0 și cursa continuă.
   La fiecare 200 de puncte primești un laser (SPACE / ↑ / FIRE):
   zboară în fața navei și sparge primul bloc de pe banda ei.

   Mod "comfort": tubul și camera stau pe loc, doar NAVA se rotește,
   iar pe pereți nu mai curg pătrate (doar liniile fixe ale tubului),
   ca să nu apară amețeala de la mișcarea întregului ecran.

   - culorile vin din paleta genului piesei care cântă;
   - viteza crește cu BPM-ul piesei, iar liniile pulsează pe ritm;
   - muzica nu se oprește: jocul e doar un strat peste pagină,
     App rămâne pe ecran dedesubt, cu tot state-ul lui.

   Desenarea se face pe <canvas>, de 60 de ori pe secundă
   (requestAnimationFrame). Valorile care se schimbă la fiecare
   cadru stau în useRef, nu în useState: schimbarea lor NU trebuie
   să redeseneze componenta React, doar canvas-ul.
   ============================================================ */

import { useEffect, useRef } from "react";

/* --- Dimensiunile lumii (unități de joc, nu pixeli) --- */
const BENZI = 12;                          // câte pătrate are tubul pe circumferință
const LATIME_BANDA = (Math.PI * 2) / BENZI; // unghiul unei benzi
const RAZA = 1;                            // raza tubului
const RAZA_BLOC = 0.62;                    // cât de sus se ridică un bloc (spre centru)
const RAZA_NAVA = 0.8;                     // nava zboară puțin deasupra peretelui
const LUNGIME_INEL = 1.6;                  // distanța dintre două inele de pătrate
const INELE = 28;                          // câte inele se văd în adâncime
const Z_APROAPE = 0.35;                    // nimic mai aproape de cameră nu se desenează
const Z_NAVA = 2.2;                        // adâncimea la care stă nava
const VITEZA_START = 10;                   // unități pe secundă
const VITEZA_MAX = 28;
const ROTIRE = 2.6;                        // radiani pe secundă (cât de repede ocolește nava tubul)
const PUNCTE_PE_GLONT = 200;               // la câte puncte primești un laser
const MUNITIE_MAX = 9;
const VITEZA_LASER = 32;                   // unități pe secundă, mult peste viteza blocurilor
const LUNGIME_LASER = 4;                   // cât de lungă e raza laserului

/* ------------------------------------------------------------
   CULORI: transformăm orice culoare CSS în [r, g, b], ca să le
   putem amesteca (ceață, umbre). Browserul face conversia pentru
   noi: desenăm un pixel cu acea culoare și îl citim înapoi.
   ------------------------------------------------------------ */
const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const cacheCulori = new Map();

function rgb(culoareCss) {
  if (cacheCulori.has(culoareCss)) return cacheCulori.get(culoareCss);
  if (cacheCulori.size > 300) cacheCulori.clear(); // în timpul tranzițiilor apar multe nuanțe
  pixel.clearRect(0, 0, 1, 1);
  pixel.fillStyle = "#000";
  pixel.fillStyle = culoareCss;
  pixel.fillRect(0, 0, 1, 1);
  const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
  cacheCulori.set(culoareCss, [r, g, b]);
  return [r, g, b];
}

// Amestecă două culori: t = 0 -> a, t = 1 -> b
const amesteca = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = ([r, g, b], alfa = 1) => `rgba(${r}, ${g}, ${b}, ${alfa})`;

const ALB = [255, 255, 255];
const NEGRU = [0, 0, 0];

/* Citește paleta curentă din variabilele CSS ale elementului dat */
function citestePaleta(element) {
  const stil = getComputedStyle(element);
  const ia = (nume) => rgb(stil.getPropertyValue(nume).trim() || "#888");
  const bg = ia("--bg");
  const text = ia("--text");
  const border = ia("--border");
  const accent = ia("--accent");
  const luminos = ia("--accent-hover");
  return {
    bg,
    text,
    accent,
    luminos,
    bandaInchisa: amesteca(bg, border, 0.45), // liniile tubului: discrete, nu contrastante
    navaFata: amesteca(text, ALB, 0.15),
    navaUmbra: amesteca(text, NEGRU, 0.45),
  };
}

/* ------------------------------------------------------------
   OBSTACOLE: un rând nou de blocuri.
   La început blocuri izolate; cu scorul apar și "ziduri" cu
   o singură fereastră liberă de 3 benzi.
   ------------------------------------------------------------ */
function randNou(z, scor) {
  const benzi = new Set();

  if (scor > 250 && Math.random() < 0.35) {
    // Zid: toate benzile blocate, mai puțin o fereastră de 3
    const fereastra = Math.floor(Math.random() * BENZI);
    for (let i = 0; i < BENZI; i++) {
      const distanta = (i - fereastra + BENZI) % BENZI;
      if (distanta > 2) benzi.add(i);
    }
  } else {
    // Câteva blocuri împrăștiate; numărul crește cu scorul
    const cate = 1 + Math.floor(Math.random() * Math.min(5, 2 + scor / 300));
    while (benzi.size < cate) benzi.add(Math.floor(Math.random() * BENZI));
  }

  return [...benzi].map((banda) => ({ z, banda }));
}

/* Restul împărțirii, mereu pozitiv (ex.: mod(-1, 12) = 11) */
const mod = (a, n) => ((a % n) + n) % n;


/* ------------------------------------------------------------
   COMPONENTA
   ------------------------------------------------------------ */
export default function JocTunel({ piesa, ruleaza, onIesire, onEveniment }) {
  const canvasRef = useRef(null);
  const radacinaRef = useRef(null);

  // Ce știe jocul despre muzică; actualizat din props, citit în bucla de joc
  const muzicaRef = useRef({ bpm: 120, ruleaza: false });
  const iesireRef = useRef(onIesire);
  // Evenimentele jocului (laser, bloc spart, lovire) urcă spre statistici
  const evenimentRef = useRef(onEveniment);
  // Funcția de tragere trăiește în bucla de joc; butonul FIRE o apelează prin ref
  const tragereRef = useRef(null);

  useEffect(() => {
    muzicaRef.current = { bpm: piesa ? piesa.bpm : 120, ruleaza };
    iesireRef.current = onIesire;
    evenimentRef.current = onEveniment;
  });

  /* Bucla de joc: pornește o singură dată ([] la final) și se oprește
     când componenta dispare (funcția din return face curățenia). */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Starea jocului: un obiect simplu, modificat direct la fiecare cadru.
    // (Aici e voie: nu e state React, ci datele interne ale animației.)
    let record = 0;
    try {
      record = Number(localStorage.getItem("cyberwave-record")) || 0;
    } catch {
      // localStorage poate fi blocat (ex.: fereastră privată); jucăm fără record salvat
    }

    const joc = {
      unghi: LATIME_BANDA / 2, // nava pornește în mijlocul unei benzi
      viteza: VITEZA_START,
      distanta: 0,
      record,
      obstacole: [],
      deLaUltimulRand: 0,
      urmatorulGol: 4,
      stanga: false,
      dreapta: false,
      inclinare: 0,
      flash: 0,      // ecran roșu după lovire (1 -> 0)
      protectie: 0,  // secunde de invulnerabilitate după lovire
      paleta: citestePaleta(radacinaRef.current),
      cadru: 0,
      munitie: 0,                 // câte lasere ai
      pragGlont: PUNCTE_PE_GLONT, // la ce scor primești următorul
      lasere: [],                 // laserele în zbor: { unghi, banda, z }
      particule: [],              // bucățile din explozii
      mesajMunitie: 0,            // cât timp mai apare "+1 LASER" (secunde)
      gol: 0,                     // cât timp mai apare "NO AMMO"
    };

    /* --- Dimensiunea canvas-ului = dimensiunea ecranului (și pe ecrane retina) --- */
    let latime = 0;
    let inaltime = 0;
    function redimensioneaza() {
      const dpr = window.devicePixelRatio || 1;
      latime = canvas.clientWidth;
      inaltime = canvas.clientHeight;
      canvas.width = latime * dpr;
      canvas.height = inaltime * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    redimensioneaza();
    window.addEventListener("resize", redimensioneaza);

    /* --- Tastatura --- */
    function laApasare(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") joc.stanga = true;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") joc.dreapta = true;
      else if (e.key === "Escape") iesireRef.current();
      else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (!e.repeat) trage(); // ținut apăsat nu trage în rafală
      } else return;
      e.preventDefault(); // săgețile și SPACE nu mai derulează pagina
    }
    function laEliberare(e) {
      if (e.key === " ") e.preventDefault(); // SPACE nu mai "apasă" butonul care are focus
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") joc.stanga = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") joc.dreapta = false;
    }
    // Butonul PLAY GAME rămâne cu focus după click; îl scoatem, ca SPACE să nu-l apese
    document.activeElement?.blur();
    window.addEventListener("keydown", laApasare);
    window.addEventListener("keyup", laEliberare);

    /* --- Atingere / mouse: jumătatea stângă sau dreaptă a ecranului --- */
    function laAtingere(e) {
      const stangaEcran = e.clientX < canvas.getBoundingClientRect().left + latime / 2;
      joc.stanga = stangaEcran;
      joc.dreapta = !stangaEcran;
    }
    function laRidicare() {
      joc.stanga = false;
      joc.dreapta = false;
    }
    canvas.addEventListener("pointerdown", laAtingere);
    window.addEventListener("pointerup", laRidicare);

    /* --- Tragerea: un laser pornește din fața navei, pe banda ei --- */
    function trage() {
      if (joc.munitie === 0) {
        joc.gol = 0.8; // anunțăm "NO AMMO"
        return;
      }
      joc.munitie--;
      evenimentRef.current?.("laser");
      joc.lasere.push({
        unghi: joc.unghi,
        banda: Math.floor(mod(joc.unghi, Math.PI * 2) / LATIME_BANDA),
        z: Z_NAVA + 0.3,
      });
    }
    tragereRef.current = trage;

    /* --- Explozie: blocul se sparge în bucăți care zboară în toate părțile --- */
    function explozie(o) {
      evenimentRef.current?.("bloc");
      for (let i = 0; i < 28; i++) {
        joc.particule.push({
          unghi: (o.banda + Math.random()) * LATIME_BANDA,          // undeva pe lățimea blocului
          r: RAZA_BLOC + Math.random() * (RAZA - RAZA_BLOC),       // undeva pe înălțimea lui
          z: o.z + Math.random() * LUNGIME_INEL,
          vUnghi: (Math.random() - 0.5) * 1.6,                     // vitezele bucății
          vR: -Math.random() * 1.4,                                // spre centrul tubului
          vZ: (Math.random() - 0.3) * 8,
          viata: 0.5 + Math.random() * 0.5,                        // secunde până dispare
          alba: Math.random() < 0.3,                               // unele scântei sunt albe
        });
      }
    }

    /* --- Lovire: scorul se pierde, cursa continuă --- */
    function lovire() {
      const scor = Math.floor(joc.distanta);
      evenimentRef.current?.("lovire", scor);
      if (scor > joc.record) {
        joc.record = scor;
        try {
          localStorage.setItem("cyberwave-record", String(scor));
        } catch {
          // fără salvare, recordul rămâne doar până la închiderea jocului
        }
      }
      joc.distanta = 0;
      joc.viteza = VITEZA_START;
      joc.flash = 1;
      joc.protectie = 1.2;
      // Ștergem blocurile din apropiere, ca jucătorul să aibă timp să-și revină
      joc.obstacole = joc.obstacole.filter((o) => o.z > Z_NAVA + 8);
      // Scorul o ia de la 0, deci și pragul pentru următorul laser (laserele rămase se păstrează)
      joc.pragGlont = PUNCTE_PE_GLONT;
    }

    /* --- ACTUALIZARE: mișcarea pe durata unui cadru (dt secunde) --- */
    function actualizeaza(dt) {
      const { bpm } = muzicaRef.current;
      const factorBpm = 0.7 + bpm / 400; // 120 BPM -> 1.0, 174 BPM -> ~1.13

      // Rotirea pe tub + înclinarea navei (lină, spre direcția de mers)
      const directie = (joc.stanga ? 1 : 0) - (joc.dreapta ? 1 : 0);
      joc.unghi += directie * ROTIRE * dt;
      joc.inclinare += (directie - joc.inclinare) * Math.min(1, dt * 10);

      // Viteza crește încet în timp
      joc.viteza = Math.min(VITEZA_MAX, joc.viteza + dt * 0.35);
      const pas = joc.viteza * factorBpm * dt;
      joc.distanta += pas;

      // Blocurile vin spre cameră; cele trecute de cameră dispar
      for (const o of joc.obstacole) o.z -= pas;
      joc.obstacole = joc.obstacole.filter((o) => o.z + LUNGIME_INEL > 0);

      // Rând nou, aliniat cu inelele tubului, la capătul îndepărtat
      joc.deLaUltimulRand += pas;
      if (joc.deLaUltimulRand >= joc.urmatorulGol * LUNGIME_INEL) {
        const zCapat = (INELE - 1) * LUNGIME_INEL - (joc.distanta % LUNGIME_INEL);
        joc.obstacole.push(...randNou(zCapat, joc.distanta));
        joc.deLaUltimulRand = 0;
        // Pauza dintre rânduri scade de la 5 la 2 inele pe măsură ce scorul crește
        joc.urmatorulGol = Math.max(2, 5 - Math.floor(joc.distanta / 400)) + Math.floor(Math.random() * 2);
      }

      // Muniție: un laser nou la fiecare 200 de puncte
      if (joc.distanta >= joc.pragGlont) {
        joc.munitie = Math.min(MUNITIE_MAX, joc.munitie + 1);
        joc.pragGlont += PUNCTE_PE_GLONT;
        joc.mesajMunitie = 1.2;
      }
      joc.mesajMunitie = Math.max(0, joc.mesajMunitie - dt);
      joc.gol = Math.max(0, joc.gol - dt);

      // Laserele zboară înainte. Lovesc primul bloc de pe banda lor pe care
      // l-au atins în acest cadru (verificăm tot drumul parcurs, ca un laser
      // rapid să nu "sară" peste un bloc între două cadre).
      for (const l of joc.lasere) {
        const zVechi = l.z;
        l.z += VITEZA_LASER * dt;
        const tinte = joc.obstacole.filter(
          (o) => o.banda === l.banda && o.z <= l.z && o.z + LUNGIME_INEL >= zVechi
        );
        if (tinte.length > 0) {
          const tinta = tinte.reduce((cel, o) => (o.z < cel.z ? o : cel)); // cel mai apropiat
          joc.obstacole = joc.obstacole.filter((o) => o !== tinta);
          explozie(tinta);
          l.lovit = true;
        }
      }
      joc.lasere = joc.lasere.filter((l) => !l.lovit && l.z < INELE * LUNGIME_INEL);

      // Bucățile din explozii: se mișcă, vin spre cameră odată cu lumea și se sting
      for (const b of joc.particule) {
        b.unghi += b.vUnghi * dt;
        b.r = Math.max(0.05, b.r + b.vR * dt);
        b.z += b.vZ * dt - pas;
        b.viata -= dt;
      }
      joc.particule = joc.particule.filter((b) => b.viata > 0 && b.z > Z_APROAPE);

      // Coliziune: blocul e la adâncimea navei ȘI pe aceeași bandă
      joc.protectie = Math.max(0, joc.protectie - dt);
      joc.flash = Math.max(0, joc.flash - dt * 1.8);
      const bandaNava = Math.floor(mod(joc.unghi, Math.PI * 2) / LATIME_BANDA);
      if (joc.protectie === 0) {
        const lovit = joc.obstacole.some(
          (o) => o.banda === bandaNava && o.z < Z_NAVA + 0.2 && o.z + LUNGIME_INEL * 0.9 > Z_NAVA - 0.2
        );
        if (lovit) lovire();
      }

      // Paleta se recitește din CSS de câteva ori pe secundă (prinde schimbarea piesei)
      joc.cadru++;
      if (joc.cadru % 15 === 0) joc.paleta = citestePaleta(radacinaRef.current);
    }

    /* --- DESENARE --- */
    function deseneaza(timpMs) {
      const p = joc.paleta;
      const W = latime;
      const H = inaltime;
      const cx = W / 2;
      const cy = H / 2;                 // punctul de fugă, în mijloc: nava poate ajunge oriunde pe cerc
      const f = Math.min(W, H) * 0.85;  // "distanța focală" a camerei (cât de mare se vede tubul)

      // Pulsul pe ritm: 1 exact pe bătaie, apoi scade până la următoarea
      const { bpm, ruleaza: canta } = muzicaRef.current;
      const faza = ((timpMs / 1000) * bpm) / 60 % 1;
      const puls = canta ? Math.pow(1 - faza, 3) : 0;

      // Proiecția 3D -> 2D: cu cât un punct e mai departe (z mare), cu atât e mai aproape de centru
      const proiecteaza = (unghiEcran, r, z) => [
        cx + (Math.cos(unghiEcran) * r * f) / z,
        cy + (Math.sin(unghiEcran) * r * f) / z,
      ];
      // Unghiul de pe ecran al unei benzi: tubul stă pe loc.
      // + π/2 = jos (pe ecran unghiul pornește din dreapta și crește în sensul acelor de ceas);
      // - jumătate de bandă = banda 0 e centrată exact jos, sub nava de la start.
      const rotireTub = Math.PI / 2 - LATIME_BANDA / 2;
      const unghiEcran = (banda) => banda * LATIME_BANDA + rotireTub;
      // Unde e nava pe circumferință (pe ecran)
      const unghiNava = joc.unghi + rotireTub;
      // Ceața: obiectele îndepărtate se pierd în culoarea fundalului
      const ceata = (culoare, z) => amesteca(culoare, p.bg, Math.pow(Math.min(1, z / (INELE * LUNGIME_INEL)), 1.2) * 0.9);

      function poligon(puncte, umplere, contur, grosime) {
        ctx.beginPath();
        ctx.moveTo(puncte[0][0], puncte[0][1]);
        for (let i = 1; i < puncte.length; i++) ctx.lineTo(puncte[i][0], puncte[i][1]);
        ctx.closePath();
        ctx.fillStyle = umplere;
        ctx.fill();
        if (contur) {
          ctx.strokeStyle = contur;
          ctx.lineWidth = grosime;
          ctx.stroke();
        }
      }

      ctx.save();
      // Tremurat scurt după lovire
      if (joc.flash > 0) ctx.translate((Math.random() - 0.5) * 14 * joc.flash, (Math.random() - 0.5) * 14 * joc.flash);

      ctx.fillStyle = css(p.bg);
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // 1) TUBUL: doar liniile lungi dintre benzi, de la cameră până în depărtare.
      //    Ele nu se mișcă (curg în lungul privirii), deci ochiul are un reper fix.
      //    Fiecare linie e făcută din bucăți, ca să se piardă treptat în ceață.
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;
      const capat = INELE * LUNGIME_INEL;
      const BUCATI = 12;
      for (let b = 0; b < BENZI; b++) {
        const a = unghiEcran(b);
        for (let i = 0; i < BUCATI; i++) {
          // Bucăți mai scurte aproape de cameră, mai lungi în depărtare
          const z0 = Z_APROAPE + (capat - Z_APROAPE) * Math.pow(i / BUCATI, 2);
          const z1 = Z_APROAPE + (capat - Z_APROAPE) * Math.pow((i + 1) / BUCATI, 2);
          const [x0, y0] = proiecteaza(a, RAZA, z0);
          const [x1, y1] = proiecteaza(a, RAZA, z1);
          ctx.strokeStyle = css(ceata(p.bandaInchisa, z0));
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }

      // 2) BLOCURILE: de departe spre aproape, fiecare ca o cutie cu 4 fețe vizibile
      const sortate = [...joc.obstacole].sort((a, b) => b.z - a.z);
      for (const o of sortate) {
        const zFata = Math.max(Z_APROAPE, o.z);
        const zSpate = o.z + LUNGIME_INEL * 0.9;
        if (zSpate <= Z_APROAPE) continue;
        const a0 = unghiEcran(o.banda);
        const a1 = a0 + LATIME_BANDA;
        const contur = css(ceata(NEGRU, zFata), 0.8);

        // Laturile (mai întunecate), apoi capacul (mai deschis), apoi fața (culoarea de bază)
        poligon([proiecteaza(a0, RAZA, zSpate), proiecteaza(a0, RAZA, zFata), proiecteaza(a0, RAZA_BLOC, zFata), proiecteaza(a0, RAZA_BLOC, zSpate)],
          css(ceata(amesteca(p.accent, NEGRU, 0.4), zFata)), contur, 1.5);
        poligon([proiecteaza(a1, RAZA, zSpate), proiecteaza(a1, RAZA, zFata), proiecteaza(a1, RAZA_BLOC, zFata), proiecteaza(a1, RAZA_BLOC, zSpate)],
          css(ceata(amesteca(p.accent, NEGRU, 0.4), zFata)), contur, 1.5);
        poligon([proiecteaza(a0, RAZA_BLOC, zSpate), proiecteaza(a1, RAZA_BLOC, zSpate), proiecteaza(a1, RAZA_BLOC, zFata), proiecteaza(a0, RAZA_BLOC, zFata)],
          css(ceata(amesteca(p.accent, ALB, 0.3), zFata)), contur, 1.5);
        poligon([proiecteaza(a0, RAZA, zFata), proiecteaza(a1, RAZA, zFata), proiecteaza(a1, RAZA_BLOC, zFata), proiecteaza(a0, RAZA_BLOC, zFata)],
          css(ceata(p.accent, zFata)), contur, 1.5);
      }

      // 2b) LASERELE: linii luminoase care pleacă din fața navei
      ctx.lineCap = "round";
      ctx.shadowColor = css(p.luminos);
      ctx.shadowBlur = 16;
      for (const l of joc.lasere) {
        const a = l.unghi + rotireTub;
        const [x0, y0] = proiecteaza(a, RAZA_NAVA, l.z);
        const [x1, y1] = proiecteaza(a, RAZA_NAVA, l.z + LUNGIME_LASER);
        ctx.strokeStyle = css(p.luminos);
        ctx.lineWidth = Math.max(3, (f / l.z) * 0.08); // mai gros aproape, mai subțire departe
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; // miezul alb al laserului
        ctx.lineWidth /= 3;
        ctx.stroke();
      }

      // 2c) EXPLOZIILE: pătrățele care se micșorează și se sting
      for (const b of joc.particule) {
        const [px, py] = proiecteaza(b.unghi + rotireTub, b.r, b.z);
        const marime = Math.max(1.5, (f / b.z) * 0.05 * b.viata);
        ctx.fillStyle = css(b.alba ? ALB : p.luminos, Math.min(1, b.viata * 1.5));
        ctx.fillRect(px - marime / 2, py - marime / 2, marime, marime);
      }
      ctx.shadowBlur = 0;

      // 3) NAVA: o săgeată cu două fețe, ca în schiță; clipește cât e protejată
      const vizibila = joc.protectie === 0 || Math.floor(joc.protectie * 10) % 2 === 0;
      if (vizibila) {
        const [nx, ny] = proiecteaza(unghiNava, RAZA_NAVA, Z_NAVA);
        const s = (f / Z_NAVA) * 0.2; // mărimea navei pe ecran
        ctx.save();
        ctx.translate(nx, ny);
        // Nava stă mereu cu "burta" pe perete: jos e dreaptă, sus e cu capul în jos.
        // unghiNava - π/2 = cât s-a rotit față de poziția de jos; plus o mică înclinare în viraj.
        ctx.rotate(unghiNava - Math.PI / 2 - joc.inclinare * 0.35);
        const varf = [0, -1.05 * s];
        const stanga = [-0.5 * s, 0.6 * s];
        const dreapta = [0.5 * s, 0.6 * s];
        const mijloc = [0, 0.38 * s];
        ctx.shadowColor = css(p.accent);
        ctx.shadowBlur = 12 + puls * 18;
        poligon([varf, stanga, mijloc], css(p.navaFata), css(NEGRU), 2);
        ctx.shadowBlur = 0;
        poligon([varf, mijloc, dreapta], css(p.navaUmbra), css(NEGRU), 2);
        ctx.restore();
      }
      ctx.restore();

      // 4) Ecranul roșu de la lovire
      if (joc.flash > 0) {
        ctx.fillStyle = `rgba(255, 30, 60, ${joc.flash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 5) SCORUL, în colțul din stânga sus (sub RETURN), ca nava să nu treacă peste el
      ctx.textAlign = "left";
      ctx.fillStyle = css(p.text);
      ctx.font = "bold 24px 'Courier New', monospace";
      ctx.fillText(`SCORE ${String(Math.floor(joc.distanta)).padStart(6, "0")}`, 16, 92);
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillText(`BEST  ${String(joc.record).padStart(6, "0")}`, 16, 114);

      // 6) MUNIȚIA, în colțul din stânga jos: câte o căsuță pentru fiecare laser
      const xM = 16;
      const yM = H - 46;
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = css(p.text);
      ctx.fillText("LASER", xM, yM - 10);
      for (let i = 0; i < MUNITIE_MAX; i++) {
        const plin = i < joc.munitie;
        ctx.fillStyle = plin ? css(p.luminos) : css(p.text, 0.15);
        ctx.fillRect(xM + i * 16, yM, 11, 18);
      }
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = css(p.text, 0.7);
      ctx.fillText(`NEXT +1 @ ${String(joc.pragGlont).padStart(4, "0")}`, xM, yM + 34);
      if (joc.mesajMunitie > 0) {
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillStyle = css(p.luminos, Math.min(1, joc.mesajMunitie * 2));
        ctx.fillText("+1 LASER", xM + 70, yM - 10);
      } else if (joc.gol > 0) {
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillStyle = css(p.accent, Math.min(1, joc.gol * 2));
        ctx.fillText("NO AMMO", xM + 70, yM - 10);
      }

      ctx.textAlign = "center";
      if (joc.flash > 0.2) {
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.fillText("[SYS]: COLLISION. SCORE RESET.", cx, H * 0.2);
      }
    }

    /* --- BUCLA: requestAnimationFrame cheamă funcția înaintea fiecărui cadru --- */
    let cadruId = 0;
    let anterior = performance.now();
    function bucla(acum) {
      const dt = Math.min((acum - anterior) / 1000, 0.05); // limită: fără salturi după o pauză
      anterior = acum;
      actualizeaza(dt);
      deseneaza(acum);
      cadruId = requestAnimationFrame(bucla);
    }
    cadruId = requestAnimationFrame(bucla);

    // Curățenie la ieșirea din joc: oprim bucla și scoatem ascultătorii
    return () => {
      cancelAnimationFrame(cadruId);
      window.removeEventListener("resize", redimensioneaza);
      window.removeEventListener("keydown", laApasare);
      window.removeEventListener("keyup", laEliberare);
      window.removeEventListener("pointerup", laRidicare);
      canvas.removeEventListener("pointerdown", laAtingere);
    };
  }, []);

  return (
    // data-gen: jocul folosește paleta genului piesei care cântă
    <div className="game" ref={radacinaRef} data-gen={piesa ? piesa.gen : "all"} role="application" aria-label="Joc Tunnel Runner">
      <canvas ref={canvasRef} className="game-canvas"></canvas>

      {/* Meniul de sus: întoarcere și piesa curentă */}
      <div className="game-hud">
        <button type="button" className="game-return" onClick={onIesire}>
          ◀ RETURN
        </button>
        <span className="game-track">
          {piesa ? `♪ ${piesa.titlu} · ${piesa.gen.toUpperCase()} · ${piesa.bpm} BPM` : "♪ NO TRACK"}
        </span>
      </div>

      <p className="game-hint">← → / A D = MOVE  ·  SPACE / ↑ = FIRE  ·  ESC = RETURN</p>

      {/* Butonul FIRE (util pe telefon): apelează funcția de tragere din bucla de joc */}
      <button type="button" className="game-fire" onClick={(e) => {
          tragereRef.current?.();
          e.currentTarget.blur(); // fără focus, SPACE nu mai apasă și butonul (ar trage de două ori)
        }}
      >
        ◉ FIRE
      </button>
    </div>
  );
}