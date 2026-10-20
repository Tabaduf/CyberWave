/* ============================================================
   CYBERWAVE // Vinil.jsx
   Discul de vinil cu coperta piesei în centru și brațul pick-up.
   - viteza de rotație vine din BPM-ul piesei;
   - culorile vin din genul piesei (paleta e pusă pe .app);
   - poziția brațului urmărește cât s-a derulat din piesă.
   ============================================================ */

/* Unghiurile brațului (grade), măsurate pe desen:
   REPAUS = ridicat, lângă disc; START = marginea discului
   (începutul piesei); FINAL = lângă eticheta din mijloc (finalul piesei). */
const UNGHI_REPAUS = -10;
const UNGHI_START = 3;
const UNGHI_FINAL = 24;

export default function Vinil({ piesa, ruleaza, rewind, progres }) {
  // O rotație completă = o măsură muzicală (4 bătăi).
  // 60 / bpm = secunde pe bătaie, deci 140 BPM -> ~1.7 s pe tură.
  const durataRotatie = (60 / piesa.bpm) * 4;

  // Brațul stă pe disc dacă piesa rulează sau a fost începută.
  // Pe disc, unghiul crește proporțional cu progresul (0 -> 1).
  const peDisc = ruleaza || rewind || progres > 0;
  const unghi = peDisc ? UNGHI_START + (UNGHI_FINAL - UNGHI_START) * progres : UNGHI_REPAUS;

  // Clasele după stare: CSS-ul pornește rotația / animația de rewind
  let clase = "vinyl-wrap";
  if (ruleaza) clase += " playing";
  if (rewind) clase += " rewinding";

  // Variabile CSS trimise prin style: CSS-ul le citește cu var(--rot) și var(--arm)
  const stil = {
    "--rot": `${durataRotatie.toFixed(2)}s`,
    "--arm": `${unghi}deg`,
  };

  return (
    <div className={clase} style={stil}>
      {/* Brațul pick-up-ului */}
      <div className="tonearm" aria-hidden="true"></div>

      {/* Două straturi: exteriorul face rewind-ul, interiorul rotația normală.
          Așa rewind-ul nu "sare" din poziția la care se afla discul. */}
      <div className="vinyl-rewind">
        <div className="vinyl">
          <div className="vinyl-label">
            {/* Randare condiționată: copertă dacă există, altfel imaginea de rezervă */}
            {piesa.cover ? (
              <img src={piesa.cover} alt={`Copertă: ${piesa.titlu}`} />
            ) : (
              <div className="no-cover">no img found :(</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}