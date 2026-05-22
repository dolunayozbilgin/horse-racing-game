import { defineStore } from 'pinia'

const HORSE_POOL = [
  { id: 1, name: 'Karayel', color: '#2c3e50', staminaType: 'stayer' },
  { id: 2, name: 'Rüzgar', color: '#3498db', staminaType: 'sprint' },
  { id: 3, name: 'Fırtına', color: '#7f8c8d', staminaType: 'middle' },
  { id: 4, name: 'King', color: '#f39c12', staminaType: 'sprint' },
  { id: 5, name: 'Yavuz', color: '#c0392b', staminaType: 'stayer' },
  { id: 6, name: 'Şimşek', color: '#f1c40f', staminaType: 'sprint' },
  { id: 7, name: 'Star', color: '#9b59b6', staminaType: 'middle' },
  { id: 8, name: 'Han', color: '#e67e22', staminaType: 'stayer' },
  { id: 9, name: 'Yıldırım', color: '#e74c3c', staminaType: 'sprint' },
  { id: 10, name: 'Soylu', color: '#1abc9c', staminaType: 'middle' },
  { id: 11, name: 'Lord', color: '#2ecc71', staminaType: 'stayer' },
  { id: 12, name: 'Ateş', color: '#e91e63', staminaType: 'sprint' },
  { id: 13, name: 'Kara', color: '#4a5568', staminaType: 'middle' },
  { id: 14, name: 'Princess', color: '#fd79a8', staminaType: 'stayer' },
  { id: 15, name: 'Bey', color: '#6c5ce7', staminaType: 'sprint' },
  { id: 16, name: 'Gülü', color: '#ff6b6b', staminaType: 'middle' },
  { id: 17, name: 'Ağa', color: '#ca8a04', staminaType: 'stayer' },
  { id: 18, name: 'Captain', color: '#0984e3', staminaType: 'middle' },
  { id: 19, name: 'Son of Wind', color: '#00b894', staminaType: 'stayer' },
  { id: 20, name: 'Baba', color: '#636e72', staminaType: 'middle' },
]

const RACE_DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200]

function randomizeConditions() {
  return HORSE_POOL.map((h) => ({
    ...h,
    condition: Math.floor(60 + Math.random() * 40),
  }))
}

export const useRaceStore = defineStore('race', {
  state: () => ({
    horses: randomizeConditions(),
    currentRaceIndex: 0,
    selectedHorses: [],
    raceResults: [],
    raceStatus: 'idle',
    injuryOccurred: false,
    skipRace: false,
  }),

  getters: {
    currentDistance: (state) => RACE_DISTANCES[state.currentRaceIndex],
    totalRaces: () => RACE_DISTANCES.length,
    isLastRace: (state) => state.currentRaceIndex === RACE_DISTANCES.length - 1,
    winCounts: (state) => {
      const counts = {}
      state.raceResults.forEach((result) => {
        const winner = result.finishOrder[0]
        if (winner) {
          counts[winner.id] = (counts[winner.id] ?? 0) + 1
        }
      })
      return counts
    },
  },

  actions: {
    generateProgram() {
      const shuffled = [...this.horses].sort(() => Math.random() - 0.5)
      this.selectedHorses = shuffled.slice(0, 10)
      this.raceStatus = 'ready'
    },

    saveRaceResult(finishOrder) {
      this.raceResults.push({
        race: this.currentRaceIndex + 1,
        distance: this.currentDistance,
        finishOrder,
      })

      if (this.isLastRace) {
        this.raceStatus = 'tournament_over'
      } else {
        this.currentRaceIndex++
        this.raceStatus = 'finished'
      }
    },

    resetTournament() {
      this.horses = randomizeConditions()
      this.currentRaceIndex = 0
      this.selectedHorses = []
      this.raceResults = []
      this.raceStatus = 'idle'
      this.injuryOccurred = false
      this.skipRace = false
    },
  },
})
