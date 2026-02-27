<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  mode: 'manual' | 'progressive'
}>()

const emit = defineEmits<{ (e: 'toggle-mode'): void; (e: 'next'): void }>()

const modeLabel = computed(() =>
  props.mode === 'manual' ? 'Manual (choose pool)' : 'Progressive (auto adds)'
)
</script>

<template>
  <header class="top">
    <div>
      <p class="eyebrow">Sleep staging trainer</p>
      <h1>Score the epoch</h1>
      <p class="muted">
        {{
          mode === 'manual'
            ? 'Pick which stages stay in the pool, then guess the snapshot.'
            : 'Trainer starts easy and unlocks harder stages as you get answers right.'
        }}
      </p>
    </div>
    <div class="actions">
      <button class="ghost" type="button" @click="emit('next')">Next image</button>
      <button class="mode-switch" type="button" @click="emit('toggle-mode')">
        Mode: {{ modeLabel }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: #7bd4c0;
  margin: 0;
}

h1 {
  margin: 0.1rem 0 0.2rem;
  font-size: 2.4rem;
  letter-spacing: -0.02em;
}

.muted {
  margin: 0;
  color: #a8b8c5;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ghost,
.mode-switch {
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #eaf2f7;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: border-color 150ms ease, transform 120ms ease;
}

.ghost:hover,
.mode-switch:hover {
  border-color: rgba(123, 212, 192, 0.6);
  transform: translateY(-1px);
}
</style>
