# Stage 3: AI log

## Tools
- Claude

## Conversations
- Turning my mockup into a Vite + React project: moving the old files to `mockup/`, cleaning out the Vite demo, and rebuilding the header and track queue as a React component.

## Key requests

### 1. Setting up the React project
- **Asked:** Go through the Stage 3 guide with me and write the files for my theme: `App.jsx`, `App.css`, `main.jsx` and the `index.html` title.
- **Got:** The four files plus the order of commands (`npm create vite`, `npm install`, `npm run dev`, then deleting the demo files). The AI couldn't run npm on its side, so it only wrote the files and I did the install, the dev server and the build on my machine.
- **Changed or rejected:** Kept the structure from the guide, just with my data: `piese` instead of `taskuri`, `inAsteptare` instead of `active`, and the counter written in my terminal style (`[SYS_MSG]: 3 TRACKS FOUND. 2 PENDING.`) instead of a plain sentence.

### 2. Fixing the leftovers from Stage 1
- **Asked:** Use the issues found in the Stage 2 review now that I'm rebuilding the page anyway.
- **Got:** The name is now CyberWave everywhere (title, header, footer), the empty lines above the ASCII spider are gone, and a new `mockup/style.css` with the purple theme, since the old one was still the green version and the guide copies styles from that file.
- **Changed or rejected:** Kept the spider, the scanlines and the animated visualizer in the React version even though the guide's example only has the header and one panel. They're part of my Stage 1 design, so they count as reused styles.

### 3. Understanding the JSX differences
- **Asked:** Explain the code, especially what changed from HTML to JSX.
- **Got:** Why the data sits above `App` (it runs once, while `App` reruns on every update), why `class` becomes `className`, and three things specific to my page: `>>` has to be written as `&gt;&gt;`, `// CYBERWAVE_OS` goes inside `{"..."}` so it isn't read as a comment, and the spider is a `String.raw` template string because JSX would squash the spaces and break the drawing.
- **Changed or rejected:** Nothing changed; I tested the counter myself by switching one track to `redata: true` and saving.

## What I learned / what did not work
The biggest change is that the page doesn't open by double-clicking anymore. It needs `npm run dev` and `localhost:5173`, because the files load each other through `import`. Deleting `index.css` gave a white page with a 404 in the console until I changed the import in `main.jsx` to `App.css`, which showed me how much one wrong import can break. I liked that the header counter is now calculated from the array, not typed by hand: change the data, save, and the number updates without a reload. Before committing I checked with `git status --short` that `node_modules/` and `dist/` don't show up.
