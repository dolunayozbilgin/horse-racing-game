<template>
  <div class="results-panel">
    <div class="panel-header">
      <span class="panel-title">RESULTS</span>
      <span class="panel-subtitle">{{ store.raceResults.length }} / 6 races</span>
    </div>

    <div v-if="store.raceResults.length === 0" class="empty-state">
      <span class="empty-text">NO RACES YET</span>
    </div>

    <div class="results-list">
      <div v-for="result in store.raceResults" :key="result.race" class="result-block">
        <div class="result-header">
          <span class="result-race">RACE {{ result.race }}</span>
          <span class="result-distance">{{ result.distance }}m</span>
        </div>
        <div class="result-horses">
          <div
            v-for="(horse, index) in result.finishOrder"
            :key="horse.id"
            class="result-row"
            :class="{ 'is-first': index === 0 }"
          >
            <span class="result-pos">{{ index + 1 }}</span>
            <div class="result-dot" :style="{ background: horse.color }"></div>
            <span class="result-name">{{ horse.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.raceStatus === 'tournament_over'" class="tournament-summary">
      <div class="summary-title">TOURNAMENT WINNER</div>
      <div class="summary-winner" :style="{ color: tournamentWinner?.color }">
        {{ tournamentWinner?.name }}
      </div>
      <button class="btn-reset" @click="handleReset">NEW TOURNAMENT</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRaceStore } from '../stores/raceStore'

const store = useRaceStore()

const tournamentWinner = computed(() => {
  if (store.raceResults.length === 0) return null

  const points = {}
  store.raceResults.forEach((result) => {
    result.finishOrder.forEach((horse, index) => {
      if (!points[horse.id]) points[horse.id] = { horse, pts: 0 }
      points[horse.id].pts += 10 - index
    })
  })

  const sorted = Object.values(points).sort((a, b) => b.pts - a.pts)
  return sorted[0]?.horse ?? null
})

function handleReset() {
  store.resetTournament()
}
</script>

<style scoped>
.results-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #ffffff;
}

.panel-subtitle {
  font-size: 11px;
  color: #555;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.empty-text {
  font-size: 10px;
  letter-spacing: 2px;
  color: #2a2a2a;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-block {
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #111;
  border-bottom: 1px solid #1a1a1a;
}

.result-race {
  font-size: 9px;
  letter-spacing: 2px;
  color: #555;
}

.result-distance {
  font-size: 9px;
  color: #333;
  font-family: monospace;
}

.result-horses {
  padding: 6px 0;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px;
}

.result-row.is-first {
  background: #0f0f0f;
}

.result-pos {
  font-size: 9px;
  color: #333;
  font-family: monospace;
  width: 12px;
}

.result-row.is-first .result-pos {
  color: #f39c12;
}

.result-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.result-name {
  font-size: 11px;
  color: #666;
}

.result-row.is-first .result-name {
  color: #ffffff;
  font-weight: 500;
}

.tournament-summary {
  border-top: 1px solid #1a1a1a;
  padding-top: 16px;
  margin-top: 8px;
  flex-shrink: 0;
  text-align: center;
}

.summary-title {
  font-size: 9px;
  letter-spacing: 3px;
  color: #444;
  margin-bottom: 8px;
}

.summary-winner {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.btn-reset {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #2a2a2a;
  color: #555;
  font-size: 10px;
  letter-spacing: 2px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.btn-reset:hover {
  border-color: #555;
  color: #fff;
}
</style>
