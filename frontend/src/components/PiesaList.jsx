/* ============================================================
   CYBERWAVE // PiesaList.jsx
   Întreaga coadă audio.
   Primește tot array-ul prin props și desenează câte un
   PiesaCard pentru fiecare piesă.
   ============================================================ */

import PiesaCard from "./PiesaCard.jsx";

export default function PiesaList({ piese }) {
  // 1. Return timpuriu: dacă nu există piese, afișăm mesajul și ne oprim aici
  if (piese.length === 0) {
    return <p className="empty">[SYS_MSG]: AUDIO_QUEUE EMPTY. NO TRACKS LOADED.</p>;
  }

  // 2. Altfel, transformăm fiecare piesă într-un card cu map (ca în Etapa 2).
  //    key={piesa.id} stă pe PiesaCard, adică pe elementul întors direct din map.
  //    React folosește key ca să recunoască fiecare card între două randări,
  //    de aceea e id-ul (unic și stabil), nu poziția din listă.
  return (
    <ul className="item-list">
      {piese.map((piesa) => (
        <PiesaCard key={piesa.id} piesa={piesa} />
      ))}
    </ul>
  );
}
