# CLAUDE.md

This file configures Claude's behavior when working on this codebase.

## Project Overview

A tournament-style horse racing simulation built with Vue 3 + Pinia.
6 races, 20 horses, cinematic dark UI. Single-page application.

## Architecture Rules

- **All game state lives in `src/stores/raceStore.js`** — never scatter state across components
- **All race math lives in `src/utils/raceMechanics.js`** — components never calculate outcomes
- **Components are display-only** — they read from store, dispatch actions, render UI
- **DRY** — if the same logic appears in two places, it belongs in `raceMechanics.js` or the store
- **Single Responsibility** — each file has one job. If a function is growing too large, split it

## Core Spec (Locked — Never Change)

- 20 horses in pool, each with unique color and condition (1–100)
- 6 races: 1200m, 1400m, 1600m, 1800m, 2000m, 2200m
- 10 horses randomly selected per race
- Outcomes influenced by condition but not deterministic
- Horses visibly animated along track
- Results panel shows finishing order (1st–10th)
- Next race only starts after current finishes

## Race Mechanics (src/utils/raceMechanics.js)

Performance formula:

performance = condition + staminaBonus + formBonus + noise

- **staminaType**: sprint (fast early, fades), middle (consistent), stayer (strong late)
- **formBonus**: 15% good day (+15), 15% bad day (-15), 70% neutral
- **noise**: ±10 random
- **injury**: 0.8% chance per race, max 1 per tournament, occurs mid-race
- **surge**: condition-based chance (condition/100 × 40%), triggers between 40-75% of track

After each race:

- Raced horses lose 5–15 condition (by distance)
- Injured horses lose 25–35 condition
- Non-racing horses recover +3 condition

## User Decisions (Do Not Override)

These decisions were made deliberately by the developer — do not change without explicit instruction:

- **Turkish horse names** — Karayel, Rüzgar, Fırtına etc. are intentional, never replace with generic names
- **Cinematic dark theme** — #0d0d0d background, letter-spacing, monospace accents. Never lighten the UI
- **Injury must happen mid-race** — not at start. The horse runs, then collapses. This is a UX decision
- **Surge is selective** — only some horses surge, never all simultaneously. Mass surge defeats the purpose
- **Condition decay is a feature** — horses tire across the tournament. Do not remove or simplify this
- **Max 1 injury per tournament** — injury is dramatic, not routine. Keep it rare
- **No router** — this is intentionally a single-page app, do not add Vue Router
- **Conditions randomized per tournament** — 60–100 range, so no horse is always the favorite

## Code Style

- Vue 3 Composition API with script setup
- No TypeScript
- Scoped CSS per component
- storeToRefs for reactive store properties in components
- Commit messages: feat(scope): description / fix(scope): description / docs: description

## File Map

- src/stores/raceStore.js — game state, tournament flow
- src/utils/raceMechanics.js — performance formula, condition decay, odds
- src/components/HorseList.vue — left panel, 20 horses with condition bars
- src/components/RaceControls.vue — top bar, buttons and race info
- src/components/RaceTrack.vue — center, animated lanes, distance ruler, odds button
- src/components/ResultsPanel.vue — right panel, race results and tournament winner
- src/components/OddsModal.vue — pre-race betting modal (WIN, PLACE, EXACTA, TRIFECTA)
- src/components/TournamentWinner.vue — confetti winner screen
- src/App.vue — layout only, no logic

## What Not to Touch

- Race distances (1200–2200m) — locked by spec
- Horse pool size (20) — locked by spec
- Horses per race (10) — locked by spec
- Horse names and colors — deliberate choices by developer

## Known Limitations

- No persistence — refreshing resets tournament
- Surge probability not reflected in pre-race odds
- No sound effects (cut for scope)
- No mobile responsive layout (cut for scope)
- `startRace` in `RaceTrack.vue` handles too many responsibilities — should be extracted into a `useRaceAnimation.js` composable
