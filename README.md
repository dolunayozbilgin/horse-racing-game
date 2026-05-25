# 🏇 Horse Racing Game

A tournament-style horse racing simulation built as a single-page web application.

**Live Demo:** https://horse-racing-game-five.vercel.app

**Tech Stack:** Vue 3, Pinia, CSS animations

---

## Getting Started

`npm install` then `npm run dev`

---

## Architecture

### Why Vue 3?

- Composition API produces cleaner component logic
- Pinia is Vue 3's native state management — much simpler and cleaner to write than Vuex
- Vue 2.7 is in maintenance mode — it still receives security patches but no new features. Starting a new project on it means building on a foundation that won't grow with you

### Folder Structure

- `src/components/HorseList.vue` — 20 horses with condition bars
- `src/components/RaceControls.vue` — generate / start / skip buttons
- `src/components/RaceTrack.vue` — animated lanes, photo finish, odds button
- `src/components/ResultsPanel.vue` — race results and tournament winner
- `src/components/OddsModal.vue` — pre-race betting odds modal
- `src/components/TournamentWinner.vue` — confetti winner screen
- `src/stores/raceStore.js` — all game state
- `src/utils/raceMechanics.js` — all race math
- `src/App.vue` — layout only

---

## Race Mechanics

Formula lives in `src/utils/raceMechanics.js`, line 50.

`performance = condition + staminaBonus + formBonus + noise`

| Component      | Range       | Description                                   |
| -------------- | ----------- | --------------------------------------------- |
| `condition`    | 60–100      | Randomized per tournament, decays with racing |
| `staminaBonus` | -20 to +25  | Horse type × race distance                    |
| `formBonus`    | -15, 0, +15 | 15% bad day / 70% neutral / 15% good day      |
| `noise`        | ±10         | Track, weather, start position                |

### Stamina Types

- **Sprint** → peaks at 1200m (+15), fades at 2200m (-20)
- **Middle** → consistent across all distances
- **Stayer** → slow at 1200m (-10), dominant at 2200m (+25)

### Condition Decay

| Situation        | Change                |
| ---------------- | --------------------- |
| Raced normally   | -5 to -15 by distance |
| Did not race     | +3 recovery           |
| Injured mid-race | -25 to -35            |

### Surge Mechanic

During a race, some horses suddenly accelerate for a short burst — this is the surge. It creates the final stretch drama where a trailing horse closes the gap at the last moment.

Not every horse surges. The chance depends on condition: `condition / 100 × 40%`. A horse at 90 condition has a 36% chance, a horse at 60 has a 24% chance. Fitter horses are more likely to have that extra gear — but it's never guaranteed.

When a surge happens, it triggers somewhere between 40–75% of the track, lasts 8–15 ticks, and multiplies speed by 1.8–2.4x. After the burst the horse returns to normal pace.

Making surge selective was a deliberate decision. If every horse surged at the same time, nobody would gain ground — it would cancel out and mean nothing.

### Injury

0.8% chance per race, max 1 per tournament. The horse runs first, then stops mid-track — not at the start. Loses 25–35 condition and can still race in future rounds, but starts weakened.

### Pre-race Odds

Four betting types in `src/components/OddsModal.vue`:

- **WIN** → pick the winner
- **PLACE** → pick a top-3 finisher (WIN odds / 3)
- **EXACTA** → pick 1st and 2nd in order (top 5 combinations shown)
- **TRIFECTA** → pick 1st, 2nd, 3rd in order (top 5 combinations shown)

Each horse gets a score based on three factors:

`score = condition × 0.6 + stamina bonus × 0.8 - win penalty + form bonus`

- Condition is the base — a fitter horse is more likely to win
- Stamina bonus adjusts for distance — a sprint horse is favored at 1200m, a stayer at 2200m
- Win penalty: each previous win reduces the score by 5 points — horses that have been winning get shorter odds, just like in real betting
- Form bonus: top 3 last race → odds drop by 8 (in form). Bottom 3 last race → odds rise by 8 (out of form)

