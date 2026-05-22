// ============================================================
// raceMechanics.js
// All race simulation math lives here — no Vue dependencies.
// Pure functions only: data in, data out.
// This isolation is what makes unit testing possible.
// ============================================================

// Stamina bonus table — each horse type has distance preferences.
// Sprint horses are built for short bursts, stayers for endurance.
// These values were tuned to create meaningful distance differentiation
// without making any single type dominant across all 6 races.
const STAMINA_BONUS = {
  sprint: { 1200: 15, 1400: 8, 1600: 0, 1800: -8, 2000: -15, 2200: -20 },
  middle: { 1200: 0, 1400: 0, 1600: 5, 1800: 5, 2000: 0, 2200: 0 },
  stayer: { 1200: -10, 1400: -5, 1600: 0, 1800: 10, 2000: 18, 2200: 25 },
}

// Fatigue increases with distance — longer races wear horses down more.
// This feeds into condition decay after each race.
const FATIGUE_BY_DISTANCE = {
  1200: 5,
  1400: 7,
  1600: 9,
  1800: 11,
  2000: 13,
  2200: 15,
}

const INJURY_CHANCE = 0.008 // 0.8% per race — rare but dramatic when it happens
const FORM_CHANCE = 0.15 // 15% good day, 15% bad day, 70% neutral
const FORM_BOOST = 15 // ±15 points — enough to matter, not enough to dominate
const RECOVERY_AMOUNT = 3 // horses that don't race recover slightly
const INJURY_PENALTY_MIN = 25
const INJURY_PENALTY_MAX = 35

// -------------------------------------------------------
// calculateRacePerformances
// Core simulation function. Called once per race.
// Returns horses sorted by performance score (highest = winner).
//
// Formula: performance = condition + staminaBonus + formBonus + noise
// - condition: base fitness, degrades across tournament
// - staminaBonus: distance-type matchup (sprint vs stayer vs middle)
// - formBonus: random "good day / bad day" variance
// - noise: small random factor for realistic unpredictability
//
// Injury is determined here but applied visually mid-race in RaceTrack.vue.
// willBeInjured + injuryPoint are passed to the animation layer.
// -------------------------------------------------------
export function calculateRacePerformances(horses, distance) {
  const results = horses.map((horse) => {
    const staminaBonus = STAMINA_BONUS[horse.staminaType][distance] ?? 0

    const formRoll = Math.random()
    let formBonus = 0
    let formDay = 'neutral'
    if (formRoll < FORM_CHANCE) {
      formBonus = FORM_BOOST
      formDay = 'good'
    } else if (formRoll < FORM_CHANCE * 2) {
      formBonus = -FORM_BOOST
      formDay = 'bad'
    }

    const noise = (Math.random() - 0.5) * 20
    const performance = horse.condition + staminaBonus + formBonus + noise

    const willBeInjured = Math.random() < INJURY_CHANCE
    // Injury triggers between 20–70% of the track — horse runs first, then stops
    const injuryPoint = willBeInjured ? 0.2 + Math.random() * 0.5 : null

    return {
      horse,
      performance: Math.max(0, performance),
      injured: false,
      willBeInjured,
      injuryPoint,
      formDay,
    }
  })

  return results.sort((a, b) => b.performance - a.performance)
}

// -------------------------------------------------------
// updateConditionsAfterRace
// Called after every race to update the persistent horse conditions.
// Three cases: raced (fatigue), didn't race (recovery), injured (heavy penalty).
// Condition is clamped 1–100 — never zero, never over 100.
// -------------------------------------------------------
export function updateConditionsAfterRace(allHorses, raceHorses, distance, injuredIds) {
  return allHorses.map((horse) => {
    const raced = raceHorses.some((h) => h.id === horse.id)
    const injured = injuredIds.includes(horse.id)

    let newCondition = horse.condition

    if (injured) {
      const penalty = INJURY_PENALTY_MIN + Math.random() * (INJURY_PENALTY_MAX - INJURY_PENALTY_MIN)
      newCondition -= penalty
    } else if (raced) {
      newCondition -= FATIGUE_BY_DISTANCE[distance]
    } else {
      newCondition += RECOVERY_AMOUNT
    }

    return {
      ...horse,
      condition: Math.min(100, Math.max(1, Math.round(newCondition))),
    }
  })
}

