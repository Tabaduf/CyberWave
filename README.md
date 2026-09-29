# CyberWave - Cyberdeck Music Library
An ad-free, cyberdeck-inspired music library and audio queue manager for offline-first listening.
Organizes audio tracks by format and genre with a terminal aesthetic.

## Data model

| Field | Type | Notes |
| :--- | :--- | :--- |
| title | text | required, max 100 chars (Artist - Track title) |
| played | boolean | toggled from the list, default false |
| format | fixed values | FLAC, MP3, Synth |
| genre | relation | Synthwave, Dark Ambient, Cyberpunk (from week 10) |
| user | relation | owner of the deck terminal (from week 11) |

Sample data used across all stages:
1. Master Boot Record - CHKDSK, active, FLAC
2. Perturbator - Future Club, done, MP3
3. Keygen Church - Tenebre Rosso Sangue, active, Synth

## AI usage

| Tool | Used for |
| :--- | :--- |
| Gemini | Brainstorming app concept, defining data model schema, Stage 1 HTML/CSS structure |

Details per stage: see the ai-log/ folder.

## How to run
Open index.html in a browser. No build step, no server.

## Status
- [x] Stage 1: static mockup
- [ ] Stage 2: data logic in JavaScript

## Checklist

| ID | Requirement | Where (permalink) | How to check |
| :--- | :--- | :--- | :--- |
| S1-R1 | README: description, fields, sample data, how to run | README.md | read |
| S1-R2 | AI usage section | README.md | read |
| S1-R3 | AI log for stage 1 | ai-log/etapa-01.md | read |
| S1-R4 | header, form (text + select), 3 cards with own data | index.html | open the page |
| S1-R5 | finished card looks different | style.css (.done) | look at the card |
| S1-R6 | 2 columns on desktop, 1 under 700px | style.css (@media) | resize < 700px |
| S1-R7 | visible focus, readable dark theme | style.css | Tab; dark mode |
| S1-R8 | commit "Stage 1" pushed | commit history | commit history |