This score is converted to a percentage, then into odds: `(100 / percentage) × 0.85`

The 0.85 is the house margin — like a real bookmaker taking a cut. A horse with 10% probability would theoretically pay 10x, but after the margin it pays 8.5x. This is how every betting company in the world makes money.

Combination bets multiply the individual win odds together with position multipliers and a small random noise (±10%) so no two combinations show identical odds.

### Tournament Winner

Formula lives in `src/App.vue`, computed `tournamentWinner`.

Points per race: 1st gets 10 points, 2nd gets 9, down to 10th gets 1.

But simple total points aren't fair — a horse that races 6 times has far more opportunities than one that races twice. So the final score is normalized:

`final_score = (total_points / max_possible_points) × 100 × participation_bonus`

`participation_bonus = 1 + (race_count / total_races) × 0.2`

**Example:** A horse that raced 5 times and always finished 2nd scores ~105. A horse that raced once and won scores ~103. The consistent performer wins — which feels right.

The participation bonus gives a small reward for racing more, but not enough to override consistency. A horse that raced 6 times and finished last every time will never beat one that raced twice and won both.

**Tiebreaker:** If two horses have the same final score, the one with more wins takes it. If still tied, the one with higher current condition wins.

---

## Animation Approach

CSS transitions driven by a `setInterval` loop (50ms). Each tick updates horse positions; `transition: left 0.05s linear` handles smooth interpolation.

Two-phase speed system: in the first 60% of the track horses spread out so you can see who's leading. In the final 40%, the gap closes and anyone can still win — replicating what actually happens in real races.

Photo finish triggers when the top finishers cross the line within 5 ticks of each other (250ms). At that point a full-screen overlay appears showing the close finishers — the same dramatic moment you see in real race broadcasts.

`requestAnimationFrame` would be the production replacement — pauses when tab is hidden, syncs with 60fps. At 10 horses `setInterval` is invisible; at 200 it would matter.

---

## Bonus Track

**Chosen: Meaningful unit tests**

16 tests in `src/__tests__/raceMechanics.test.js` cover `calculateRacePerformances`, `updateConditionsAfterRace`, and `calculateOdds`.

The reason I chose this track: all the race math lives in `src/utils/raceMechanics.js`, which has zero Vue dependencies — it's plain JavaScript. This means I can test it directly without mounting any components or setting up a fake store. The tests cover the actual logic that drives the simulation: does condition affect performance? Does an injured horse score zero? Does longer distance cause more fatigue? Does a sprint horse outperform a stayer at 1200m?

Run: `npm run test:unit`

---

## About the Code

### 1. Race Mechanics Formula

`src/utils/raceMechanics.js`, line 50. The design priority was realism. Having watched racing in Hong Kong and Turkey, the key truth is: the favorite doesn't always win. Upsets happen in the final stretch. Every formula decision — surge, noise, form variance — exists to make that possible while keeping condition meaningful.

### 2. Design Decision I'm Proud Of

`src/utils/raceMechanics.js`, lines 50–130. Extracting all race math into a plain JavaScript file with no Vue dependencies. Pure functions in, pure functions out. This is why 16 unit tests could be written without mounting any components or touching the store.

**Decision I'd Revisit:** `src/components/RaceTrack.vue`, `startRace` function ~line 117. This function grew too large — it currently handles the animation loop, surge logic, injury detection, finish time recording, condition updates, and saving the result all in one place. It works, but it would be hard to extend or test individually. I'd split it into a composable called `useRaceAnimation.js` that handles only the visual side, and move the game logic back into the store.

### 3. What Would Break at 10x Scale

`src/components/RaceTrack.vue`, `startRace` function ~line 117. The `setInterval` loop iterates all horses synchronously every 50ms. At 200 horses, frame drops would be visible. Worse: all race state lives as local variables inside the function — no external system can read or write it. Multiplayer is impossible with this architecture. Fix: move tick state to Pinia, switch to `requestAnimationFrame`.

### 4. First Thing to Tell a New Teammate

