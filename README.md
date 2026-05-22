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
- Pinia is Vue 3's native state management — far less boilerplate than Vuex
- Vue 2.7 is in maintenance mode; starting a new project on it would be a dead end

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
| `formBonus`    | -15, 0, +15 | 15% good / 70% neutral / 15% bad day          |
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

Each horse has a `condition/100 * 40%` chance of surging mid-race. Surge triggers between 40–75% of the track, lasts 8–15 ticks, and multiplies speed by 1.8–2.4x. Only some horses surge per race — mass surging would cancel out and mean nothing.

### Injury

0.8% chance per race, max 1 per tournament. Happens mid-race visually — the horse runs, then stops. Loses 25–35 condition.

### Pre-race Odds

Four betting types in `src/components/OddsModal.vue`:

- **WIN** → pick the winner
- **PLACE** → pick a top-3 finisher (WIN odds / 3)
- **EXACTA** → pick 1st and 2nd in order (top 5 combinations shown)
- **TRIFECTA** → pick 1st, 2nd, 3rd in order (top 5 combinations shown)

Odds formula: `(100 / percentage) * 0.85` — house margin applied. Each combination gets slight noise (±10%) so no two are identical.

Odds factors: condition × 0.6 + stamina bonus × 0.8 - win penalty (5pts per previous win) + form bonus (±8 based on last race finish).

### Tournament Winner

Formula lives in `src/App.vue`, computed `tournamentWinner`.

`final_score = (total_points / max_possible_points) * 100 * participation_bonus`

`participation_bonus = 1 + (race_count / total_races) * 0.2`

Tiebreaker: most wins → highest condition. Five consistent podium finishes beats one lucky win.

---

## Animation Approach

CSS transitions driven by a `setInterval` loop (50ms). Each tick updates horse positions; `transition: left 0.05s linear` handles smooth interpolation.

Two-phase speed system: first 60% of track horses spread out, final 40% the gap closes — replicating the photo finish drama of real racing.

`requestAnimationFrame` would be the production replacement — pauses when tab is hidden, syncs with 60fps. At 10 horses `setInterval` is invisible; at 200 it would matter.

---

## Bonus Track

**Chosen: Meaningful unit tests**

16 tests in `src/__tests__/raceMechanics.test.js` cover `calculateRacePerformances`, `updateConditionsAfterRace`, and `calculateOdds`. Extracting all race math into a Vue-free JS file made this possible — no component mounting, no store mocking.

Run: `npm run test:unit`

---

## About the Code

### 1. Race Mechanics Formula

`src/utils/raceMechanics.js`, line 50. The design priority was realism. Having watched racing in Hong Kong and Turkey, the key truth is: the favorite doesn't always win. Upsets happen in the final stretch. Every formula decision — surge, noise, form variance — exists to make that possible while keeping condition meaningful.

### 2. Design Decision I'm Proud Of

`src/utils/raceMechanics.js`, lines 50–130. Extracting all race math into a framework-agnostic JS file. No Vue imports, no store dependencies — pure functions in, pure functions out. This is why 16 unit tests could be written with zero component setup.

**Decision I'd Revisit:** `src/components/RaceTrack.vue`, `startRace` function ~line 117. It handles position tracking, surge, injury, finish times, condition updates, and result saving in one `setInterval` callback. Should be extracted into a composable (`useRaceAnimation.js`).

### 3. What Would Break at 10x Scale

`src/components/RaceTrack.vue`, `startRace` function ~line 117. The `setInterval` loop iterates all horses synchronously every 50ms. At 200 horses, frame drops would be visible. Worse: all race state lives as local closure variables — no external system can read or write it. Multiplayer is impossible with this architecture. Fix: move tick state to Pinia, switch to `requestAnimationFrame`.

### 4. First Thing to Tell a New Teammate

State → `raceStore.js`. Math → `raceMechanics.js`. Everything else is display. Read `raceMechanics.js` and the unit tests first — those two files explain how the game works.

---

## About My Process

### 1. Hardest Part

Not any single formula — the compounding nature of progress. Every feature revealed two new problems. I kept a running list, prioritized ruthlessly, and accepted that some things would stay on it. A polished 60% with sharp reasoning beats a rushed 100% — which is exactly what this spec asked for.

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

The ideas are entirely mine — formula design, UX decisions, visual direction, race mechanics philosophy. Real-world experience watching racing in Hong Kong and Turkey shaped every call.

Claude was used as an implementation assistant: translating decisions into code so I could focus on the next problem rather than syntax. The quality of the person using AI matters more than the AI itself. Claude wrote the code. I decided what to build and why.

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

**README formatting** — Code blocks nested inside code blocks break GitHub rendering. Claude repeated this mistake several times.

**Empty file** — Claude gave file content I hadn't saved. App crashed on next load. Traced it from the error message.
