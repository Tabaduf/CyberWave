/* ============================================================
   CYBERWAVE // audio/sintetizator.js
   Un mic sintetizator în browser (Web Audio API).
   Nu avem fișiere audio, așa că fiecare piesă își GENEREAZĂ muzica:
   tobe, bas și o melodie, în tempo-ul (BPM) și stilul genului ei.
   Melodia e aleasă "aleator", dar pornind de la id-ul piesei,
   deci aceeași piesă sună mereu la fel.

   Nu e o componentă React: e un modul JavaScript simplu, cu 3 funcții
   exportate (porneste, opreste, seteazaVolum), apelate din App.jsx.
   ============================================================ */

/* Stilul fiecărui gen. Tiparele au 16 pași (o măsură, în șaisprezecimi):
   "x" = lovește, "." = pauză.
   radacina = nota de bază (număr MIDI), scara = intervalele folosite
   pentru melodie, acorduri = cum se mută nota de bază la fiecare măsură. */
const STILURI = {
  synthwave: {
    radacina: 45, scara: [0, 3, 7, 10, 12, 15], acorduri: [0, 8, 3, 10],
    kick: "x...x...x...x...", snare: "....x.......x...", hat: "..x...x...x...x.",
    bas: "x.x.x.x.x.x.x.x.", lead: "x.x.x.x.x.x.x.x.", undaLead: "sawtooth", undaBas: "sawtooth", filtru: 2200,
  },
  darksynth: {
    radacina: 40, scara: [0, 1, 3, 7, 8, 12], acorduri: [0, 1, 0, 8],
    kick: "x...x...x...x.x.", snare: "....x.......x...", hat: "xxxxxxxxxxxxxxxx",
    bas: "xxxxxxxxxxxxxxxx", lead: "x...x..x..x.x...", undaLead: "square", undaBas: "sawtooth", filtru: 1400,
  },
  chiptune: {
    radacina: 48, scara: [0, 4, 7, 12, 16, 19], acorduri: [0, 5, 7, 5],
    kick: "x.......x.......", snare: "....x.......x...", hat: ".x.x.x.x.x.x.x.x",
    bas: "x...x...x...x...", lead: "xxxxxxxxxxxxxxxx", undaLead: "square", undaBas: "triangle", filtru: 6000,
  },
  industrial: {
    radacina: 38, scara: [0, 1, 5, 6, 12], acorduri: [0, 0, 1, 6],
    kick: "x..x..x.x..x..x.", snare: "....x..x....x...", hat: "x.xxx.xxx.xxx.xx",
    bas: "x..x..x.x..x..x.", lead: "x.......x.......", undaLead: "square", undaBas: "square", filtru: 1000,
  },
  vaporwave: {
    radacina: 50, scara: [0, 4, 7, 11, 14], acorduri: [0, 5, 9, 4],
    kick: "x.......x.......", snare: "........x.......", hat: "................",
    bas: "x.......x.......", lead: "x...x...x...x...", undaLead: "triangle", undaBas: "sine", filtru: 1800,
  },
  "lo-fi": {
    radacina: 46, scara: [0, 3, 5, 7, 10, 14], acorduri: [0, 5, 3, 8],
    kick: "x......x..x.....", snare: "....x.......x...", hat: "..x...x...x...x.",
    bas: "x.....x...x.....", lead: "x.....x...x.....", undaLead: "triangle", undaBas: "sine", filtru: 900,
  },
  "drum&bass": {
    radacina: 41, scara: [0, 3, 7, 10, 12], acorduri: [0, 0, 8, 10],
    kick: "x.........x.....", snare: "....x.......x...", hat: "x.xxx.xxx.xxx.xx",
    bas: "x..x......x..x..", lead: "x.......x.x.....", undaLead: "sawtooth", undaBas: "sawtooth", filtru: 1600,
  },
  ambient: {
    radacina: 48, scara: [0, 2, 7, 9, 14], acorduri: [0, 5, 7, 3],
    kick: "................", snare: "................", hat: "................",
    bas: "x...............", lead: "x.......x.......", undaLead: "sine", undaBas: "sine", filtru: 1200,
  },
};

/* Starea modulului: o singură instanță pentru toată aplicația */
let ctx = null;          // AudioContext, creat la primul PLAY (browserul cere un click)
let master = null;       // volumul general
let zgomot = null;       // un buffer de zgomot alb, pentru hat și snare
let ceas = null;         // intervalul care programează notele
let piesaId = null;      // ce piesă cântă acum
let stil = null;
let melodie = [];        // treptele melodiei (16 pași)
let pas = 0;             // pasul curent din măsură (0..15)
let masura = 0;          // a câta măsură
let urmatorulTimp = 0;   // când trebuie să sune următorul pas (în secunde, ceasul audio)
let durataPas = 0.125;   // secunde pe șaisprezecime, din BPM
let volum = 0.5;         // ultimul volum cerut (0..1), ținut minte și înainte de ctx

