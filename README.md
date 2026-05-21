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

### Formula

_How does condition affect outcome? What randomness is added? What makes upsets possible?_

### Distance & Stamina

_How do longer races (1200m → 2200m) affect performance?_

---

## Animation Approach

_To be filled after `RaceTrack.vue` is built._

### Chosen Method

_CSS transitions / requestAnimationFrame / canvas — which and why_

### Trade-offs

_What did this approach gain and sacrifice?_

---

## Bonus Track

_To be filled after bonus feature is implemented._

**Chosen track:** _Meaningful unit tests for store logic and race mechanics_

**Why this track:**
_Short explanation here_

---

## About the Code

### 1. Race Mechanics Formula

_File path + line numbers — to be filled_

### 2. Design Decision I'm Proud Of

_File path + line numbers + explanation — to be filled_

### Design Decision I'd Revisit

_File path + line numbers + explanation — to be filled_

### 3. What Would Break at 10x Scale

_File path + line numbers + explanation — to be filled_

### 4. First Thing to Tell a New Teammate

_To be filled_

---

## About My Process

### 1. Hardest Part

_To be filled_

### 2. Assumptions Where Spec Was Silent

_To be filled_

### 3. What I Cut & What I'd Build With Another Week

_To be filled_

---

## About My AI Workflow

### 1. What I Delegated vs. Owned

_To be filled_

### 2. When I Took a Different Path Than AI Suggested

_To be filled_

### 3. Where AI Misled Me & How I Caught It

_To be filled_
