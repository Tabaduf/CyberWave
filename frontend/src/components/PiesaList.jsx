/* ============================================================
   CYBERWAVE // PiesaList.jsx
   O listă de piese (coada, liked songs sau random).
   Primește array-ul și funcțiile prin props și le transmite,
   neschimbate, fiecărui PiesaCard. Lista nu modifică nimic singură.
   Etapa 8: linkCatre(piesa) dă adresa paginii de detaliu a fiecărei
   piese, iar clasa listei vine din PiesaList.module.css.
   ============================================================ */

import PiesaCard from "./PiesaCard.jsx";
import styles from "./PiesaList.module.css";

/* mesajGol are o valoare implicită: dacă părintele nu trimite
   un mesaj propriu, se folosește cel pentru coada audio.
   linkCatre implicit: /piese/:id (resursa din tw.json). */
export default function PiesaList({
  piese,
  curentId,
  ruleaza,
  likedIds,
  onAlege,
  onLike,
  onToggle,
  onDelete,
  linkCatre = (piesa) => `/piese/${piesa.id}`,
  mesajGol = "[SYS_MSG]: AUDIO_QUEUE EMPTY. NO TRACKS LOADED.",
}) {
  // 1. Return timpuriu: dacă nu există piese, afișăm mesajul și ne oprim aici
  if (piese.length === 0) {
    return (
      <p className="empty" data-testid="empty">
        {mesajGol}
      </p>
    );
  }

  // 2. Altfel, câte un card pentru fiecare piesă (map, ca în Etapa 2).
  //    key={piesa.id} stă pe PiesaCard, elementul întors direct din map,
  //    și e id-ul, nu poziția: după o ștergere pozițiile se mută, id-urile nu.
  return (
    <ul className={styles.list}>
      {piese.map((piesa) => (
        <PiesaCard
          key={piesa.id}
          piesa={piesa}
          link={linkCatre(piesa)}
          peDisc={piesa.id === curentId}
          ruleaza={ruleaza && piesa.id === curentId}
          liked={likedIds.includes(piesa.id)}
          onAlege={() => onAlege(piesa, piese)}
          onLike={() => onLike(piesa)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