/* Număr MIDI -> frecvență (Hz). 69 = nota La (440 Hz). */
const frecventa = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* Generator "aleator" care dă mereu aceleași numere pentru aceeași sămânță */
function aleatorDin(samanta) {
  let s = samanta * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* Pornim sistemul audio o singură dată */
function initializeaza() {
  if (ctx) return;
  ctx = new AudioContext();

  // Compresorul ține sunetul sub control când se suprapun multe note
  const compresor = ctx.createDynamicsCompressor();
  master = ctx.createGain();
  master.gain.value = volumInGain(volum);
  master.connect(compresor);
  compresor.connect(ctx.destination);

  // 1 secundă de zgomot alb (valori aleatoare între -1 și 1)
  zgomot = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const date = zgomot.getChannelData(0);
  for (let i = 0; i < date.length; i++) date[i] = Math.random() * 2 - 1;
}

/* Urechea aude volumul logaritmic: ridicăm la pătrat ca slider-ul să pară liniar */
function volumInGain(v) {
  return v * v * 0.8;
}

/* O notă: oscilator -> filtru -> anvelopă de volum -> master */
function nota(midi, timp, durata, unda, tare, filtruHz) {
  const osc = ctx.createOscillator();
  const filtru = ctx.createBiquadFilter();
  const g = ctx.createGain();

  osc.type = unda;
  osc.frequency.value = frecventa(midi);
  filtru.type = "lowpass";
  filtru.frequency.value = filtruHz;

  // Atac scurt, apoi stingere până la final
  g.gain.setValueAtTime(0.0001, timp);
  g.gain.exponentialRampToValueAtTime(tare, timp + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, timp + durata);

  osc.connect(filtru).connect(g).connect(master);
  osc.start(timp);
  osc.stop(timp + durata + 0.05);
}

/* Toba mare: un sinus care coboară rapid în frecvență */
function kick(timp) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, timp);
  osc.frequency.exponentialRampToValueAtTime(42, timp + 0.12);
  g.gain.setValueAtTime(0.9, timp);
  g.gain.exponentialRampToValueAtTime(0.0001, timp + 0.32);
  osc.connect(g).connect(master);
  osc.start(timp);
  osc.stop(timp + 0.35);
}

/* Hat și snare: zgomot alb filtrat, scurt (hat) sau mai lung (snare) */
function zgomotScurt(timp, durata, frecventaFiltru, tare) {
  const sursa = ctx.createBufferSource();
  const filtru = ctx.createBiquadFilter();
  const g = ctx.createGain();
  sursa.buffer = zgomot;
  filtru.type = "highpass";
  filtru.frequency.value = frecventaFiltru;
  g.gain.setValueAtTime(tare, timp);
  g.gain.exponentialRampToValueAtTime(0.0001, timp + durata);
  sursa.connect(filtru).connect(g).connect(master);
  sursa.start(timp);
  sursa.stop(timp + durata + 0.02);
}

/* Programează toate sunetele unui pas (o șaisprezecime) */
function canta(p, timp) {
  const transpunere = stil.acorduri[masura % stil.acorduri.length];
  const baza = stil.radacina + transpunere;

  if (stil.kick[p] === "x") kick(timp);
  if (stil.snare[p] === "x") zgomotScurt(timp, 0.18, 1500, 0.35);
  if (stil.hat[p] === "x") zgomotScurt(timp, 0.04, 7000, 0.12);
  if (stil.bas[p] === "x") nota(baza, timp, durataPas * 1.8, stil.undaBas, 0.28, stil.filtru);
  if (stil.lead[p] === "x") {
    const treapta = stil.scara[melodie[p] % stil.scara.length];
    nota(baza + 24 + treapta, timp, durataPas * (stil.undaLead === "sine" ? 6 : 1.6), stil.undaLead, 0.09, stil.filtru * 1.5);
  }
}

/* "Planificatorul": la fiecare 25 ms programează notele din următoarele
   100 ms. Așa ritmul rămâne exact chiar dacă pagina e ocupată. */
function programeaza() {
  while (urmatorulTimp < ctx.currentTime + 0.1) {
    canta(pas, urmatorulTimp);
    urmatorulTimp += durataPas;
    pas = (pas + 1) % 16;
    if (pas === 0) masura++;
  }
}

