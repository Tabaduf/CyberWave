/* ============================================================
   CYBERWAVE // PlaylistGrid.jsx
   Grila de playlisturi: câte o "copertă" colorată pentru fiecare,
   plus primele piese din playlist (se actualizează în timp real
   când adaugi / scoți piese din player).
   Click pe un playlist -> prima lui piesă ajunge pe disc.
   ============================================================ */

/* Câte titluri arătăm pe card înainte de "+N MORE" */
const MAX_TITLURI = 3;

export default function PlaylistGrid({ playlisturi, toatePiesele, curentId, onAlege }) {
  if (playlisturi.length === 0) {
    return <p className="empty">[SYS_MSG]: NO PLAYLISTS IN THIS GENRE.</p>;
  }

  return (
    <ul className="playlist-grid">
      {playlisturi.map((pl) => {
        // Din id-uri obținem piesele, ca să le putem afișa titlurile
        const pieseLista = pl.pieseIds.map((id) => toatePiesele.find((p) => p.id === id));
        const rest = pieseLista.length - MAX_TITLURI;

        return (
          // data-gen dă cardului culorile genului playlistului
          <li key={pl.id} className="playlist-card" data-gen={pl.gen}>
            <button type="button" className="playlist-btn" onClick={() => onAlege(pl)}>
              <span className="playlist-cover">
                <span className="playlist-initiale">{pl.nume.slice(0, 2)}</span>
                <span className="playlist-play" aria-hidden="true">▶</span>
              </span>
              <span className="playlist-name">{pl.nume}</span>
              <span className="meta-text">
                {/* "1 TRACK", dar "3 TRACKS" */}
                {pl.pieseIds.length} {pl.pieseIds.length === 1 ? "TRACK" : "TRACKS"} · {pl.gen.toUpperCase()}
              </span>

              {/* Primele titluri; cel de pe disc e evidențiat */}
              <span className="playlist-tracks">
                {pieseLista.slice(0, MAX_TITLURI).map((p) => (
                  <span key={p.id} className={p.id === curentId ? "pl-track curent" : "pl-track"}>
                    {p.titlu}
                  </span>
                ))}
                {rest > 0 && <span className="pl-track more">+{rest} MORE</span>}
                {pieseLista.length === 0 && <span className="pl-track more">EMPTY</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}