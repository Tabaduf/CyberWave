# Stage 4: AI log

## Tools
- Claude

## Conversations
- Replacing the raw JSON list from Stage 3 with real components (`PiesaCard` and `PiesaList`), running the guide's tests, and then going further with the interface: a vinyl player, genre themes, liked songs and playlists.

## Key requests

### 1. The two components
- **Asked:** Go through the Stage 4 guide and write the components for my theme, with comments that explain what each part does.
- **Got:** `PiesaCard.jsx` (one track through props) and `PiesaList.jsx` (the whole array, `map` with `key={piesa.id}` and an early return for the empty list), plus `App.jsx` using `<PiesaList piese={piese} />` instead of the `<pre>` block.
- **Changed or rejected:** Kept my class names from the mockup (`item-card`, `item-list`, `card-details`) instead of the guide's `task-card`, so my existing CSS still works. The labels are `ETICHETE_FORMAT` (`flac` in the data, `FLAC` on screen) and the status text is PENDING / PLAYED. The empty message is in my terminal style: `[SYS_MSG]: AUDIO_QUEUE EMPTY. NO TRACKS LOADED.`

### 2. Running the site and the tests
- **Asked:** How to start the site step by step and do the three tests from the guide.
- **Got:** The order (`cd frontend`, `npm run dev`, open `localhost:5173`, F12 → Console) and how to run each test: remove `key` to see the warning, comment out the array to see the empty message, switch `redata` to see the card change.
- **Changed or rejected:** When I opened the console I thought it was empty, but it had a red `favicon.ico 404` error, because I had deleted the Vite icons in Stage 3. Fixed it with one line in `index.html`: `<link rel="icon" href="data:," />`. The screenshot also showed the ASCII spider overlapping the queue panel, now that the empty lines above it were gone.

### 3. A more interactive interface (beyond the guide)
- **Asked:** Make the page feel like a real player: tabs for Queue / Liked / Random / Playlists, genre buttons, a spinning vinyl with the track cover in the middle ("no img found :(" when there isn't one), one play/pause button, next / previous, repeat with a fast rewind animation, and the spider centered on the left.
- **Got:** New components (`Player`, `Vinil`, `Genuri`, `PlaylistGrid`). The disc speed comes from the track's BPM, the tonearm moves across the disc with the progress, and the whole page changes its color palette depending on the genre of the track that's playing.
- **Changed or rejected:** The first version did everything with CSS only (hidden radio buttons + `:has()`), because I asked for looks only. When I wanted the tonearm to follow the song and next / previous buttons, that wasn't enough anymore, so it switched to `useState` and `useEffect`. I kept this in a separate commit after the Stage 4 one, because the guide asks for the result to look like the Stage 1 mockup.

### 4. Liked songs and playlists in real time
- **Asked:** Let me like the tracks I listen to and add them to playlists, with the lists updating immediately, and make the covers spin.
- **Got:** A ♥ on every card and in the player, a `+ PLAYLIST` menu where I can add or remove the current track or create a new playlist, small spinning discs on the cards, and short `[SYS]: ...` notifications.
- **Changed or rejected:** Liked songs and playlists now live in state, so they reset on refresh. Saving them for real comes with the backend in a later stage.

## What I learned / what did not work
The main idea of this stage is that a card is now written once and used three times: if I add a fourth track to the array, a fourth card appears without touching anything else. I saw the `key` warning myself in the console, with the name of the component where it happens, and it went away as soon as I put `key={piesa.id}` back on `PiesaCard`. I also learned that a console isn't automatically clean just because the page works: the favicon 404 was there the whole time. In the extra part, the like button showed me why the immutable updates from Stage 2 matter: `setLikedIds([...likedIds, piesa.id])` gives React a new array, so the tab counter, the header and the Liked list all change in the same moment. The same rules (`filter` to remove, spread to add, max id + 1 for new playlists) came straight from `piese.js`.
