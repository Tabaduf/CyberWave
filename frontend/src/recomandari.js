/* ============================================================
   CYBERWAVE // recomandari.js
   Feed-ul FOR_YOU: recomandări calculate din statisticile de ascultare.
   Funcții pure, ca în Etapa 2: primesc date, întorc date noi,
   nu modifică nimic și nu știu nimic despre React.

   Pașii:
   1. profilAscultare  - din statistici și like-uri: ce genuri îți plac
                         (în procente) și ce tempo (BPM) asculți de obicei;
   2. genereazaFeed    - inventează piese noi pe gusturile tale. Le poate
                         "cânta" sintetizatorul, pentru că o piesă e doar
                         gen + BPM + id. Fiecare primește un procent de
                         potrivire și un motiv ("BECAUSE YOU PLAY ...").
   ============================================================ */

const GENURI = ["synthwave", "darksynth", "chiptune", "industrial", "vaporwave", "lo-fi", "drum&bass", "ambient"];

/* Tempo-ul tipic al fiecărui gen [minim, maxim] */
const TEMPO_GEN = {
  synthwave: [95, 125],
  darksynth: [110, 150],
  chiptune: [130, 170],
  industrial: [110, 140],
  vaporwave: [70, 95],
  "lo-fi": [65, 90],
  "drum&bass": [165, 178],
  ambient: [50, 80],
};

/* Cuvinte pentru nume de artiști și titluri (piesele sunt inventate) */
const ARTIST_A = ["NEON", "VOID", "CHROME", "GHOST", "PIXEL", "STATIC", "HEX", "NULL", "LASER", "ECHO", "NIGHT", "BINARY"];
const ARTIST_B = ["RUNNER", "PROTOCOL", "SIGNAL", "DRIVER", "ORACLE", "SYNDICATE", "MACHINE", "KERNEL", "DAEMON", "CIRCUIT"];
const TITLURI = {
  synthwave: ["SUNSET_GRID", "MIDNIGHT_DRIVE", "PALM_CIRCUIT", "NEON_HIGHWAY", "RETRO_HEART", "OUTRUN_93"],
  darksynth: ["BLOOD_MOON", "DEAD_PIXEL", "IRON_CATHEDRAL", "FATAL_ERROR", "BLACK_ICE", "KILL_SWITCH"],
  chiptune: ["LEVEL_UP", "EXTRA_LIFE", "BOSS_RUSH", "SAVE_POINT", "PIXEL_QUEST", "CONTINUE"],
  industrial: ["STEEL_PRESS", "RUST_BELT", "HYDRAULIC", "FACTORY_9", "SPARK_PLUG", "COLD_FORGE"],
  vaporwave: ["MALL_SODA", "AQUA_LOBBY", "DIAL_TONE", "PLAZA_95", "MARBLE_DREAM", "VHS_SUNDAY"],
  "lo-fi": ["RAIN_ON_GLASS", "COFFEE_BREAK", "LATE_SHIFT", "TAPE_HISS", "DESK_LAMP", "SLOW_COMMIT"],
  "drum&bass": ["AMEN_BREAK", "PACKET_LOSS", "REDLINE", "JUNGLE_OS", "HYPERLOOP", "BASS_OVERFLOW"],
  ambient: ["ORBIT", "DEEP_FIELD", "AURORA", "STATIC_SKY", "DRIFT", "SLOW_LIGHT"],
};
const FORMATE = ["flac", "mp3", "synth"];

