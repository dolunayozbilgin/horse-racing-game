// ============================================================
// raceMechanics.js
// Tüm yarış formülü burada yaşar.
// Performance hesabı, condition güncellemesi, sakatlık riski.
// ============================================================

const STAMINA_BONUS = {
  sprint: { 1200: 15, 1400: 8, 1600: 0, 1800: -8, 2000: -15, 2200: -20 },
  middle: { 1200: 0, 1400: 0, 1600: 5, 1800: 5, 2000: 0, 2200: 0 },
  stayer: { 1200: -10, 1400: -5, 1600: 0, 1800: 10, 2000: 18, 2200: 25 },
}

const FATIGUE_BY_DISTANCE = {
  1200: 5,
  1400: 7,
  1600: 9,
  1800: 11,
  2000: 13,
  2200: 15,
}

const INJURY_CHANCE = 0.008
const FORM_CHANCE = 0.15
const FORM_BOOST = 15
const RECOVERY_AMOUNT = 3
const INJURY_PENALTY_MIN = 25
const INJURY_PENALTY_MAX = 35

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

function getFormBonus(horse, raceResults) {
  if (raceResults.length === 0) return 0
  const lastRace = raceResults[raceResults.length - 1]
  const position = lastRace.finishOrder.findIndex((h) => h.id === horse.id)
  if (position === -1) return 0
  if (position <= 2) return -8
  if (position >= 7) return 8
  return 0
}

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

  // Exacta — sıra pozisyon çarpanı + noise
  const exactaCombos = []
  for (let i = 0; i < sorted.length; i++) {
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue
      const baseOdds = sorted[i].winOdds * sorted[j].winOdds * 1.15 * 0.6
      const noise = 0.9 + Math.random() * 0.2
      const odds = Math.round(baseOdds * noise * 10) / 10
      exactaCombos.push({ horses: [sorted[i].horse, sorted[j].horse], odds })
    }
  }
  exactaCombos.sort((a, b) => a.odds - b.odds)

  // Trifecta — sıra pozisyon çarpanı + noise
  const trifectaCombos = []
  for (let i = 0; i < sorted.length; i++) {
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue
      for (let k = 0; k < sorted.length; k++) {
        if (k === i || k === j) continue
        const baseOdds =
          sorted[i].winOdds * sorted[j].winOdds * 1.15 * sorted[k].winOdds * 1.3 * 0.4
        const noise = 0.9 + Math.random() * 0.2
        const odds = Math.round(baseOdds * noise * 10) / 10
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
