# Stage 8: AI log

## Tools
- Claude

## Conversations
- Splitting the app into pages with React Router (list, detail page, about page, 404) and moving the styles from one big `App.css` (almost 2000 lines) into CSS Modules, adapted to my theme (resource `piese` from `tw.json`).

## Key requests

### 1. Routes and a shared layout
- **Asked:** Continue the project with the Stage 8 requirements, adapted to my theme.
- **Got:** `BrowserRouter` in `main.jsx`, and `App.jsx` reduced to the route map: `/` (`PiesePage`), `/piese/:id` (`PiesaDetaliuPage`), `/despre` and `*` (`NotFoundPage`), all inside a `Layout` with `<Outlet />`. The header has two `NavLink`s, `≡ PIESE` (with `end`) and `ⓘ DESPRE`, in a `nav` with `data-testid="nav"`.
- **Changed or rejected:** In the guide, all the state moves into the list page. In my app that would stop the music every time I open a detail page, because the player, the bottom bar and the game would unmount. So the state from `App.jsx` moved, unchanged, into a custom hook (`hooks/useCyberwave.js`). `Layout` calls it once and passes it to the pages with `<Outlet context={app} />`; the pages read it with `useOutletContext()`. The bottom player bar, the toast and the game also live in `Layout`, so they stay on every page. The selected tab and genre are kept there too, so going back from a detail page shows the list exactly as I left it. The track counter moved from the header into the list panel.

### 2. The detail page
- **Asked:** The detail page from step 6, for my tracks.
- **Got:** `fetchPiesa(id)` in `api.js` and a page that reads the id with `useParams`, asks the server for that track in a `useEffect` with `[id]` dependencies, and shows `loading`, `error` (with a link back) or the `detail` section with `detail-title`.
- **Changed or rejected:** The tracks in the RANDOM tab are stored at `/sugestii`, not `/piese`, so their link is `/piese/101?sursa=sugestii` and the page reads `sursa` with `useSearchParams`. The page shows what the card doesn't: big cover on a vinyl, artist and track split from the title, duration, liked, the playlists that contain it, the source, a `▶ PLAY ON DECK` button and a LIKE button (both use the shared state), and links to the previous / next track in the same list. Those links change only the id in the address, which is a good test for the `[id]` dependency. Tracks generated in FOR_YOU aren't on the server, so their titles are not links.

### 3. CSS Modules
- **Asked:** Move the styles next to the components.
- **Got:** One `.module.css` per component and page. `index.css` keeps the `@property` colors, the light / dark theme, the genre palettes, `body`, and the shared classes (`.panel`, `.btn`, `.action-btn`, `.btn-danger`, `.error`, `.empty`, badges, `.gen-tag`, `.like-btn`, the mini-disc). `FORMATE`, `ETICHETE_FORMAT` and the genre lists moved to `constants.js`.
- **Changed or rejected:** A few things broke under modules and had to be fixed:
  - Animations defined in one file aren't visible from another (`@keyframes` names are local too), so each module defines its own.
  - Styles that depend on the music playing (the equalizer, the wave) use `:global(.is-playing)`, which `Layout` sets as a plain-text class.
  - `FeedList` reuses `PiesaCard.module.css`, so the feed cards look exactly like the list cards.
  - The vinyl dropped onto a playlist looked for `.playlist-cover` with `querySelector`. That class name doesn't exist after the build anymore, so it now looks for a `data-cover` attribute.

### 4. Card title as a link and the checks
- **Asked:** Keep the Stage 7 attributes and add the ones from table 8.2.
- **Got:** The card title is now a `<Link>` with `data-testid="item-link"` (instead of `item-title`); the `<label>` became a `div` and the checkbox got an `aria-label`. `item`, `data-id`, `item-toggle`, `item-delete`, the form attributes and `loading` / `error` stayed on the same elements.
- **Changed or rejected:** `npm run lint` already had 8 errors before this stage. `formatTimp` moved out of `Comenzi.jsx` into `format.js`, because a component file should only export components. `performance.now()` inside the vinyl's pointer handlers was replaced with `e.timeStamp`, which uses the same clock. Lint now passes with no errors.

## What I learned / what did not work
`useParams` always returns text, so `/piese/1` gives `"1"`. The links in the header are `NavLink`s and mark the current page by themselves; without `end`, `PIESE` stayed active on every page. Opening `/piese/999` returns 404 from json-server, and `request()` turns it into an error, which the page shows instead of an empty screen. I opened every route in a headless browser on the built app (`npm run build` + `vite preview`): `/` has 10 `item` and 10 `item-link`, `/piese/1` has `detail` and `detail-title` "MASTER_BOOT_RECORD - CHKDSK", `/piese/999` has `error`, `/ceva` has `not-found`, and every page has `nav`. The bottom player bar stays the same on every page, because `Layout` never unmounts while navigating; that's why the music keeps playing from the list to a detail page and back.
