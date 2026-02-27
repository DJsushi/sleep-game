<script setup lang="ts">
import type { StageKey, StageMeta } from '../stageCatalog'

const props = defineProps<{
  stages: StageMeta[]
  enabledStages: Record<StageKey, boolean>
  lastGuess: StageKey | null
  currentImageExists: boolean
  feedback: string
  poolEmpty: boolean
  allowToggle: boolean
  mode: 'manual' | 'progressive'
  unlockThreshold: number
  unlockedCount: number
  totalStages: number
}>()

const emit = defineEmits<{
  (e: 'toggle', stageKey: StageKey): void
  (e: 'guess', stageKey: StageKey): void
  (e: 'shuffle'): void
}>()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div>
        <p class="eyebrow">Stages</p>
        <p class="muted" v-if="allowToggle">Toggle a stage out of the pool, then guess.</p>
        <p class="muted" v-else>Trainer unlocks harder stages as you score correctly.</p>
      </div>
      <button class="ghost" type="button" @click="emit('shuffle')">Shuffle</button>
    </div>

    <div class="stage-list">
      <div v-for="stage in stages" :key="stage.key" class="stage-row">
        <button
          class="toggle"
          type="button"
          :aria-pressed="enabledStages[stage.key]"
          :disabled="!allowToggle"
          @click="emit('toggle', stage.key)"
        >
          <span class="toggle-dot" :class="{ on: enabledStages[stage.key] }" />
          <span class="toggle-label">{{ enabledStages[stage.key] ? 'On' : 'Off' }}</span>
        </button>

        <button
          class="stage-btn"
          type="button"
          :class="{
            disabled: !enabledStages[stage.key],
            active: lastGuess === stage.key,
            [`stage-${stage.key}`]: true,
          }"
          :disabled="!enabledStages[stage.key] || !currentImageExists"
          @click="emit('guess', stage.key)"
        >
          {{ stage.label }}
        </button>
      </div>
    </div>

    <p class="hint" v-if="allowToggle">Left toggle removes the stage from the draw pool.</p>
    <p class="hint" v-else>New stages unlock every {{ unlockThreshold }} correct answers.</p>

    <div v-if="feedback" class="feedback">{{ feedback }}</div>
    <div v-else-if="poolEmpty" class="feedback warning">Enable at least one stage.</div>

    <div v-if="mode === 'progressive'" class="progress">
      <div class="bar">
        <span class="fill" :style="{ width: `${(unlockedCount / totalStages) * 100}%` }" />
      </div>
      <p class="muted small">{{ unlockedCount }} / {{ totalStages }} stages unlocked</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  background: rgba(15, 27, 44, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: #7bd4c0;
  margin: 0;
}

.muted {
  margin: 0;
  color: #a8b8c5;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.stage-row {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 0.6rem;
  align-items: center;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #eaf2f7;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}

.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toggle:hover:enabled {
  border-color: rgba(123, 212, 192, 0.5);
}

.toggle-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #7bd4c0;
  background: transparent;
  transition: background 150ms ease, box-shadow 150ms ease;
}

.toggle-dot.on {
  background: #7bd4c0;
  box-shadow: 0 0 0 4px rgba(123, 212, 192, 0.2);
}

.toggle-label {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.stage-btn {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: linear-gradient(120deg, rgba(69, 116, 224, 0.22), rgba(12, 191, 173, 0.3));
  color: #f4f8fb;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 120ms ease, border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
}

.stage-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(123, 212, 192, 0.6);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.stage-btn:disabled,
.stage-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stage-btn.active {
  border-color: #7bd4c0;
  box-shadow: 0 0 0 3px rgba(123, 212, 192, 0.25);
}

.stage-btn.stage-wake {
  background: linear-gradient(120deg, rgba(255, 205, 86, 0.18), rgba(17, 111, 255, 0.25));
}

.stage-btn.stage-rem {
  background: linear-gradient(120deg, rgba(255, 138, 128, 0.18), rgba(0, 205, 172, 0.3));
}

.stage-btn.stage-n1 {
  background: linear-gradient(120deg, rgba(108, 99, 255, 0.22), rgba(0, 200, 255, 0.22));
}

.stage-btn.stage-n2 {
  background: linear-gradient(120deg, rgba(73, 207, 173, 0.2), rgba(255, 192, 76, 0.24));
}

.stage-btn.stage-n3 {
  background: linear-gradient(120deg, rgba(28, 176, 146, 0.3), rgba(30, 60, 114, 0.4));
}

.hint {
  margin: 0.2rem 0;
  color: #a8b8c5;
  font-size: 0.9rem;
}

.feedback {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: rgba(123, 212, 192, 0.12);
  border: 1px solid rgba(123, 212, 192, 0.3);
  color: #eaf2f7;
  font-weight: 600;
}

.feedback.warning {
  background: rgba(255, 205, 86, 0.12);
  border-color: rgba(255, 205, 86, 0.4);
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #7bd4c0, #64a9ff);
}

.small {
  font-size: 0.85rem;
}

.ghost {
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

.ghost:hover {
  border-color: rgba(123, 212, 192, 0.6);
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .stage-row {
    grid-template-columns: 1fr;
  }

  .toggle {
    justify-content: space-between;
  }
}
</style>
