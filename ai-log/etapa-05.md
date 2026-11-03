# Stage 5: AI log

## Tools
- Claude

## Conversations
- Moving the track list into React state, adding a checkbox and a delete button to every card, and a light / dark mode button in the header, on top of the interactive player I already had from the extra Stage 4 work.

## Key requests

### 1. The list in state, with toggle and delete
- **Asked:** Follow the Stage 5 guide on my existing project: keep the list in `useState`, check and delete tracks from the page, and keep using the immutable functions from Stage 2.
- **Got:** `PIESE_INITIALE` as the starting value and `const [piese, setPiese] = useState(PIESE_INITIALE)`, plus `handleToggleRedata` (`map` with `{ ...p, redata: !p.redata }`) and `handleDelete` (`filter`), both in the `setPiese((prev) => ...)` form. The header counter stays a derived value (`piese.filter((p) => !p.redata).length`), not a separate state.
- **Changed or rejected:** My names from table 5.1: state `piese`, toggled field `redata`, function `handleToggleRedata`, header number = pending tracks. The Random suggestions are a second state (`sugestii`), and the same toggle / delete apply to both lists, since a track can only be in one of them.

### 2. Keeping the rest of the app consistent after a delete
- **Asked:** Make sure deleting doesn't break the player, Liked Songs or the playlists.
- **Got:** `handleDelete` also removes the id from `likedIds`, from every playlist and from the play order, and stops the player if the deleted track was on the disc ("NO TRACK LOADED").
- **Changed or rejected:** The play order now stores ids (`coadaIds`) instead of whole track objects, so next / previous skip tracks that were deleted. When a track finishes, it's marked PLAYED automatically.

### 3. Checkbox and delete button in the card
- **Asked:** The controlled checkbox and the accessible delete button from step 4, in my terminal style.
- **Got:** `checked={piesa.redata}` with `onChange={() => onToggle(piesa.id)}` inside a `<label>` that also wraps the title, and a `✕ DELETE` button with `aria-label={`Șterge ${piesa.titlu}`}` and `onClick={() => onDelete(piesa.id)}`. The checkbox is a custom neon square instead of the default browser one.
- **Changed or rejected:** Before, a click anywhere on the card started the track. Now that the title toggles PLAYED, playing moved to the small disc on the left, which became a button with a ▶ on hover. Otherwise one click would have done two things.

### 4. Light / dark mode
- **Asked:** The theme button from step 8, without breaking the genre colors.
- **Got:** `temaInitiala()` reading the system theme, `useState(temaInitiala)`, and `handleTema` writing `data-theme` on `<html>`. The button text shows the theme you switch to (`◐ LIGHT_MODE` / `◑ DARK_MODE`).
- **Changed or rejected:** My design starts dark, so the CSS is the guide's logic mirrored: dark is the base, and light applies through `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }` and `:root[data-theme="light"]`. The neon genre colors would be unreadable on a light background, so instead of a separate light palette for each genre there is one variable, `--darken` (0% dark, 45% light), and every color is computed with `color-mix`. One rule covers all 9 genres in both themes.

## What I learned / what did not work
`useState` only notices a change if it gets a new array, which is exactly why the Stage 2 functions return copies. Writing `onClick={() => onDelete(piesa.id)}` and not `onClick={onDelete(piesa.id)}` is the difference between deleting on click and deleting everything as soon as the page renders. The counter in the header never needed extra code: it's calculated from `piese`, so checking or deleting a track updates it on its own. I tested the theme in both directions with the system set to dark and to light (Rendering panel in DevTools), and the `:not([data-theme=...])` part is what lets the button override the system. The console only shows the React DevTools info message. Everything resets on refresh, which is expected until the API in Stage 6.
