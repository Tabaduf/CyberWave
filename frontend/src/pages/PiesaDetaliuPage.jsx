/* ============================================================
   CYBERWAVE // pages/PiesaDetaliuPage.jsx
   Etapa 8: pagina unei singure piese, la adresa /piese/:id
   (resursa "piese" din tw.json; TaskDetaliuPage din ghid).

   - useParams() citește id-ul din adresă, ca TEXT ("3", nu 3);
   - piesa se cere de la server cu fetchPiesa(id), exact ea;
   - piesele din panoul RANDOM stau pe server la /sugestii, deci
     linkul lor are în plus ?sursa=sugestii (citit cu useSearchParams);
   - pentru un id inexistent serverul răspunde 404: pagina arată
     mesajul de eroare și drumul înapoi, nu un ecran gol.

   Arată mai mult decât cardul din listă: coperta mare, artistul și
   titlul separat, durata, dacă e apreciată, în ce playlisturi apare,
   plus butonul care o pune pe disc și linkuri spre piesa vecină.
   ============================================================ */

import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { fetchPiesa } from "../api.js";
import { ETICHETE_FORMAT } from "../constants.js";
import { formatTimp } from "../format.js";
import styles from "./PiesaDetaliuPage.module.css";

export default function PiesaDetaliuPage() {
  const { id } = useParams(); // text din URL, de exemplu "3"
  const [searchParams] = useSearchParams();
  const sursa = searchParams.get("sursa") === "sugestii" ? "sugestii" : "piese";

  // Starea comună (player-ul, playlisturile), trimisă de Layout
  const app = useOutletContext();

  const [piesa, setPiesa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Se reîncarcă dacă se schimbă id-ul (sau resursa) din adresă
  useEffect(() => {
    let ignore = false;

    fetchPiesa(id, sursa)
      .then((data) => {
        if (!ignore) {
          setPiesa(data);
          setError(null); // o eroare de la un id anterior nu mai este valabilă
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, sursa]);

  if (loading) {
    return (
      <div className="container">
        <p className="info" data-testid="loading">
          [SYS]: READING TRACK #{id} FROM API<span className="cursor">_</span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <section className={`panel ${styles.detail}`}>
          <h2>&gt;&gt; TRACK_NOT_FOUND</h2>
          <p className="error" data-testid="error">
            [ERR]: Piesa nu a putut fi încărcată: {error}
          </p>
          <Link to="/" className={styles.back}>
            ◂ ÎNAPOI LA LISTĂ
          </Link>
        </section>
      </div>
    );
  }

  /* --- Valori derivate --- */
  // "ARTIST - TRACK" -> ["ARTIST", "TRACK"]; dacă nu are " - ", totul e titlul
  const parti = piesa.titlu.split(" - ");
  const artist = parti.length > 1 ? parti[0] : null;
  const numePiesa = parti.length > 1 ? parti.slice(1).join(" - ") : piesa.titlu;

  // Lista din care face parte piesa (coada sau RANDOM), din starea comună
  const lista = sursa === "sugestii" ? app.sugestii : app.piese;
  const index = lista.findIndex((p) => p.id === piesa.id);
  const anterioara = index > 0 ? lista[index - 1] : null;
  const urmatoarea = index >= 0 && index < lista.length - 1 ? lista[index + 1] : null;
  const query = sursa === "sugestii" ? "?sursa=sugestii" : "";

  // Playlisturile care o conțin și starea ei în player
  const inPlaylisturi = app.playlisturi.filter((pl) => pl.pieseIds.includes(piesa.id));
  const liked = app.likedIds.includes(piesa.id);
  const peDisc = app.curentId === piesa.id;
  const dinLista = index >= 0 ? lista[index] : null; // aceeași piesă, din starea aplicației

  return (
    <div className="container">
      <section className={`panel ${styles.detail}`} data-testid="detail" data-gen={piesa.gen}>
        <Link to="/" className={styles.back}>
          ◂ ÎNAPOI LA LISTĂ
        </Link>

        <div className={styles.layout}>
          {/* Coperta mare, în stilul discului din player */}
          <div className={peDisc && app.ruleaza ? `${styles.disc} ${styles.spinning}` : styles.disc}>
            <div className={styles.eticheta}>
              {piesa.cover ? (
                <img src={piesa.cover} alt={`Copertă: ${piesa.titlu}`} />
              ) : (
                <span className={styles.noCover}>no img found :(</span>
              )}
            </div>
          </div>

          <div className={styles.info}>
            <p className={styles.cmd}>$ cat /{sursa}/{piesa.id}</p>
            <h2 className={piesa.redata ? styles.done : undefined} data-testid="detail-title">
              {piesa.titlu}
            </h2>

            {/* Câmpurile piesei, într-o listă de definiții (dl, dt, dd) */}
            <dl className={styles.fields}>
              {artist && (
                <>
                  <dt>ARTIST</dt>
                  <dd>{artist}</dd>
                  <dt>TRACK</dt>
                  <dd>{numePiesa}</dd>
                </>
              )}
              <dt>FORMAT</dt>
              <dd>
                <span className={`badge badge-${piesa.format}`}>{ETICHETE_FORMAT[piesa.format]}</span>
              </dd>
              <dt>GENRE</dt>
              <dd>
                <span className="gen-tag">{piesa.gen.toUpperCase()}</span>
              </dd>
              <dt>TEMPO</dt>
              <dd>{piesa.bpm} BPM</dd>
              <dt>DURATION</dt>
              <dd>{formatTimp(piesa.durata)}</dd>
              <dt>STATUS</dt>
              <dd>{piesa.redata ? "PLAYED" : "PENDING"}</dd>
              <dt>LIKED</dt>
              <dd>{liked ? "♥ YES" : "♡ NO"}</dd>
              <dt>PLAYLISTS</dt>
              <dd>
                {inPlaylisturi.length === 0
                  ? "—"
                  : inPlaylisturi.map((pl) => (
                      <span key={pl.id} className={styles.playlist} data-gen={pl.gen}>
                        {pl.nume}
                      </span>
                    ))}
              </dd>
              <dt>SOURCE</dt>
              <dd>/{sursa}</dd>
              <dt>ID</dt>
              <dd>{piesa.id}</dd>
            </dl>

            <div className={styles.actions}>
              {/* Pune piesa pe disc; lista ei devine ordinea pentru ⏮ / ⏭ */}
              <button
                type="button"
                className="action-btn"
                disabled={!dinLista}
                onClick={() => app.handleAlegePiesa(dinLista, lista)}
              >
                ▶ PLAY ON DECK
              </button>
              <button
                type="button"
                className={liked ? "action-btn liked-on" : "action-btn"}
                aria-pressed={liked}
                disabled={!dinLista}
                onClick={() => app.handleLike(dinLista)}
              >
                {liked ? "♥ LIKED" : "♡ LIKE"}
              </button>
              {peDisc && <span className="on-deck-tag">◉ ON_DECK</span>}
            </div>
          </div>
        </div>

        {/* Piesa vecină din aceeași listă: se schimbă doar id-ul din adresă,
            iar efectul de mai sus cere noua piesă de la server */}
        <nav className={styles.vecini} aria-label="Piese vecine">
          {anterioara ? (
            <Link to={`/piese/${anterioara.id}${query}`}>◂ {anterioara.titlu}</Link>
          ) : (
            <span />
          )}
          {urmatoarea && <Link to={`/piese/${urmatoarea.id}${query}`}>{urmatoarea.titlu} ▸</Link>}
        </nav>
      </section>
    </div>
  );
}
