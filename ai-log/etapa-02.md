# Stage 2: AI log

## Tools
- Claude

## Conversations
- Moving the track data out of the HTML and into JS for Stage 2, plus a quick check of my Stage 1 mockup before starting.

## Key requests

### 1. Quick review of the Stage 1 mockup
- **Asked:** Look over my HTML/CSS and make sure the context is clear before I start the JS part.
- **Got:** A few things I had missed: the title still says "DeckWave" instead of CyberWave, my `style.css` was still the old green version, and the ASCII spider had a bunch of empty lines on top.
- **Changed or rejected:** Didn't touch the page in this stage (the guide says the JS shouldn't change it), but I put these on my list for later.

### 2. The data array and the functions
- **Asked:** Generate the Stage 2 JS file for my theme, following the guide step by step, with comments so I can follow what happens.
- **Got:** `piese.js` with the 3 tracks from the mockup, the `FORMATE` list and all the required functions, plus the console tests.
- **Changed or rejected:** Kept the names close to the guide so it's easy to compare, but switched them to my theme. `gata` became `redata` because "played / pending" makes more sense for a music queue than "done". For the search test I used "keygen" instead of "tema", to check that lowercase still finds `KEYGEN_CHURCH`.

### 3. Making sure I actually understand it
- **Asked:** What the script really does, piece by piece.
- **Got:** A walkthrough of each function and why none of them changes the original array.
- **Changed or rejected:** Nothing to change here, but it helped a lot. I then opened the console (F12) and checked each line against what I expected.

## What I learned / what did not work
The part that clicked for me was immutability: `[...lista, nou]` instead of `push`, and `{ ...p, redata: !p.redata }` instead of changing the object directly. The line "Originalul a rămas cu: 3 piese" in the console is what convinced me it really works. I also wouldn't have thought that `lista.length + 1` breaks after a delete. With ids 1, 2, 3, deleting 2 and adding a new track gives id 3 again, a duplicate. Using `reduce` to take the max id + 1 fixes that.