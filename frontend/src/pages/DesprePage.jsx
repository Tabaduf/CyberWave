/* ============================================================
   CYBERWAVE // pages/DesprePage.jsx
   Etapa 8: pagina de prezentare, la adresa /despre.
   Text static, din README; folosește doar clasele comune.
   ============================================================ */

export default function DesprePage() {
  return (
    <div className="container">
      <section className="panel">
        <h2>&gt;&gt; DESPRE CYBERWAVE</h2>
        <p>
          CyberWave este o bibliotecă muzicală și un manager de coadă audio, fără reclame,
          inspirat de cyberdeck-uri și de estetica terminalului. Piesele sunt organizate
          după format (FLAC, MP3, SYNTH) și gen, iar aplicația a fost construită pas cu pas,
          pe parcursul semestrului, în cadrul proiectului de Tehnologii Web.
        </p>
        <p>Ce poți face:</p>
        <ul>
          <li>adaugi piese în coadă, le bifezi ca redate și le ștergi;</li>
          <li>deschizi pagina fiecărei piese, cu toate detaliile ei;</li>
          <li>asculți muzică generată în browser, pe un disc de vinil pe care îl poți „scratch-ui”;</li>
          <li>organizezi piesele în LIKED_SONGS și în playlisturi;</li>
          <li>primești recomandări în FOR_YOU și îți vezi statisticile în SYS_LOG;</li>
          <li>joci Tunnel Runner pe ritmul piesei care cântă.</li>
        </ul>
        <p className="meta-text">
          STACK: React, Vite, React Router, CSS Modules, json-server (Node.js, Express, MariaDB și
          Docker în etapele următoare).
        </p>
      </section>
    </div>
  );
}
