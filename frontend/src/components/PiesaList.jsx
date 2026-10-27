/* ============================================================
   CYBERWAVE // PiesaList.jsx
   O listă de piese (coada, liked songs sau random).
   Primește array-ul și funcțiile prin props și le transmite,
   neschimbate, fiecărui PiesaCard. Lista nu modifică nimic singură.
   ============================================================ */

import PiesaCard from "./PiesaCard.jsx";

/* mesajGol are o valoare implicită: dacă părintele nu trimite
   un mesaj propriu, se folosește cel pentru coada audio. */
export default function PiesaList({
  piese,
  curentId,
  ruleaza,
  likedIds,
  onAlege,
  onLike,
  onToggle,
  onDelete,
  mesajGol = "[SYS_MSG]: AUDIO_QUEUE EMPTY. NO TRACKS LOADED.",
}) {
  // 1. Return timpuriu: dacă nu există piese, afișăm mesajul și ne oprim aici
  if (piese.length === 0) {
    return <p className="empty">{mesajGol}</p>;
  }

  // 2. Altfel, câte un card pentru fiecare piesă (map, ca în Etapa 2).
  //    key={piesa.id} stă pe PiesaCard, elementul întors direct din map,
  //    și e id-ul, nu poziția: după o ștergere pozițiile se mută, id-urile nu.
  //    onToggle și onDelete merg mai departe exact cum au venit din App.
  return (
    <ul className="item-list">
      {piese.map((piesa) => (
        <PiesaCard
          key={piesa.id}
          piesa={piesa}
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