The most important thing to understand is where things live: state goes in `raceStore.js`, all the math goes in `raceMechanics.js`, and the components just display what they're given. Start by reading `raceMechanics.js` and the unit tests — those two files together explain how the simulation works.

---

## About My Process

### 1. Hardest Part

The hardest part wasn't writing the code — it was managing the moving parts. Every time I finished a feature, new problems appeared. I wrote everything down, prioritized, and moved forward one step at a time. What helped most was focusing on one thing at a time instead of trying to solve everything at once.

### 2. Assumptions Where Spec Was Silent

**Condition decay** — spec treats condition as static. I made it dynamic: horses tire across the tournament, creating a connected narrative instead of 6 independent races.

**Stamina types** — spec says condition influences outcome but not how. Sprint/Middle/Stayer gives each horse a distance preference.

**Injury mid-race** — the horse must run first, then collapse. A horse marked injured before moving makes no dramatic sense.

**Surge mechanic** — drawn from real race observation: trailing horses sometimes close dramatically in the final stretch.

**Tournament winner formula** — real racing has no points table. I invented one with a participation bonus so consistency is rewarded over luck.

**Random conditions per tournament** — spec gives each horse a static condition. I randomize 60–100 each tournament so no horse is always the favorite.

**Turkish horse names** — Karayel (black wind), Fırtına (storm), Yıldırım (lightning). Gives the horses personality.

**Cinematic dark theme** — spec says "surprise us." The reference screenshot looks like a spreadsheet. This looks like a race night.

### 3. What I Cut & What I'd Build With Another Week

**Cut:**

- Sound effects — browser autoplay policy and finding licensed audio would take time better spent elsewhere
- Mobile responsive layout — the three-panel grid doesn't translate to small screens without a full redesign
- Persist state across page refresh

**With another week:**

- Virtual betting system — wallet, place actual bets, see winnings accumulate across the tournament
- Replay mode — rewatch any race from the tournament
- Post-tournament stats — win rates, average finish position, condition history per horse

---

## About My AI Workflow

### 1. What I Delegated vs. Owned

The ideas behind this project are entirely mine — the formula design, the UX decisions, the visual direction, the race mechanics philosophy. I've watched horse racing in both Hong Kong (during exchange) and Turkey, and that real-world experience shaped every design call.

Claude was used as an implementation assistant: translating my decisions into code so I could spend more time thinking about the next problem rather than debugging syntax. The quality of the person using AI matters more than the AI itself. Claude wrote the code. I decided what to build and why.

In 2026, syntax is a commodity. What AI cannot do is decide what to build, why it matters, and how it should feel. The measure of good AI usage is whether the person directing it understands every line well enough to defend and extend it. I do.

### 2. When I Took a Different Path

**Condition decay** — Claude suggested keeping it static. I insisted on dynamic decay. This single decision made the tournament feel connected instead of fragmented.

**Injury timing** — Claude calculated injuries before the race. I moved it mid-race. UX instinct, not technical reasoning.

**Speed normalization** — Claude made differences too dramatic (3.5x range). It looked artificial. Reverted immediately.

**Noise range** — Claude suggested ±12.5. I kept ±10. Small changes to a tuned formula compound.

**Surge for all horses** — Claude applied it to everyone in the final stretch. Mass surging cancels out. Made it selective.

**Tournament formula** — Claude proposed simple average. I pointed out a horse racing once and winning would beat one racing five times finishing second. We built the weighted formula together.

**Pre-race odds placement** — Claude suggested showing odds as a panel below the race lanes. I moved it to a modal triggered by a button — before a race starts, the track and horse positions are the focal point. Odds are secondary information that shouldn't compete visually with the starting grid.

### 3. Where AI Misled Me

**Finish order sorting** — Claude sorted by final position value. Since all horses reach 90% nearly simultaneously, the sort was random. Fixed by recording exact finish ticks.

**Minimum speed floor** — `Math.max(0.35)` equalized all horses. They arrived simultaneously. Reverted on first test.
