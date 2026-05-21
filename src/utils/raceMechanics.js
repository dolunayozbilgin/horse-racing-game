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

const INJURY_CHANCE = 0.03
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
    // Sakatlık pistin %20-%70'inde gerçekleşir
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

export function calculateOdds(horses) {
  const total = horses.reduce((sum, h) => sum + h.condition, 0)
  return horses.map((horse) => ({
    horseId: horse.id,
    percentage: Math.round((horse.condition / total) * 100),
  }))
}
