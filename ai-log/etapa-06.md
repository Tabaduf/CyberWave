# Stage 6: AI log

## Tools
- Claude

## Conversations
- Moving all the app data out of the React code and onto a mock REST API (json-server + `db.json`), loading it with `fetch` and `useEffect`, and showing a loading state and an error state.

## Key requests

### 1. The data in db.json
- **Asked:** Follow the Stage 6 guide on my current project and move the data to `db.json`, with at least five varied items.
- **Got:** `frontend/db.json` with three resources instead of one: `piese` (the queue, now 5 tracks with different states, formats and genres), `sugestii` (the RANDOM panel) and `playlisturi`. json-server turns each key into a route: `/piese`, `/sugestii`, `/playlisturi`.
- **Changed or rejected:** The guide only moves one list, but my app also had the suggestions and the playlists hard-coded in `App.jsx`. I moved everything, so there is no data left in the React code (S6-R2). The `liked` field stays in the data and is turned into the list of liked ids after loading.

### 2. api.js and the environment variable
- **Asked:** The `api.js` file from step 4, adapted to my resources.
- **Got:** One helper, `cere(ruta)`, that does the `fetch`, checks `res.ok` and throws `Eroare server: <status>` otherwise, plus `fetchPiese`, `fetchSugestii` and `fetchPlaylisturi` (my version of `fetchTasks`). The address comes from `import.meta.env.VITE_API_URL ?? "http://localhost:3001"`, documented in `.env.example`.
- **Changed or rejected:** Kept the rule that `fetch` appears only in `api.js`. I checked with a search in the project that it isn't used anywhere else.

### 3. Loading in App.jsx and the three states
- **Asked:** Load the data on page open and show something for every state, in my terminal style.
- **Got:** The lists start as `useState([])`, with `loading` and `error` states. A `useEffect` with an `ignore` flag in its cleanup loads all three resources at once with `Promise.all`. The panel shows `[SYS]: LOADING TRACK DATABASE FROM API_` while waiting, the content on success, and `[ERR]: COULD NOT LOAD DATA (...). IS THE API RUNNING? START IT WITH npm run api` on failure. The header shows `LINKING TO API...` while loading.
- **Changed or rejected:** Added a `⟳ RETRY` button to the error message. Because of it, the effect depends on a counter (`[incercare]`) instead of `[]`: the first run is still on mount, and RETRY increases the counter so the request runs again without reloading the page. The first track from the API goes on the disc once the data arrives.

## What I learned / what did not work
`fetch` only throws when it can't reach the server at all. A 404 or 500 still "succeeds", which is why `res.ok` has to be checked every time. The function passed to `useEffect` can't be `async`, so the async work goes in an inner `load()` that is called right away. The `ignore` flag matters because in development React mounts the component twice on purpose, and I could see the duplicate requests in the Network tab. I tested the error state by stopping `npm run api` and refreshing: the error message appeared instead of a blank page, and RETRY loaded the list once the API was back up. With `--delay 4000` the loading message stays on screen long enough to see it. Checking and deleting tracks still only change the state, so they reset on refresh; saving them on the server comes in Stage 7.
