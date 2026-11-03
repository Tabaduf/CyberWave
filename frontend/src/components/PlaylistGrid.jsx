/* ============================================================
   CYBERWAVE // PlaylistGrid.jsx
   Grila de playlisturi: câte o "copertă" colorată pentru fiecare,
   plus primele piese din playlist (se actualizează în timp real
   când adaugi / scoți piese din player).
   Click pe un playlist -> prima lui piesă ajunge pe disc.
   Disc de vinil ținut deasupra -> cardul se luminează (tintaId);
   lăsat acolo -> piesa intră în playlist și cardul face "+1" (animatie).
   ============================================================ */

/* Câte titluri arătăm pe card înainte de "+N MORE" */
const MAX_TITLURI = 3;

export default function PlaylistGrid({ playlisturi, toatePiesele, curentId, tintaId, animatie, onAlege }) {
  if (playlisturi.length === 0) {
    return <p className="empty">[SYS_MSG]: NO PLAYLISTS IN THIS GENRE.</p>;
  }

  return (
    <ul className="playlist-grid">
      {playlisturi.map((pl) => {
        // Din id-uri obținem piesele, ca să le putem afișa titlurile
        // filter(Boolean) scoate piesele care nu mai există (ex.: din feed-uri vechi)
        const pieseLista = pl.pieseIds.map((id) => toatePiesele.find((p) => p.id === id)).filter(Boolean);
        const rest = pieseLista.length - MAX_TITLURI;

        return (
          // data-gen dă cardului culorile genului playlistului
          // data-playlist-id: după el găsește discul ținut în mână cardul de sub mouse
          <li
            key={pl.id}
            className={pl.id === tintaId ? "playlist-card tinta" : "playlist-card"}
            data-gen={pl.gen}
            data-playlist-id={pl.id}
          >
            {/* Efectul de "+1" după drop. key nou la fiecare drop = animația pornește din nou */}
            {animatie && animatie.id === pl.id && (
              <span key={animatie.nonce} className="pl-drop-fx" aria-hidden="true">
                <span className="pl-drop-plus">{animatie.nou ? "+1" : "✓ ALREADY HERE"}</span>
              </span>
            )}
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