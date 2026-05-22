<template>
  <div class="winner-overlay">
    <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    <div class="winner-content">
      <div class="winner-label">TOURNAMENT WINNER</div>
      <div class="winner-name" :style="{ color: winner.color }">
        {{ winner.name }}
      </div>
      <div class="winner-subtitle">CHAMPION</div>
      <button class="new-tournament-btn" @click="$emit('reset')">NEW TOURNAMENT</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps(['winner'])
defineEmits(['reset'])

const confettiCanvas = ref(null)
let animFrame = null
let particles = []

function randomColor() {
  const colors = ['#f39c12', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e91e63']
  return colors[Math.floor(Math.random() * colors.length)]
}

function createParticles(canvas) {
  particles = []
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      color: randomColor(),
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 3,
      speedY: Math.random() * 4 + 2,
      speedR: (Math.random() - 0.5) * 5,
    })
  }
}

function drawConfetti(canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach((p) => {
    ctx.save()
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    ctx.restore()

    p.x += p.speedX
    p.y += p.speedY
    p.rotation += p.speedR

    if (p.y > canvas.height) {
      p.y = -p.h
      p.x = Math.random() * canvas.width
    }
  })
}

onMounted(() => {
  const canvas = confettiCanvas.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')
  createParticles(canvas)

  function animate() {
    drawConfetti(canvas, ctx)
    animFrame = requestAnimationFrame(animate)
  }
  animate()
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
.winner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.5s ease;
}

.confetti-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.winner-content {
  position: relative;
  z-index: 201;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.winner-label {
  font-size: 11px;
  letter-spacing: 6px;
  color: #555;
}

.winner-name {
  font-size: 64px;
  font-weight: 700;
  letter-spacing: 6px;
  animation: pulse 1s ease infinite alternate;
}

.winner-subtitle {
  font-size: 13px;
  letter-spacing: 8px;
  color: #f39c12;
}

.new-tournament-btn {
  margin-top: 24px;
  padding: 14px 40px;
  background: transparent;
  border: 1px solid #333;
  color: #666;
  font-size: 11px;
  letter-spacing: 3px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.new-tournament-btn:hover {
  border-color: #fff;
  color: #fff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
  }
}
</style>
