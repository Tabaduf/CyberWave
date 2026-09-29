# Stage 1: AI log

## Tools
- Gemini

## Conversations
- Brainstorming app ideas matching Stage 1 requirements (audio terminal / cyberdeck concept) and CSS layout architecture.

## Key requests

### 1. Project Concept and Data Model
- **Asked:** How to design a unique audio library app that complies with the mandatory 5 fields (title, boolean status, fixed tag, category, user).
- **Got:** A proposal for "DeckWave", an ad-free cyberdeck music queue with FLAC/MP3/Synth badges.
- **Changed or rejected:** Accepted and adapted field names for music tracks.

### 2. Semantic HTML structure and CSS variables
- **Asked:** Generate HTML/CSS layout strictly following the Stage 1 guidelines (header, 2-column main grid, flexbox cards, media query, and dark mode).
- **Got:** Full code with CSS variables and responsive rules.
- **Changed or rejected:** Customized typography with monospace styling to fit the cyberdeck theme while retaining clean accessibility standards.

## What I learned / what did not work
I learned how to structure a clean, semantic web layout using CSS Grid (`1fr 2fr`) and Flexbox without relying on external frameworks. Emulating dark mode in DevTools via the Rendering tab made testing variable color overrides straightforward.