<template>
  <div class="race-track">
    <div v-if="store.raceStatus === 'idle'" class="empty-state">
      <span class="empty-text">GENERATE PROGRAM TO BEGIN</span>
    </div>

    <div v-else class="track-container">
      <div class="distance-ruler">
        <div class="ruler-spacer"></div>
        <div class="ruler-track">
          <div
            v-for="marker in distanceMarkers"
            :key="marker.label"
            class="ruler-marker"
            :style="{ left: marker.position + '%' }"
          >
            <span class="ruler-label">{{ marker.label }}</span>
          </div>
          <div class="ruler-finish">
            <span class="ruler-finish-label">FINISH</span>
          </div>
        </div>
      </div>

      <div v-for="(horse, index) in store.selectedHorses" :key="horse.id" class="lane">
        <div class="lane-number">{{ index + 1 }}</div>
        <div class="lane-track" :class="{ 'is-injured': injuredHorses.has(horse.id) }">
          <div class="finish-line"></div>
          <div
            class="horse-runner"
            :style="{ left: getPosition(horse.id) + '%', color: horse.color }"
          >
            <span class="horse-icon">{{ injuredHorses.has(horse.id) ? '🚑' : '🐴' }}</span>
            <span class="horse-label">{{ horse.name }}</span>
          </div>
        </div>
      </div>

      <!-- Pre-race odds — sadece ready durumunda göster -->
      <div v-if="store.raceStatus === 'ready'" class="odds-panel">
        <div class="odds-title">PRE-RACE ODDS</div>
        <div class="odds-list">
          <div v-for="odd in odds" :key="odd.horseId" class="odds-row">
            <div class="odds-dot" :style="{ background: getHorseById(odd.horseId)?.color }"></div>
            <span class="odds-name">{{ getHorseById(odd.horseId)?.name }}</span>
            <div class="odds-bar-wrap">
              <div
                class="odds-bar"
                :style="{
                  width: odd.percentage + '%',
                  background: getHorseById(odd.horseId)?.color,
                }"
              ></div>
            </div>
            <span class="odds-pct">{{ odd.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.raceStatus === 'tournament_over'" class="tournament-over">
      <span class="over-title">TOURNAMENT COMPLETE</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { useRaceStore } from '../stores/raceStore'
import {
  calculateRacePerformances,
  updateConditionsAfterRace,
  calculateOdds,
} from '../utils/raceMechanics'

const store = useRaceStore()

const positions = ref({})
const raceInterval = ref(null)
const raceFinished = ref(false)
const injuredHorses = ref(new Set())

const distanceMarkers = computed(() => {
  const distance = store.currentDistance
  const markers = []
  for (let m = 200; m < distance; m += 200) {
    markers.push({
      label: m + 'm',
      position: (m / distance) * 85,
    })
  }
  return markers
})

const odds = computed(() => {
  if (store.selectedHorses.length === 0) return []
  return calculateOdds(store.selectedHorses).sort((a, b) => b.percentage - a.percentage)
})

function getHorseById(id) {
  return store.selectedHorses.find((h) => h.id === id)
}

function getPosition(horseId) {
  return positions.value[horseId] ?? 0
}

function initPositions() {
  const pos = {}
  store.selectedHorses.forEach((h) => {
    pos[h.id] = 0
  })
  positions.value = pos
  raceFinished.value = false
  injuredHorses.value = new Set()
}

function startRace() {
  if (raceInterval.value) clearInterval(raceInterval.value)

  const performances = calculateRacePerformances(store.selectedHorses, store.currentDistance)

  const speeds = {}
  const injuryPoints = {}
  const injuredSet = new Set()
  const finishTimes = {}
  const surgeData = {}
  let tick = 0

  performances.forEach((result) => {
    const horse = result.horse
    speeds[horse.id] = result.performance

    if (result.willBeInjured && !store.injuryOccurred) {
      injuryPoints[horse.id] = result.injuryPoint * 90
      store.injuryOccurred = true
    }

    const canSurge = horse.condition > 40 && Math.random() < 0.25
    if (canSurge) {
      surgeData[horse.id] = {
        triggerAt: 40 + Math.random() * 35,
        duration: Math.floor(8 + Math.random() * 7),
        multiplier: 1.8 + (horse.condition / 100) * 0.6,
        active: false,
        ticksLeft: 0,
      }
    }
  })

  const maxPerf = Math.max(...Object.values(speeds))

  raceInterval.value = setInterval(() => {
    tick++

    store.selectedHorses.forEach((horse) => {
      if (injuredSet.has(horse.id)) return

      const current = positions.value[horse.id] ?? 0

      if (injuryPoints[horse.id] && current >= injuryPoints[horse.id]) {
        injuredSet.add(horse.id)
        injuredHorses.value = new Set(injuredSet)
        return
      }

      if (current < 90) {
        let speed = (speeds[horse.id] / maxPerf) * 0.8 + Math.random() * 0.15

        const surge = surgeData[horse.id]
        if (surge) {
          if (!surge.active && current >= surge.triggerAt) {
            surge.active = true
            surge.ticksLeft = surge.duration
          }
          if (surge.active && surge.ticksLeft > 0) {
            speed *= surge.multiplier
            surge.ticksLeft--
          } else if (surge.active && surge.ticksLeft === 0) {
            surge.active = false
          }
        }

        const newPos = Math.min(90, current + speed)
        positions.value[horse.id] = newPos

        if (newPos >= 90 && !finishTimes[horse.id]) {
          finishTimes[horse.id] = tick
        }
      }
    })

    const healthyHorses = store.selectedHorses.filter((h) => !injuredSet.has(h.id))
    const allHealthyDone = healthyHorses.every((h) => (positions.value[h.id] ?? 0) >= 90)

    if (allHealthyDone) {
      clearInterval(raceInterval.value)
      raceInterval.value = null

      const finishOrder = [...store.selectedHorses].sort((a, b) => {
        if (injuredSet.has(a.id) && injuredSet.has(b.id)) return 0
        if (injuredSet.has(a.id)) return 1
        if (injuredSet.has(b.id)) return -1
        return (finishTimes[a.id] ?? 9999) - (finishTimes[b.id] ?? 9999)
      })

      const injuredIds = [...injuredSet]

      store.horses = updateConditionsAfterRace(
        store.horses,
        store.selectedHorses,
        store.currentDistance,
        injuredIds,
      )

      store.saveRaceResult(finishOrder)
      raceFinished.value = true
    }
  }, 50)
}

function stopRace() {
  if (raceInterval.value) {
    clearInterval(raceInterval.value)
    raceInterval.value = null
  }
}

watch(
  () => store.raceStatus,
  (status) => {
    if (status === 'ready') {
      initPositions()
    } else if (status === 'running') {
      startRace()
    } else if (status === 'idle') {
      stopRace()
    }
  },
)

onUnmounted(() => {
  stopRace()
})
</script>

<style scoped>
.race-track {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-text {
  font-size: 11px;
  letter-spacing: 3px;
  color: #2a2a2a;
}

.track-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distance-ruler {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.ruler-spacer {
  width: 16px;
  flex-shrink: 0;
}

.ruler-track {
  flex: 1;
  position: relative;
  height: 20px;
  border-bottom: 1px solid #222;
}

.ruler-marker {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
}

.ruler-label {
  font-size: 9px;
  color: #333;
  letter-spacing: 0.5px;
  font-family: monospace;
}

.ruler-finish {
  position: absolute;
  right: 10%;
  bottom: 0;
  transform: translateX(50%);
}

.ruler-finish-label {
  font-size: 9px;
  color: #e74c3c;
  letter-spacing: 1px;
  font-family: monospace;
}

.lane {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lane-number {
  font-size: 10px;
  color: #333;
  font-family: monospace;
  width: 16px;
  text-align: right;
}

.lane-track {
  flex: 1;
  height: 28px;
  background: #0f0f0f;
  border: 1px solid #1a1a1a;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: opacity 0.3s;
}

.lane-track.is-injured {
  opacity: 0.4;
  border-color: #e74c3c22;
}

.finish-line {
  position: absolute;
  right: 10%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e74c3c44;
}

.horse-runner {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: left 0.05s linear;
  white-space: nowrap;
}

.horse-icon {
  font-size: 14px;
  filter: drop-shadow(0 0 4px currentColor);
}

.horse-label {
  font-size: 9px;
  letter-spacing: 1px;
  color: currentColor;
  opacity: 0.7;
}

.odds-panel {
  margin-top: 20px;
  border-top: 1px solid #1a1a1a;
  padding-top: 16px;
}

.odds-title {
  font-size: 9px;
  letter-spacing: 3px;
  color: #444;
  margin-bottom: 12px;
}

.odds-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.odds-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.odds-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.odds-name {
  font-size: 11px;
  color: #666;
  width: 90px;
  flex-shrink: 0;
}

.odds-bar-wrap {
  flex: 1;
  height: 3px;
  background: #1a1a1a;
  border-radius: 2px;
  overflow: hidden;
}

.odds-bar {
  height: 100%;
  border-radius: 2px;
  opacity: 0.7;
  transition: width 0.3s ease;
}

.odds-pct {
  font-size: 10px;
  color: #444;
  font-family: monospace;
  width: 30px;
  text-align: right;
}

.tournament-over {
  text-align: center;
  padding: 16px;
  border-top: 1px solid #1a1a1a;
  margin-top: 16px;
}

.over-title {
  font-size: 13px;
  letter-spacing: 4px;
  color: #e74c3c;
}
</style>
