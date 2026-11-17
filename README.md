# Morning Work

A calm morning routine for autistic classrooms, part of **The Learning Toolshed**.
Live at <https://swankymcgee.github.io/morning-work/>.

Open `index.html` in Chrome by double-clicking it — no server, no install, no
admin rights. Everything on the page (including the `faces/` drawings) loads
from disk; nothing is fetched from the network. The only network request is
the link back to the Toolshed site, and only when someone clicks it.

## What's on the page

On **first launch** the page asks *which parts to do this morning*. The pick is
remembered and can be changed at any time with the **⚙️ Settings** button in
the header. Every part has a **Skip** (hold one second), so any step can be
stepped past without fuss.

| Part | What the student does |
| --- | --- |
| 📅 **Today's date** | Fill in "Today is ___ the ___ of ___" — day of the week, date number and month, one blank at a time with three big choices. A wrong tap gets gentle neutral text ("Not quite — look at the calendar and try again"); after two tries the right one blinks kindly until tapped. |
| 🗓️ **Yesterday & tomorrow** | "Yesterday was ___" and "Tomorrow will be ___" — the same three-choice fill-in, using the real calendar. |
| 🌤️ **Weather** | Six big tiles (Sunny, Cloudy, Rainy, Snowy, Windy, Stormy). The student looks outside and picks — **every choice is right**. |
| 💛 **Feelings** | The four-colour **Zones of Regulation** chart — Blue, Green, Yellow and Red panels with the official feelings placed in them (Blue: Sad, Tired, Bored, Sick, Hurt · Green: Happy, Calm, Focused, Relaxed, Proud · Yellow: Worried, Frustrated, Silly, Excited, Nervous · Red: Angry, Terrified, Panicked, Overjoyed, Out of control). Each feeling shows a hand-drawn face illustration. Tap the feeling that fits — **every zone is okay**. |

When the last part is done, a gentle recap ("You're ready for school!")
shows the day's sheet: the date, yesterday/tomorrow, the weather and the
feeling. **Start over** (hold one second) clears the sheet for a redo.

## Rules this tool keeps

- **No timers, no failure states, no sound that marks a wrong answer.**
  Correct answers get a soft two-note chime; wrong answers are silent.
- **One action at a time**, player-paced — nothing advances on its own.
- **A Skip on every part.** Skipping a fill-in part writes the real values in,
  so the finished sheet still reads true; skipping a check-in simply moves on.
- **The chosen parts persist** in
  `localStorage["workCycleTimer.morning.v1"]`; **the answers reset when the
  calendar day changes**, so every morning starts with a fresh sheet.
- The same **11 palettes** as the rest of the Toolshed (header 🎨), the same
  background-pattern switch, and gentle Web Audio sound that never starts on
  its own (header 🔊).

## Keeping in step with the rest of the Toolshed

- `THEMES` in `morning.js` and the `html[data-theme]` blocks in `morning.css`
  must stay in sync with `app.js` (timer), `math.js` (math) and `site.js` (site).
- The footer phrase "Staff resources for The Learning Toolshed" is the same
  wording as every other Toolshed page.
- The site's `site-manifest.json` lists this tool (id `morning-work`), which
  feeds the Tools hub, the Ideas Engine's tool dropdown and the Toolshed Admin
  app — add pages there if this tool ever grows more pages.

## Feelings face illustrations

The 20 face drawings in `faces/` are cropped heads from **Open Peeps** by
Pablo Stanley — hand-drawn illustrations, not emoji. Open Peeps is released
under **CC0 1.0** (public domain): free to use for any purpose with no
attribution required. Source: <https://www.openpeeps.com/>.

## Deploy

This is its own repo with GitHub Pages from `main` (root), like
`work-cycle-timer` and `math-playground`: push to `main`, Pages rebuilds, and
the tool appears at `https://swankymcgee.github.io/morning-work/`.
