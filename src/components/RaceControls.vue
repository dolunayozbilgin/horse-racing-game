<template>
  <div class="race-controls">
    <div class="race-info">
      <div class="info-block">
        <span class="info-label">RACE</span>
        <span class="info-value">{{ store.currentRaceIndex + 1 }} / {{ store.totalRaces }}</span>
      </div>
      <div class="info-block">
        <span class="info-label">DISTANCE</span>
        <span class="info-value">{{ store.currentDistance }}m</span>
      </div>
      <div class="info-block">
        <span class="info-label">STATUS</span>
        <span class="info-value status" :class="store.raceStatus">{{ statusLabel }}</span>
      </div>
    </div>

    <div class="buttons">
      <button
        class="btn btn-secondary"
        :disabled="store.raceStatus === 'running'"
        @click="handleGenerate"
      >
        GENERATE PROGRAM
      </button>

      <button
        class="btn btn-primary"
        :disabled="store.raceStatus === 'idle' || store.raceStatus === 'tournament_over'"
        @click="handleStartPause"
      >
        {{ startPauseLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRaceStore } from '../stores/raceStore'

const store = useRaceStore()

const statusLabel = computed(() => {
  const map = {
    idle: 'WAITING',
    ready: 'READY',
    running: 'RUNNING',
    finished: 'FINISHED',
    tournament_over: 'TOURNAMENT OVER',
  }
  return map[store.raceStatus] ?? store.raceStatus
})

const startPauseLabel = computed(() => {
  if (store.raceStatus === 'running') return 'PAUSE'
  if (store.raceStatus === 'finished') return 'NEXT RACE'
  return 'START'
})

function handleGenerate() {
  store.resetTournament()
  store.generateProgram()
}

function handleStartPause() {
  if (store.raceStatus === 'ready') {
    store.raceStatus = 'running'
  } else if (store.raceStatus === 'running') {
    store.raceStatus = 'ready'
  } else if (store.raceStatus === 'finished') {
    store.generateProgram()
  }
}
</script>

<style scoped>
.race-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #1a1a1a;
  background: #0a0a0a;
}

.race-info {
  display: flex;
  gap: 32px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 9px;
  letter-spacing: 2px;
  color: #444;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  font-family: monospace;
  letter-spacing: 1px;
}

.status.idle {
  color: #444;
}
.status.ready {
  color: #f39c12;
}
.status.running {
  color: #2ecc71;
}
.status.finished {
  color: #3498db;
}
.status.tournament_over {
  color: #e74c3c;
}

.buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-secondary {
  background: #1a1a1a;
  color: #888;
  border: 1px solid #2a2a2a;
}

.btn-secondary:not(:disabled):hover {
  background: #222;
  color: #fff;
}

.btn-primary {
  background: #ffffff;
  color: #000000;
}

.btn-primary:not(:disabled):hover {
  opacity: 0.85;
}
</style>
