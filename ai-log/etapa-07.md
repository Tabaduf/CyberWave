# Stage 7: AI log

## Tools
- Claude

## Conversations
- Adding a form that creates new tracks from the page, with validation, and moving every change (add, check, delete, like, playlists) to the API so it survives a page refresh. Also preparing the app for the automatic check with `tw.json` and the `data-testid` attributes.

## Key requests

### 1. api.js with a common request function
- **Asked:** Extend `api.js` as in step 1, for my resources.
- **Got:** One `request(path, options)` function that adds the JSON header, checks `res.ok` and handles a `204` response without a body. On top of it: `createPiesa` (POST), `updatePiesa` (PATCH), `deletePiesa` (DELETE), the same PATCH/DELETE for `sugestii`, and `createPlaylist` / `updatePlaylist`.
- **Changed or rejected:** `fetch` still appears only in `api.js`. I checked with a search in `src/`.

### 2. The form (PiesaForm)
- **Asked:** The `TaskForm` from step 2, adapted to my theme and to the look of my Stage 1 mockup.
- **Got:** `PiesaForm.jsx`, a controlled form with four fields: `[TITLE]`, `[FORMAT]` (FLAC / MP3 / SYNTH), `[GENRE]` and `[BPM]`. Every field has `value` and `onChange`. The submit button says `EXECUTE // ADD`, and `SAVING...` while it waits.
- **Changed or rejected:** My extra validation is the tempo: BPM must be a whole number between 40 and 220. The title is required and has at most 100 characters. The messages are in the app's terminal style (`[ERR]: TITLE IS REQUIRED.`) and appear under the fields, not in an `alert`. The form went in the left column, above the turntable player, like the `INPUT_NEW_TRACK` panel from my mockup.

### 3. Server first, then state
- **Asked:** Save checking and deleting on the server, as in step 4.
- **Got:** `handleAdd` puts in the list the track returned by the server, with the id it assigned. `handleToggleRedata` sends only `{ redata }` with PATCH and puts the server's answer in the list. `handleDelete` sends DELETE.
- **Changed or rejected:** My app has more than one list, so a helper (`resursaPiesei`) decides which route to call: `/piese` or `/sugestii`. Tracks generated in FOR_YOU aren't on the server and stay local. I also saved likes (the `liked` field) and playlists, otherwise they would have been the only things lost on refresh. Deleting a track also updates the playlists that contained it, on the server. "+ QUEUE" from FOR_YOU now creates the track on the server and replaces its temporary id everywhere.

### 4. tw.json and data-testid
- **Asked:** Get ready for the automatic check.
- **Got:** `tw.json` in the root of the repository (`piese`, `titlu`, `redata`, with a sample for `format`, `gen` and `bpm`), and the attributes from table 7.3 on the card, the checkbox, the title, the delete button, the empty message, the form fields and the loading / error messages.
- **Changed or rejected:** The extra fields are named after the keys in `db.json`: `form-format`, `form-gen`, `form-bpm`. The title isn't changed when saved (no automatic uppercase), so the checker finds exactly the text it typed.

## What I learned / what did not work
A controlled field needs both `value` and `onChange`, otherwise you can't type in it. `e.preventDefault()` has to be the first line of the submit function, or the page reloads. The order inside `handleSubmit` matters: the form is cleared only after the `await`, so when I stopped `npm run api` and pressed ADD, the error appeared and my text was still there. With `--delay 3000` I could see the button disabled with `SAVING...`, so a double click can't add the same track twice. The new track appeared in `db.json` with an id I never sent; json-server gave it. Checking, deleting and liking stayed the same after a refresh. In the console, `document.querySelectorAll('[data-testid="item"]').length` returned the same number as the tracks in the queue.
