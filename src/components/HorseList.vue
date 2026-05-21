<template>
  <div class="horse-list">
    <div class="panel-header">
      <span class="panel-title">HORSES</span>
      <span class="panel-subtitle">{{ horses.length }} in pool</span>
    </div>

    <div class="horse-items">
      <div
        v-for="horse in horses"
        :key="horse.id"
        class="horse-item"
        :class="{ 'is-selected': isSelected(horse.id) }"
      >
        <div class="horse-color" :style="{ background: horse.color }"></div>
        <div class="horse-info">
          <span class="horse-name">{{ horse.name }}</span>
          <span class="horse-type">{{ horse.staminaType }}</span>
        </div>
        <div class="horse-condition">
          <div class="condition-bar">
            <div
              class="condition-fill"
              :style="{
                width: horse.condition + '%',
                background: conditionColor(horse.condition),
              }"
            ></div>
          </div>
          <span class="condition-value">{{ horse.condition }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRaceStore } from '../stores/raceStore'
import { storeToRefs } from 'pinia'

const store = useRaceStore()
const { horses, selectedHorses } = storeToRefs(store)

function isSelected(horseId) {
  return selectedHorses.value.some((h) => h.id === horseId)
}

function conditionColor(condition) {
  if (condition >= 75) return '#2ecc71'
  if (condition >= 50) return '#f39c12'
  return '#e74c3c'
}
</script>

<style scoped>
.horse-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
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
  letter-spacing: 1px;
}

.horse-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.horse-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.horse-item.is-selected {
  border-color: #333;
  background: #111;
}

.horse-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.horse-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.horse-name {
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
}

.horse-type {
  font-size: 10px;
  color: #444;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.horse-condition {
  display: flex;
  align-items: center;
  gap: 6px;
}

.condition-bar {
  width: 40px;
  height: 3px;
  background: #1a1a1a;
  border-radius: 2px;
  overflow: hidden;
}

.condition-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.condition-value {
  font-size: 11px;
  color: #555;
  font-family: monospace;
  min-width: 20px;
  text-align: right;
}
</style>
