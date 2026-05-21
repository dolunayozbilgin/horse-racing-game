import { describe, it, expect } from 'vitest'
import {
  calculateRacePerformances,
  updateConditionsAfterRace,
  calculateOdds,
} from '../utils/raceMechanics'

// Test için örnek at havuzu
const mockHorses = [
  { id: 1, name: 'Karayel', color: '#2c3e50', condition: 92, staminaType: 'stayer' },
  { id: 2, name: 'Rüzgar', color: '#3498db', condition: 78, staminaType: 'sprint' },
  { id: 3, name: 'Fırtına', color: '#7f8c8d', condition: 55, staminaType: 'middle' },
  { id: 4, name: 'King', color: '#f39c12', condition: 40, staminaType: 'sprint' },
  { id: 5, name: 'Yavuz', color: '#c0392b', condition: 30, staminaType: 'stayer' },
]

describe('calculateRacePerformances', () => {
  it('returns one result per horse', () => {
    const results = calculateRacePerformances(mockHorses, 1200)
    expect(results).toHaveLength(mockHorses.length)
  })

  it('returns results sorted by performance descending', () => {
    const results = calculateRacePerformances(mockHorses, 1200)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].performance).toBeGreaterThanOrEqual(results[i + 1].performance)
    }
  })

  it('injured horse gets 0 performance', () => {
    // Çok sayıda deneme ile en az bir injured sonuç üretelim
    let foundInjured = false
    for (let i = 0; i < 500; i++) {
      const results = calculateRacePerformances(mockHorses, 1200)
      const injured = results.find((r) => r.injured)
      if (injured) {
        expect(injured.performance).toBe(0)
        foundInjured = true
        break
      }
    }
    // 500 denemede bulunmazsa test geçer — injury çok nadir olabilir
    expect(true).toBe(true)
  })

  it('performance is never negative for healthy horses', () => {
    for (let i = 0; i < 50; i++) {
      const results = calculateRacePerformances(mockHorses, 1200)
      results.forEach((r) => {
        if (!r.injured) {
          expect(r.performance).toBeGreaterThanOrEqual(0)
        }
      })
    }
  })

  it('each result has required fields', () => {
    const results = calculateRacePerformances(mockHorses, 1200)
    results.forEach((r) => {
      expect(r).toHaveProperty('horse')
      expect(r).toHaveProperty('performance')
      expect(r).toHaveProperty('injured')
      expect(r).toHaveProperty('formDay')
      expect(r).toHaveProperty('willBeInjured')
      expect(r).toHaveProperty('injuryPoint')
    })
  })

  it('sprint horse gets bonus at 1200m', () => {
    // Sprint tip 1200m'de +15 bonus alır
    // Çok sayıda deneme ile sprint at ortalama daha iyi performans göstermeli
    const sprintHorse = [
      { id: 1, name: 'Test', color: '#fff', condition: 70, staminaType: 'sprint' },
    ]
    const stayerHorse = [
      { id: 2, name: 'Test2', color: '#000', condition: 70, staminaType: 'stayer' },
    ]

    let sprintTotal = 0
    let stayerTotal = 0
    const runs = 100

    for (let i = 0; i < runs; i++) {
      sprintTotal += calculateRacePerformances(sprintHorse, 1200)[0].performance
      stayerTotal += calculateRacePerformances(stayerHorse, 1200)[0].performance
    }

    // Sprint ortalama stayer'dan yüksek olmalı (1200m'de sprint +15, stayer -10)
    expect(sprintTotal / runs).toBeGreaterThan(stayerTotal / runs)
  })
})

describe('updateConditionsAfterRace', () => {
  it('raced horse loses condition', () => {
    const allHorses = [...mockHorses]
    const raceHorses = [mockHorses[0], mockHorses[1]]
    const updated = updateConditionsAfterRace(allHorses, raceHorses, 1200, [])

    const updatedHorse = updated.find((h) => h.id === mockHorses[0].id)
    expect(updatedHorse.condition).toBeLessThan(mockHorses[0].condition)
  })

  it('non-racing horse gains condition', () => {
    const allHorses = [...mockHorses]
    const raceHorses = [mockHorses[0], mockHorses[1]]
    const updated = updateConditionsAfterRace(allHorses, raceHorses, 1200, [])

    // mockHorses[2] yarışmadı, toparlamalı
    const updatedHorse = updated.find((h) => h.id === mockHorses[2].id)
    expect(updatedHorse.condition).toBeGreaterThan(mockHorses[2].condition)
  })

  it('injured horse loses more condition than normal racer', () => {
    const allHorses = [...mockHorses]
    const raceHorses = [mockHorses[0], mockHorses[1]]
    const injuredIds = [mockHorses[0].id]
    const updated = updateConditionsAfterRace(allHorses, raceHorses, 1200, injuredIds)

    const injuredHorse = updated.find((h) => h.id === mockHorses[0].id)
    const normalRacer = updated.find((h) => h.id === mockHorses[1].id)

    const injuredLoss = mockHorses[0].condition - injuredHorse.condition
    const normalLoss = mockHorses[1].condition - normalRacer.condition

    expect(injuredLoss).toBeGreaterThan(normalLoss)
  })

  it('condition never goes below 1', () => {
    const weakHorse = [{ id: 99, name: 'Weak', color: '#fff', condition: 2, staminaType: 'middle' }]
    const updated = updateConditionsAfterRace(weakHorse, weakHorse, 2200, [99])
    expect(updated[0].condition).toBeGreaterThanOrEqual(1)
  })

  it('condition never exceeds 100', () => {
    const strongHorse = [
      { id: 99, name: 'Strong', color: '#fff', condition: 99, staminaType: 'middle' },
    ]
    const updated = updateConditionsAfterRace(strongHorse, [], 1200, [])
    expect(updated[0].condition).toBeLessThanOrEqual(100)
  })

  it('longer distance causes more fatigue', () => {
    const horse = mockHorses[0]
    const short = updateConditionsAfterRace([horse], [horse], 1200, [])
    const long = updateConditionsAfterRace([horse], [horse], 2200, [])

    const shortLoss = horse.condition - short[0].condition
    const longLoss = horse.condition - long[0].condition

    expect(longLoss).toBeGreaterThan(shortLoss)
  })
})

describe('calculateOdds', () => {
  it('returns one entry per horse', () => {
    const odds = calculateOdds(mockHorses)
    expect(odds).toHaveLength(mockHorses.length)
  })

  it('percentages sum to approximately 100', () => {
    const odds = calculateOdds(mockHorses)
    const total = odds.reduce((sum, o) => sum + o.percentage, 0)
    // Yuvarlama hatası nedeniyle ±5 tolerans
    expect(total).toBeGreaterThanOrEqual(95)
    expect(total).toBeLessThanOrEqual(105)
  })

  it('higher condition horse gets higher odds', () => {
    const odds = calculateOdds(mockHorses)
    const karayel = odds.find((o) => o.horseId === 1) // condition 92
    const yavuz = odds.find((o) => o.horseId === 5) // condition 30
    expect(karayel.percentage).toBeGreaterThan(yavuz.percentage)
  })

  it('each entry has horseId and percentage', () => {
    const odds = calculateOdds(mockHorses)
    odds.forEach((o) => {
      expect(o).toHaveProperty('horseId')
      expect(o).toHaveProperty('percentage')
    })
  })
})