/* ------------------------------------------------------------
   FUNCȚIILE EXPORTATE (folosite din App.jsx)
   ------------------------------------------------------------ */

/* Pornește muzica piesei date. Dacă aceeași piesă cântă deja, nu face nimic. */
export function porneste(piesa) {
  initializeaza();
  ctx.resume(); // browserul poate ține sunetul "adormit" până la primul click

  if (ceas && piesaId === piesa.id) return;
  opreste();

  piesaId = piesa.id;
  stil = STILURI[piesa.gen] ?? STILURI.synthwave;
  durataPas = 60 / piesa.bpm / 4;

  // Melodia: 16 trepte din scară, alese pornind de la id-ul piesei
  const aleator = aleatorDin(piesa.id);
  melodie = Array.from({ length: 16 }, () => Math.floor(aleator() * 6));

  pas = 0;
  masura = 0;
  urmatorulTimp = ctx.currentTime + 0.05;
  ceas = setInterval(programeaza, 25);
}

/* Oprește programarea notelor noi (cele deja programate se sting singure) */
export function opreste() {
  clearInterval(ceas);
  ceas = null;
  piesaId = null;
}

/* Volum între 0 și 1. Schimbarea e lină (setTargetAtTime), fără pocnituri. */
export function seteazaVolum(v) {
  volum = v;
  if (master) master.gain.setTargetAtTime(volumInGain(v), ctx.currentTime, 0.03);
}

/* Sunetul de scratch: o "zgârietură" scurtă de zgomot filtrat.
   viteza = cât de repede e tras discul (pozitiv = înainte, negativ = înapoi).
   Cu cât tragi mai repede, cu atât sunetul e mai ascuțit și mai tare. */
export function scratch(viteza) {
  initializeaza();
  ctx.resume();
  const t = ctx.currentTime;
  const tarie = Math.min(1, Math.abs(viteza) / 12);

  const sursa = ctx.createBufferSource();
  const filtru = ctx.createBiquadFilter();
  const g = ctx.createGain();
  sursa.buffer = zgomot;
  sursa.playbackRate.value = viteza > 0 ? 1.2 : 0.8; // înapoi sună mai "gros"
  filtru.type = "bandpass";
  filtru.Q.value = 6;
  filtru.frequency.setValueAtTime(300 + tarie * 2500, t);
  filtru.frequency.exponentialRampToValueAtTime(200 + tarie * 800, t + 0.07);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05 + tarie * 0.5, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

  sursa.connect(filtru).connect(g).connect(master);
  sursa.start(t, Math.random() * 0.5); // pornim din alt punct al zgomotului, ca să nu sune identic
  sursa.stop(t + 0.1);
}

/* Sunetul de disc spart: o bubuitură joasă, un "crash" de zgomot
   și câteva cioburi scurte și ascuțite care sună la momente diferite. */
export function sparge() {
  initializeaza();
  ctx.resume();
  const t = ctx.currentTime;

  // Bubuitura: un sinus care coboară
  const bum = ctx.createOscillator();
  const gBum = ctx.createGain();
  bum.frequency.setValueAtTime(110, t);
  bum.frequency.exponentialRampToValueAtTime(35, t + 0.25);
  gBum.gain.setValueAtTime(0.9, t);
  gBum.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  bum.connect(gBum).connect(master);
  bum.start(t);
  bum.stop(t + 0.32);

  // Crash-ul: zgomot cu filtru care coboară, ca sticla / plasticul care se rupe
  const sursa = ctx.createBufferSource();
  const filtru = ctx.createBiquadFilter();
  const g = ctx.createGain();
  sursa.buffer = zgomot;
  filtru.type = "highpass";
  filtru.frequency.setValueAtTime(5000, t);
  filtru.frequency.exponentialRampToValueAtTime(700, t + 0.5);
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  sursa.connect(filtru).connect(g).connect(master);
  sursa.start(t);
  sursa.stop(t + 0.65);

  // Cioburile: 7 "clinchete" scurte, la frecvențe și momente aleatoare
  for (let i = 0; i < 7; i++) {
    const tc = t + 0.03 + Math.random() * 0.35;
    const osc = ctx.createOscillator();
    const gc = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 2000 + Math.random() * 4000;
    gc.gain.setValueAtTime(0.0001, tc);
    gc.gain.exponentialRampToValueAtTime(0.12, tc + 0.005);
    gc.gain.exponentialRampToValueAtTime(0.0001, tc + 0.08);
    osc.connect(gc).connect(master);
    osc.start(tc);
    osc.stop(tc + 0.1);
  }
}