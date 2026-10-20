/* ============================================================
   CYBERWAVE // MeniuPlaylist.jsx
   Butonul "+ PLAYLIST" din player și meniul care se deschide:
   - click pe un playlist = adaugă / scoate piesa curentă;
   - jos se poate crea un playlist nou, care pornește cu piesa curentă.
   Playlisturile NU stau aici, ci în App; meniul doar le afișează
   și anunță ce s-a ales prin onComuta / onCreeaza.
   ============================================================ */

import { useState } from "react";

export default function MeniuPlaylist({ playlisturi, piesaId, onComuta, onCreeaza }) {
  // Stare locală: privește doar meniul, deci nu urcă în App
  const [deschis, setDeschis] = useState(false);
  const [numeNou, setNumeNou] = useState("");

  // De câte playlisturi aparține piesa (apare pe buton)
  const inCate = playlisturi.filter((pl) => pl.pieseIds.includes(piesaId)).length;

  // Trimiterea formularului: Enter în câmp sau click pe CREATE
  function laCreare(e) {
    e.preventDefault(); // altfel browserul reîncarcă pagina
    if (onCreeaza(numeNou)) {
      setNumeNou("");
      setDeschis(false);
    }
  }

  return (
    <div className="pl-menu">
      <button
        type="button"
        className={deschis ? "action-btn activ" : "action-btn"}
        onClick={() => setDeschis(!deschis)}
        aria-expanded={deschis}
      >
        + PLAYLIST{inCate > 0 && <span className="action-count">{inCate}</span>}
      </button>

      {/* Meniul apare doar cât e deschis */}
      {deschis && (
        <div className="pl-popover">
          <div className="pl-popover-head">
            <span>ADD_TO://</span>
            <button type="button" className="pl-close" onClick={() => setDeschis(false)} aria-label="Închide">
              ✕
            </button>
          </div>

          <ul className="pl-options">
            {playlisturi.map((pl) => {
              const contine = pl.pieseIds.includes(piesaId);
              return (
                <li key={pl.id}>
                  <button
                    type="button"
                    data-gen={pl.gen}
                    className={contine ? "pl-option bifat" : "pl-option"}
                    onClick={() => onComuta(pl.id)}
                  >
                    {/* Bifa arată dacă piesa e deja în playlist */}
                    <span className="pl-check">{contine ? "■" : "□"}</span>
                    <span className="pl-option-name">{pl.nume}</span>
                    <span className="meta-text">{pl.pieseIds.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Playlist nou. value + onChange = câmp "controlat": textul stă în stare */}
          <form className="pl-new" onSubmit={laCreare}>
            <input
              type="text"
              value={numeNou}
              onChange={(e) => setNumeNou(e.target.value)}
              placeholder="NEW_PLAYLIST..."
              maxLength={20}
              aria-label="Nume playlist nou"
            />
            <button type="submit" disabled={numeNou.trim() === ""}>
              CREATE
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