/* Generator "aleator" cu sămânță: aceeași sămânță dă același feed */
function aleatorDin(samanta) {
  let s = (samanta % 233280) + 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const alege = (lista, aleator) => lista[Math.floor(aleator() * lista.length)];
const limiteaza = (x, min, max) => Math.min(Math.max(x, min), max);

/* ------------------------------------------------------------
   1. PROFILUL: ce asculți
   ponderi = câte secunde pe gen, plus un bonus de 60 s pentru
   fiecare piesă apreciată (un like contează cât un minut ascultat).
   ------------------------------------------------------------ */
export function profilAscultare(statistici, toatePiesele, likedIds) {
  const ponderi = {};
  for (const gen of GENURI) ponderi[gen] = statistici.genuri[gen] ?? 0;

  for (const id of likedIds) {
    const piesa = toatePiesele.find((p) => p.id === id);
    if (piesa) ponderi[piesa.gen] = (ponderi[piesa.gen] ?? 0) + 60;
  }

  const total = Object.values(ponderi).reduce((s, v) => s + v, 0);

  // Procentele, de la cel mai ascultat gen la cel mai puțin
  const genuri = GENURI.map((gen) => ({ gen, procent: total > 0 ? ponderi[gen] / total : 0 }))
    .filter((g) => g.procent > 0)
    .sort((a, b) => b.procent - a.procent);

  // Tempo-ul mediu, ponderat cu timpul ascultat din fiecare piesă
  let sumaBpm = 0;
  let sumaSecunde = 0;
  for (const [id, secunde] of Object.entries(statistici.secunde)) {
    const piesa = toatePiesele.find((p) => p.id === Number(id));
    if (piesa) {
      sumaBpm += piesa.bpm * secunde;
      sumaSecunde += secunde;
    }
  }
  const bpmMediu = sumaSecunde > 0 ? Math.round(sumaBpm / sumaSecunde) : 120;

  // O piesă apreciată, pentru motive de tipul "BECAUSE YOU LIKED ..."
  const apreciate = likedIds.map((id) => toatePiesele.find((p) => p.id === id)).filter(Boolean);

  return { genuri, bpmMediu, apreciate, areDate: total > 0 };
}

/* ------------------------------------------------------------
   2. FEED-UL: piese noi, pe gusturile din profil
   ------------------------------------------------------------ */
export function genereazaFeed(profil, samanta, primulId, cate = 8) {
  const aleator = aleatorDin(samanta);
  const titluriFolosite = new Set();
  const feed = [];

  // Alege un gen proporțional cu procentul lui (ca o ruletă)
  function genDupaGust() {
    let r = aleator();
    for (const g of profil.genuri) {
      r -= g.procent;
      if (r <= 0) return g.gen;
    }
    return profil.genuri[0].gen;
  }

  for (let i = 0; i < cate; i++) {
    // 1 din 5 recomandări (sau toate, dacă nu există date) e "explorare": alt gen
    const exploreaza = !profil.areDate || aleator() < 0.2;
    const gen = exploreaza ? alege(GENURI, aleator) : genDupaGust();

    // Tempo: aproape de cel ascultat de tine, dar în limitele genului
    const [min, max] = TEMPO_GEN[gen];
    const bpm = Math.round(limiteaza(profil.bpmMediu + (aleator() - 0.5) * 20, min, max));

    // Titlu unic în feed: numele piesei nu se repetă (cât timp mai sunt nume libere)
    const libere = TITLURI[gen].filter((t) => !titluriFolosite.has(t));
    const numePiesa = alege(libere.length > 0 ? libere : TITLURI[gen], aleator);
    titluriFolosite.add(numePiesa);
    const titlu = `${alege(ARTIST_A, aleator)}_${alege(ARTIST_B, aleator)} - ${numePiesa}`;

    // Potrivirea: 70% cât de mult îți place genul, 30% cât de aproape e tempo-ul
    const procentGen = profil.genuri.find((g) => g.gen === gen)?.procent ?? 0;
    const maxGen = profil.genuri[0]?.procent ?? 1;
    const potrivireGen = maxGen > 0 ? procentGen / maxGen : 0;
    const potrivireTempo = 1 - Math.min(1, Math.abs(bpm - profil.bpmMediu) / 60);
    const potrivire = Math.round(limiteaza((0.7 * potrivireGen + 0.3 * potrivireTempo) * 100, 30, 99));

    // Motivul afișat sub piesă
    const apreciataDinGen = profil.apreciate.find((p) => p.gen === gen);
    let motiv;
    if (exploreaza || procentGen === 0) motiv = `EXPLORE: NEW SIGNAL IN ${gen.toUpperCase()}`;
    else if (apreciataDinGen && aleator() < 0.35) motiv = `BECAUSE YOU LIKED ${apreciataDinGen.titlu}`;
    else if (potrivireTempo > 0.85) motiv = `TEMPO MATCH ~${profil.bpmMediu} BPM`;
    else motiv = `BECAUSE YOU PLAY ${gen.toUpperCase()} (${Math.round(procentGen * 100)}%)`;

    feed.push({
      piesa: {
        id: primulId + i,
        titlu,
        redata: false,
        format: alege(FORMATE, aleator),
        gen,
        bpm,
        durata: 150 + Math.floor(aleator() * 180),
        liked: false,
        cover: null,
      },
      potrivire,
      motiv,
    });
  }

  // Cele mai potrivite primele
  return feed.sort((a, b) => b.potrivire - a.potrivire);
}
