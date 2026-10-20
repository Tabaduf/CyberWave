/* ============================================================
   CYBERWAVE // PiesaList.jsx
   O listă de piese (coada, liked songs sau random).
   Primește array-ul prin props și desenează câte un
   PiesaCard pentru fiecare piesă.
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
  mesajGol = "[SYS_MSG]: AUDIO_QUEUE EMPTY. NO TRACKS LOADED.",
}) {
  // 1. Return timpuriu: dacă nu există piese, afișăm mesajul și ne oprim aici
  if (piese.length === 0) {
    return <p className="empty">{mesajGol}</p>;
  }

  // 2. Altfel, transformăm fiecare piesă într-un card cu map (ca în Etapa 2).
  //    key={piesa.id} stă pe PiesaCard, adică pe elementul întors direct din map.
  //    React folosește key ca să recunoască fiecare card între două randări,
  //    de aceea e id-ul (unic și stabil), nu poziția din listă.
  //    La click, trimitem în sus piesa și lista din care a fost aleasă.
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
        />
      ))}
    </ul>
  );
}