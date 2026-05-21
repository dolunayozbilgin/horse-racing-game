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
      </section>

      <aside class="panel panel-right">
        <!-- ResultsPanel buraya gelecek -->
      </aside>
    </main>
  </div>
</template>

<script setup>
import HorseList from './components/HorseList.vue'
import RaceControls from './components/RaceControls.vue'
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
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 24px 32px;
  border-bottom: 1px solid #2a2a2a;
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
}

.panel {
  background: #0d0d0d;
  padding: 24px;
}
</style>