// -------------------------------------------------------
// getFormBonus (internal)
// Looks at the last race result to adjust odds.
// Top 3 finish → horse is "in form" → odds decrease (more favored)
// Bottom 3 finish → horse is "out of form" → odds increase (less favored)
// -------------------------------------------------------
function getFormBonus(horse, raceResults) {
  if (raceResults.length === 0) return 0
  const lastRace = raceResults[raceResults.length - 1]
  const position = lastRace.finishOrder.findIndex((h) => h.id === horse.id)
  if (position === -1) return 0 // horse didn't race — neutral
  if (position <= 2) return -8 // top 3 → lower odds (favored)
  if (position >= 7) return 8 // bottom 3 → higher odds (underdog)
  return 0
}

// -------------------------------------------------------
// calculateOdds
// Three-factor odds model:
// 1. condition × 0.6 — base fitness (primary factor)
// 2. staminaBonus × 0.8 — distance suitability
// 3. winPenalty — previous wins reduce odds (favorites get shorter)
// 4. formBonus — last race performance shifts odds ±8
//
// Final odds: (100 / percentage) × 0.85
// The 0.85 represents house margin — same as real bookmakers.
// A horse at 10% probability pays 8.5x (not 10x).
// -------------------------------------------------------
export function calculateOdds(horses, distance, winCounts = {}, raceResults = []) {
  const adjusted = horses.map((horse) => {
    const staminaBonus = STAMINA_BONUS[horse.staminaType][distance] ?? 0
    const winPenalty = (winCounts[horse.id] ?? 0) * 5
    const formBonus = getFormBonus(horse, raceResults)
    const score = Math.max(1, horse.condition * 0.6 + staminaBonus * 0.8 - winPenalty + formBonus)
    return { horse, score }
  })

  const total = adjusted.reduce((sum, a) => sum + a.score, 0)

  return adjusted.map(({ horse, score }) => {
    const percentage = Math.round((score / total) * 100)
    const rawOdds = percentage > 0 ? (100 / percentage) * 0.85 : 99
    const odds = Math.round(rawOdds * 10) / 10
    return { horseId: horse.id, percentage, odds }
  })
}

// -------------------------------------------------------
// calculateBettingOdds
// Extends calculateOdds to produce four bet types:
//
// WIN   — straight win odds
// PLACE — finish top 3 (WIN / 3, lower risk)
// EXACTA — predict 1st and 2nd in order
//           odds = horse1.win × horse2.win × 1.15 × 0.6 × noise
// TRIFECTA — predict 1st, 2nd, 3rd in order
//             odds = h1.win × h2.win × 1.15 × h3.win × 1.3 × 0.4 × noise
//
// Position multipliers (1.15, 1.3) reflect increasing difficulty
// of predicting each successive position.
// Noise (±10%) prevents identical combination odds.
// Top 5 combinations returned for each type.
// -------------------------------------------------------
export function calculateBettingOdds(horses, distance, winCounts = {}, raceResults = []) {
  const baseOdds = calculateOdds(horses, distance, winCounts, raceResults).sort(
    (a, b) => a.odds - b.odds,
  )

  const sorted = baseOdds.map((o) => ({
    horse: horses.find((h) => h.id === o.horseId),
    winOdds: o.odds,
    percentage: o.percentage,
  }))

  const withPlace = sorted.map((item) => ({
    ...item,
    placeOdds: Math.round((item.winOdds / 3) * 10) / 10,
  }))

  const exactaCombos = []
  for (let i = 0; i < sorted.length; i++) {
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue
      const base = sorted[i].winOdds * sorted[j].winOdds * 1.15 * 0.6
      const noise = 0.9 + Math.random() * 0.2
      const odds = Math.round(base * noise * 10) / 10
      exactaCombos.push({ horses: [sorted[i].horse, sorted[j].horse], odds })
    }
  }
  exactaCombos.sort((a, b) => a.odds - b.odds)

  const trifectaCombos = []
  for (let i = 0; i < sorted.length; i++) {
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue
      for (let k = 0; k < sorted.length; k++) {
        if (k === i || k === j) continue
        const base = sorted[i].winOdds * sorted[j].winOdds * 1.15 * sorted[k].winOdds * 1.3 * 0.4
        const noise = 0.9 + Math.random() * 0.2
        const odds = Math.round(base * noise * 10) / 10
        trifectaCombos.push({
          horses: [sorted[i].horse, sorted[j].horse, sorted[k].horse],
          odds,
        })
      }
    }
  }
  trifectaCombos.sort((a, b) => a.odds - b.odds)

  return {
    win: withPlace,
    exacta: exactaCombos.slice(0, 5),
    trifecta: trifectaCombos.slice(0, 5),
  }
}
