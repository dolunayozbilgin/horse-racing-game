<template>
  <div class="app">
    <header class="app-header">
      <span class="app-title">HORSE RACING</span>
      <span class="app-subtitle">TOURNAMENT</span>
    </header>

    <main class="app-main">
      <aside class="panel panel-left">
        <HorseList />
      </aside>

      <section class="panel panel-center">
        <RaceControls />
        <RaceTrack />
      </section>

      <aside class="panel panel-right">
        <ResultsPanel />
      </aside>
    </main>

    <TournamentWinner
      v-if="store.raceStatus === 'tournament_over' && tournamentWinner"
      :winner="tournamentWinner"
      @reset="store.resetTournament()"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRaceStore } from './stores/raceStore'
import HorseList from './components/HorseList.vue'
import RaceControls from './components/RaceControls.vue'
import RaceTrack from './components/RaceTrack.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import TournamentWinner from './components/TournamentWinner.vue'

const store = useRaceStore()

const tournamentWinner = computed(() => {
  if (store.raceResults.length === 0) return null
  const totalRaces = store.raceResults.length
  const stats = {}

  store.raceResults.forEach((result) => {
    result.finishOrder.forEach((horse, index) => {
      if (!stats[horse.id]) stats[horse.id] = { horse, totalPoints: 0, raceCount: 0 }
      stats[horse.id].totalPoints += 10 - index
      stats[horse.id].raceCount++
    })
  })

  const scored = Object.values(stats).map((entry) => {
    const maxPossible = entry.raceCount * 10
    const ratio = entry.totalPoints / maxPossible
    const participationBonus = 1 + (entry.raceCount / totalRaces) * 0.2
    const finalScore = ratio * 100 * participationBonus
    return { ...entry, finalScore }
  })

  return scored.sort((a, b) => b.finalScore - a.finalScore)[0]?.horse ?? null
})
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0d0d0d;
  color: #ffffff;
  font-family: 'Inter', monospace, sans-serif;
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 24px 32px;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #ffffff;
}

.app-subtitle {
  font-size: 11px;
  letter-spacing: 3px;
  color: #555;
}

.app-main {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 1px;
  flex: 1;
  background: #2a2a2a;
  overflow: hidden;
}

.panel {
  background: #0d0d0d;
  padding: 24px;
  overflow-y: auto;
}

.panel-center {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
</style>
