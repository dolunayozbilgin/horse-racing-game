<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-title">PRE-RACE ODDS</span>
          <span class="modal-subtitle"
            >RACE {{ store.currentRaceIndex + 1 }} · {{ store.currentDistance }}m</span
          >
        </div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="modal-body">
        <!-- WIN -->
        <div v-if="activeTab === 'win'" class="tab-content">
          <p class="tab-desc">Pick the winner. Highest risk, highest reward.</p>
          <div class="odds-list">
            <div v-for="item in bettingOdds.win" :key="item.horse.id" class="odds-row">
              <div class="horse-dot" :style="{ background: item.horse.color }"></div>
              <span class="horse-name">{{ item.horse.name }}</span>
              <span class="horse-type">{{ item.horse.staminaType }}</span>
              <div class="odds-bar-wrap">
                <div
                  class="odds-bar"
                  :style="{ width: item.percentage + '%', background: item.horse.color }"
                ></div>
              </div>
              <span class="odds-value">{{ item.winOdds }}x</span>
            </div>
          </div>
        </div>

        <!-- PLACE -->
        <div v-if="activeTab === 'place'" class="tab-content">
          <p class="tab-desc">Pick a horse to finish in the top 3. Lower odds, safer bet.</p>
          <div class="odds-list">
            <div v-for="item in bettingOdds.win" :key="item.horse.id" class="odds-row">
              <div class="horse-dot" :style="{ background: item.horse.color }"></div>
              <span class="horse-name">{{ item.horse.name }}</span>
              <span class="horse-type">{{ item.horse.staminaType }}</span>
              <div class="odds-bar-wrap">
                <div
                  class="odds-bar"
                  :style="{ width: item.percentage + '%', background: item.horse.color }"
                ></div>
              </div>
              <span class="odds-value">{{ item.placeOdds }}x</span>
            </div>
          </div>
        </div>

        <!-- EXACTA -->
        <div v-if="activeTab === 'exacta'" class="tab-content">
          <p class="tab-desc">Predict the exact 1st and 2nd place finishers in order.</p>
          <div class="combo-list">
            <div v-for="(combo, idx) in bettingOdds.exacta" :key="idx" class="combo-card">
              <div class="combo-horses">
                <div v-for="(horse, i) in combo.horses" :key="horse.id" class="combo-horse">
                  <span class="combo-pos">{{ i + 1 }}.</span>
                  <div class="horse-dot" :style="{ background: horse.color }"></div>
                  <span class="horse-name">{{ horse.name }}</span>
                </div>
              </div>
              <div class="combo-odds">
                <span class="combo-odds-value">{{ combo.odds }}x</span>
              </div>
            </div>
          </div>
          <p class="more-combos-note">
            Showing top 5 combinations by odds. For full combination betting, please consult a
            licensed bookmaker.
          </p>
        </div>

        <!-- TRIFECTA -->
        <div v-if="activeTab === 'trifecta'" class="tab-content">
          <p class="tab-desc">
            Predict the exact 1st, 2nd, and 3rd place finishers in order. Extremely difficult —
            extremely rewarding.
          </p>
          <div class="combo-list">
            <div v-for="(combo, idx) in bettingOdds.trifecta" :key="idx" class="combo-card">
              <div class="combo-horses">
                <div v-for="(horse, i) in combo.horses" :key="horse.id" class="combo-horse">
                  <span class="combo-pos">{{ i + 1 }}.</span>
                  <div class="horse-dot" :style="{ background: horse.color }"></div>
                  <span class="horse-name">{{ horse.name }}</span>
                </div>
              </div>
              <div class="combo-odds">
                <span class="combo-odds-value">{{ combo.odds }}x</span>
              </div>
            </div>
          </div>
          <p class="more-combos-note">
            Showing top 5 combinations by odds. For full combination betting, please consult a
            licensed bookmaker.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRaceStore } from '../stores/raceStore'
import { calculateBettingOdds } from '../utils/raceMechanics'

const store = useRaceStore()
const activeTab = ref('win')

const tabs = [
  { id: 'win', label: 'WIN' },
  { id: 'place', label: 'PLACE' },
  { id: 'exacta', label: 'EXACTA' },
  { id: 'trifecta', label: 'TRIFECTA' },
]

const bettingOdds = computed(() => {
  return calculateBettingOdds(store.selectedHorses, store.currentDistance, store.winCounts)
})

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: #111;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #1a1a1a;
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #ffffff;
}

.modal-subtitle {
  font-size: 10px;
  letter-spacing: 2px;
  color: #444;
}

.modal-close {
  background: none;
  border: none;
  color: #444;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #fff;
}

.modal-tabs {
  display: flex;
  border-bottom: 1px solid #1a1a1a;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: #444;
  font-size: 10px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: #888;
}

.tab-btn.active {
  color: #ffffff;
  border-bottom-color: #ffffff;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.tab-desc {
  font-size: 11px;
  color: #444;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.odds-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.odds-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.horse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.horse-name {
  font-size: 12px;
  color: #ffffff;
  width: 90px;
  flex-shrink: 0;
}

.horse-type {
  font-size: 9px;
  color: #333;
  letter-spacing: 1px;
  width: 50px;
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
  opacity: 0.6;
}

.odds-value {
  font-size: 13px;
  font-weight: 600;
  color: #f39c12;
  font-family: monospace;
  width: 50px;
  text-align: right;
}

.combo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combo-card {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.combo-horses {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.combo-horse {
  display: flex;
  align-items: center;
  gap: 8px;
}

.combo-pos {
  font-size: 10px;
  color: #444;
  font-family: monospace;
  width: 16px;
}

.combo-odds {
  text-align: right;
}

.combo-odds-value {
  font-size: 18px;
  font-weight: 600;
  color: #f39c12;
  font-family: monospace;
}

.more-combos-note {
  margin-top: 16px;
  font-size: 10px;
  color: #555;
  letter-spacing: 0.5px;
  border-top: 1px solid #1a1a1a;
  padding-top: 12px;
  font-style: italic;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
