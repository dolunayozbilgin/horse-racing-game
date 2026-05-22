# 🏇 Horse Racing Game

A tournament-style horse racing simulation built as a single-page web application.

**Live Demo:** _coming soon_
**Tech Stack:** Vue 3, Pinia, CSS animations

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [Race Mechanics](#race-mechanics)
4. [Animation Approach](#animation-approach)
5. [Bonus Track](#bonus-track)
6. [About the Code](#about-the-code)
7. [About My Process](#about-my-process)
8. [About My AI Workflow](#about-my-ai-workflow)

---

## Getting Started

```bash
npm install
npm run dev
```

---

## Architecture

### Why Vue 3?

Vue 3 was chosen over Vue 2.7 for three reasons:

- **Composition API** produces cleaner, more readable component logic
- **Pinia** is Vue 3's native state management solution — far less boilerplate than Vuex
- Vue 2.7 is in maintenance mode; starting a new project on it would be a dead end

### Why Pinia over Vuex?

_coming soon — to be filled after store is built_

### Folder Structure

```
src/
├── assets/          # global styles
├── components/
│   ├── HorseList.vue      # 20 horses with name, color, condition
│   ├── RaceTrack.vue      # animated race track
│   ├── ResultsPanel.vue   # finishing order per race
│   └── RaceControls.vue   # generate / start / pause buttons
├── stores/
│   └── raceStore.js       # all game state lives here
├── utils/
│   └── raceMechanics.js   # condition → outcome formula
├── App.vue
└── main.js
```

---

## Race Mechanics

### Formula

The performance system lives in `src/utils/raceMechanics.js`.

Each horse receives a **performance score** calculated fresh for every race:

`performance = condition + staminaBonus + formBonus + noise`

| Component      | Range       | Description                                              |
| -------------- | ----------- | -------------------------------------------------------- |
| `condition`    | 1–100       | Base score, degrades over the tournament                 |
| `staminaBonus` | -20 to +25  | Depends on horse type × race distance                    |
| `formBonus`    | -15, 0, +15 | 15% good day / 70% neutral / 15% bad day                 |
| `noise`        | ±10         | Random external factors (track, weather, start position) |

This is a **weighted RNG with stamina depletion** — not purely linear, not purely random. Condition is the anchor but upsets are always possible.

### Stamina Types

Each horse has a `staminaType` assigned in `src/stores/raceStore.js`:

- **Sprint** → peaks at 1200m (+15), fades badly at 2200m (-20)
- **Middle** → consistent across all distances (±5 max)
- **Stayer** → slow starter at 1200m (-10), dominant at 2200m (+25)

### Condition Decay & Recovery

After each race, conditions update via `updateConditionsAfterRace()`:

| Situation           | Condition Change                |
| ------------------- | ------------------------------- |
| Raced normally      | -5 to -15 depending on distance |
| Did not race        | +3 (recovery)                   |
| Injured during race | -25 to -35                      |

Condition is clamped between 1–100 at all times.

### Injury Risk

Each horse has a **3% chance of injury** per race. An injured horse scores 0 performance (finishes last), loses 25–35 condition points, and can still be selected in future races but starts weakened.

### Pre-race Odds

Calculated in `calculateOdds()` — each horse's condition as a percentage of the total pool condition. Visual only, does not affect mechanics.

## Animation Approach

### Chosen Method

CSS transitions driven by a `setInterval` loop (50ms tick rate). Each tick calculates new positions for all horses and updates their `left` CSS property. The browser's CSS engine handles the smooth interpolation between position updates via `transition: left 0.05s linear` on each horse element.

### Trade-offs

**Why CSS transitions over canvas/WebGL:**
Canvas and WebGL would give more control over rendering but add significant complexity for what is essentially a horizontal position update. CSS transitions handle easing automatically and integrate naturally with Vue's reactivity system — no manual render loop or draw calls needed.

**Why setInterval over requestAnimationFrame:**
`setInterval` at 50ms (20fps) was sufficient for this use case and simpler to reason about. The trade-off is that `setInterval` runs regardless of tab visibility and doesn't sync with the display refresh rate. `requestAnimationFrame` would be the production-grade replacement — it pauses when the tab is hidden and syncs with the browser's 60fps rendering cycle. At 10 horses this difference is invisible; at 200 horses it would matter significantly.

---

## Bonus Track

**Chosen track:** Meaningful unit tests for store logic and race mechanics

**Why this track:**
The race mechanics formula is the heart of the game — condition decay, stamina bonuses, injury probability, form variance. If any of these are miscalculated, the entire simulation breaks silently: horses finish in wrong order, conditions never decay, injuries never trigger.

Extracting all race math into `src/utils/raceMechanics.js` was a deliberate architectural decision made specifically to enable this. Pure JavaScript functions with no Vue dependencies can be tested without mounting components, mocking the store, or setting up the full application. The tests run in milliseconds.

16 tests cover:
- `calculateRacePerformances` — correct result count, sorted by performance, injured horse gets 0, no negative performance, sprint bonus at 1200m
- `updateConditionsAfterRace` — raced horses lose condition, non-racing horses recover, injured horses lose more, condition never below 1 or above 100, longer distance causes more fatigue
- `calculateOdds` — correct entry count, percentages sum to ~100, higher condition = higher odds

Run with: `npm run test:unit`

The separation of concerns that makes these tests possible is the same reason a new developer can understand the codebase quickly — the math layer is isolated, readable, and verifiable independently of the UI.

---

## About the Code

### 1. Race Mechanics Formula

Formula lives in `src/utils/raceMechanics.js`, lines 29–62.
`updateConditionsAfterRace` (lines 64–79) handles condition decay after each race.

`performance = condition + staminaBonus + formBonus + noise`

The design priority was realism over simplicity. Having watched horse racing both in Hong Kong (during exchange) and Turkey, I noticed the most important truth about the sport: the favorite doesn't always win. The biggest upsets happen in the final stretch — a horse that's been trailing suddenly surges, or the frontrunner fades under pressure.

This shaped every formula decision:

- **condition** is the anchor — a horse with 95 condition is genuinely faster than one with 40, but not guaranteed to win
- **staminaBonus** encodes race type: sprint horses peak at 1200m and fade at 2200m, stayers do the opposite
- **formBonus** (±15, 15% chance each way) simulates the unpredictable "good day / bad day" every athlete has
- **noise** (±10) covers everything uncontrollable: track position, weather, start gate luck
- **surge mechanic** (in `RaceTrack.vue`, startRace function) — 25% chance per horse to suddenly accelerate mid-race. This is the "final stretch drama" moment. Only some horses surge, never all — mass surging would cancel out and mean nothing
- **injury** (0.8% per race, max 1 per tournament) happens mid-race visually, not at start — because that's how it works in real life

The result: condition matters, but any race can be upset. Just like the real thing.

### 2. Design Decision I'm Proud Of

`src/utils/raceMechanics.js` — lines 29–88.

The decision to extract all race math into a framework-agnostic JavaScript file was the most important architectural call in this project. It has no Vue imports, no store dependencies — just pure functions that take data in and return data out.

This paid off immediately when writing tests: all 16 unit tests target this file directly, no component mounting needed. If this logic had lived inside `RaceTrack.vue`, testing would have required mocking Vue's reactivity system and the Pinia store — a much heavier setup for what are essentially math functions.

The separation also made the surge mechanic and injury system easier to reason about in isolation before wiring them into the animation loop.

### Design Decision I'd Revisit

`src/components/RaceTrack.vue` — the `startRace` function starting around line 60.

This component grew too large. It currently handles: position tracking, surge logic, injury detection, finish time recording, condition updates, and result saving — all inside one `setInterval` callback.

If I had another pass, I'd extract the animation loop into a composable (`src/composables/useRaceAnimation.js`) and keep `RaceTrack.vue` as a pure display component. The store would own more of the race state, and the composable would own the tick logic. This would also make the surge and injury systems individually testable.

### Design Decision I'd Revisit

_File path + line numbers + explanation — to be filled_

### 3. What Would Break at 10x Scale

`src/components/RaceTrack.vue` — `startRace` function, approximately line 60.

The animation loop runs on `setInterval` every 50ms and iterates over all racing horses on every tick. At 10 horses this is invisible. At 200 horses, each tick would process 200 position updates, 200 surge checks, and 200 injury evaluations — all synchronously on the main thread. At that scale, frame drops would be noticeable and the UI would feel sluggish.

The deeper problem is architectural: the entire race state (positions, surge data, injury points, finish times) lives as local variables inside `startRace`. There's no way for an external system to read or write this state. In a multiplayer scenario with spectators, you'd need a shared race state that multiple clients can subscribe to — impossible with the current closure-based approach.

The fix would be to move race tick state into the Pinia store and use `requestAnimationFrame` instead of `setInterval`, which hands timing control back to the browser and skips frames when the tab is backgrounded.

### 4. First Thing to Tell a New Teammate

The most important thing to understand is the three-layer separation:

- `src/stores/raceStore.js` — all game state lives here
- `src/utils/raceMechanics.js` — all race math lives here
- Components — display only, no logic

This separation is intentional and strict. If you find yourself writing a formula inside a component, it probably belongs in `raceMechanics.js`. If you find yourself managing state inside a component, it probably belongs in the store.

Start by reading `raceMechanics.js` and the unit tests in `src/__tests__/raceMechanics.test.js` — those two files together explain how the game works mechanically.

## About My Process

### 1. Hardest Part

The hardest part wasn't any single formula or animation problem — it was the compounding nature of progress itself.

Every time I added a new feature, I'd notice two or three things that weren't quite right. A new bug would surface, or a visual detail would suddenly look off in context. I kept a running list and worked through them in order — but the list never really got shorter, it just changed.

I think this is actually how most engineers work: you're not just building toward a finish line, you're constantly recalibrating what "good" looks like as the product takes shape. The race mechanics felt balanced until I added the results panel and could see patterns across multiple races. The UI felt clean until I saw it running on a full tournament.

My approach was to note everything, prioritize ruthlessly, and accept that some things would stay on the list. A polished 60% with sharp reasoning beats a rushed 100% — which is exactly what this spec asked for.

### 2. Assumptions Where Spec Was Silent

The spec defines the race mechanics clearly but leaves several design decisions open. Here's what I decided and why:

**Condition decay across races**
The spec defines condition as a static score but says nothing about whether it changes. I made it dynamic: horses lose 5–15 condition after racing (scaled by distance) and gain +3 if they didn't race that round. This makes the tournament feel like a real multi-day event where horses tire and recover.

**Stamina types (Sprint / Middle / Stayer)**
The spec says condition influences outcome but doesn't say how. I added a staminaType to each horse that modifies performance based on race distance — sprint horses peak at 1200m, stayers dominate at 2200m. This creates meaningful variety without overcomplicating the formula.

**Injury system**
Not in the spec. I added a 0.8% per-race injury chance (max 1 per tournament) that triggers mid-race visually. The horse runs, then stops — because that's how it happens in real life. Having watched races in both Hong Kong and Turkey, I've seen horses pulled mid-race. It had to be mid-race, not at the start.

**Surge mechanic**
Not in the spec. 25% of horses get a random mid-race acceleration burst. This creates the "final stretch drama" moment — the trailing horse suddenly closing the gap. Again drawn from real race observation.

**Tournament winner formula**
Real horse racing doesn't have a points-based tournament winner — each race is independent. I needed a satisfying conclusion to the 6-race arc, so I invented a scoring system. But simple points-per-race creates an unfair advantage for horses that race more often.

The solution is a weighted formula:

`final_score = (total_points / max_possible_points) * 100 * participation_bonus`

`participation_bonus = 1 + (race_count / total_races) * 0.2`

This means a horse that raced 5 times and always finished 2nd scores ~105, while a horse that raced once and won scores ~103. Five consistent podium finishes beats one lucky win — which feels right. The formula lives in `src/components/ResultsPanel.vue` in the `tournamentWinner` computed property.

**Turkish horse names**
The spec says nothing about horse names. I used Turkish names — Karayel, Rüzgar, Fırtına, Yıldırım — because they carry meaning (Karayel = black wind, Fırtına = storm) and give the horses personality. Generic placeholder names would have made the game feel like a demo.

**Cinematic dark theme**
The spec says "surprise us." I chose dramatic and cinematic over the reference screenshot's clinical table layout — dark backgrounds, letter-spacing, monospace accents. The visual language should feel like a race night, not a spreadsheet.

### 3. What I Cut & What I'd Build With Another Week

_To be filled_

---

## About My AI Workflow

### 1. What I Delegated vs. Owned

The ideas behind this project are entirely my own — the formula design, the UX decisions, the visual direction, the race mechanics philosophy. I've watched horse racing in both Hong Kong (during exchange) and Turkey, and that real-world experience shaped every design call: why injury happens mid-race, why surge affects only some horses, why the dark cinematic theme, why Turkish names.

Claude was used as an implementation assistant — translating decisions into code quickly so I could spend more time thinking about the next problem rather than debugging syntax.

The quality of the person using AI matters more than the AI itself. Asking the right questions, directing the output, criticizing what doesn't work — those are human decisions. Claude wrote the syntax. I decided what to build and why.

This reflects a broader belief: in 2026, syntax is a commodity. AI can write correct Vue components, CSS transitions, and Pinia stores faster than any human. What AI cannot do is decide what to build, why it matters, and how it should feel. Those decisions — the architecture, the race realism, the UX flow — were mine. The code that implements them was written with AI assistance.

The measure of good AI usage isn't how much code it writes. It's whether the person directing it understands every line well enough to defend, modify, and extend it. I do.

### 2. When I Took a Different Path Than AI Suggested

Several times during this project I pushed back on Claude's suggestions:

**Condition decay (the most important one)**
Claude initially suggested keeping condition static — simpler to implement. I insisted it should decay after each race and recover when horses rest. This single decision transformed the tournament from 6 independent races into a connected narrative where horse fatigue actually matters.

**Injury timing**
Claude was calculating injuries before the race started. I changed this: the horse must run first, then collapse mid-track. A horse that never moves and is already marked injured makes no dramatic sense. This was a UX instinct, not a technical one.

**Speed normalization**
Claude suggested making speed differences much more dramatic (normalized speed formula with 3.5x range between fastest and slowest). I tested it and immediately reverted — it looked artificial, like a cartoon. The subtler original pacing felt more like a real race.

**Noise range**
Claude suggested ±12.5 for the random noise factor. I kept it at ±10 — "don't break the balance just to have a rounder number" was my reasoning. Small changes to a tuned formula have compounding effects.

**"Don't try to do all of them"**
Both the spec and Claude warned against adding too many features. I disagreed — not because I wanted to do everything, but because the features I chose (condition decay, stamina types, injury, surge, pre-race odds) were deeply interconnected. Each one made the others more meaningful. That's different from adding unrelated features for the sake of it.

**Tournament winner formula**
Claude proposed a simple average (total points / races). I pointed out this was still unfair — a horse that races once and wins beats a horse that races five times and always finishes second. We developed a weighted formula together that rewards both consistency and participation.

**Pre-race odds placement**
Claude suggested showing odds above the track. I moved them below the lanes — the track is the focal point before a race starts, odds are secondary information that shouldn't compete with it visually.

### 3. Where AI Misled Me & How I Caught It

**Finish order was wrong**
Claude was sorting the finish order by final position value — but since all horses reach 90% at nearly the same time, the sort was essentially random. I noticed the results panel wasn't matching what I saw on the track. The fix was recording the exact tick when each horse crossed the finish line and sorting by that instead.

**Minimum speed guarantee backfired**
Claude added a `Math.max(0.35)` floor to prevent slow horses from falling too far behind. In practice this equalized all horses — they arrived at the finish line almost simultaneously, which looked worse than the original spread. I caught it immediately on first test and reverted.

**Mass surge was meaningless**
The first surge implementation applied acceleration to all horses in the final stretch. Claude framed this as "dramatic finish energy." I tested it and realized it was the opposite of dramatic — if everyone speeds up equally, nobody gains ground and nothing changes. The fix was making surge selective: only 25% of horses surge, at random points, so it creates actual positional changes.

**raceMechanics.js was empty**
At one point Claude gave me the file content but I hadn't saved it properly. The browser threw an import error. Claude didn't catch this — I noticed it when the app crashed and traced it back to the empty file.

**README formatting kept breaking**
Claude repeatedly generated README sections with code blocks nested inside other code blocks, which GitHub renders incorrectly. I had to point this out multiple times before the formatting stabilized. Claude's awareness of markdown rendering edge cases was unreliable.
