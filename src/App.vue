<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type StageKey = 'wake' | 'rem' | 'n1' | 'n2' | 'n3'

const stages = [
  { key: 'wake', label: 'Wake' },
  { key: 'rem', label: 'REM' },
  { key: 'n1', label: 'N1' },
  { key: 'n2', label: 'N2' },
  { key: 'n3', label: 'N3' },
] as const

type CatalogEntry = {
  stageKey: StageKey
  fileName: string
  src: string
}

const stageLabels = stages.reduce<Record<StageKey, string>>((acc, stage) => {
  acc[stage.key] = stage.label
  return acc
}, {
  wake: 'Wake',
  rem: 'REM',
  n1: 'N1',
  n2: 'N2',
  n3: 'N3',
})

const detectStageKey = (fileName: string): StageKey | null => {
  const lower = fileName.toLowerCase()
  if (lower.startsWith('w-')) return 'wake'
  if (lower.startsWith('r-')) return 'rem'
  if (lower.startsWith('n1-')) return 'n1'
  if (lower.startsWith('n2-')) return 'n2'
  if (lower.startsWith('n3-')) return 'n3'
  return null
}

const imageModules = import.meta.glob('../sleep-imgs/*.{png,jpg,jpeg}', {
  eager: true,
  as: 'url',
}) as Record<string, string>

const catalog: CatalogEntry[] = Object.entries(imageModules).flatMap(
  ([path, src]) => {
    const fileName = path.split('/').pop() || ''
    const stageKey = detectStageKey(fileName)

    if (!stageKey) return []

    return [
      {
        stageKey,
        fileName,
        src,
      },
    ]
  }
)

const enabledStages = ref<Record<StageKey, boolean>>({
  wake: true,
  rem: true,
  n1: true,
  n2: true,
  n3: true,
})

const currentImage = ref<CatalogEntry | null>(null)
const lastGuess = ref<StageKey | null>(null)
const feedback = ref('')

const availablePool = computed(() =>
  catalog.filter((entry) => enabledStages.value[entry.stageKey])
)

const poolEmpty = computed(() => availablePool.value.length === 0)

const pickRandomImage = () => {
  lastGuess.value = null
  feedback.value = ''

  if (poolEmpty.value) {
    currentImage.value = null
    feedback.value = 'Enable at least one stage to draw a new card.'
    return
  }

  const choice =
    availablePool.value[Math.floor(Math.random() * availablePool.value.length)]
  currentImage.value = choice
}

const toggleStage = (stageKey: StageKey) => {
  enabledStages.value[stageKey] = !enabledStages.value[stageKey]

  if (currentImage.value && !enabledStages.value[currentImage.value.stageKey]) {
    pickRandomImage()
  }
}

const handleGuess = (stageKey: StageKey) => {
  if (!currentImage.value) return

  lastGuess.value = stageKey
  const isCorrect = stageKey === currentImage.value.stageKey

  feedback.value = isCorrect
    ? `Nice call — that is ${stageLabels[currentImage.value.stageKey]}.`
    : `Not this time. It was ${stageLabels[currentImage.value.stageKey]}.`
}

onMounted(() => {
  pickRandomImage()
})
</script>

<template>
  <div class="shell">
    <header class="top">
      <div>
        <p class="eyebrow">Sleep staging trainer</p>
        <h1>Score the epoch</h1>
        <p class="muted">Pick the sleep stage that matches the PSG snapshot.</p>
      </div>
      <button class="ghost" type="button" @click="pickRandomImage">Next image</button>
    </header>

    <main class="layout">
      <section class="viewer">
        <div class="frame" :class="{ empty: !currentImage }">
          <img
            v-if="currentImage"
            :src="currentImage.src"
            :alt="`PSG snapshot ${currentImage.fileName}`"
          />
          <div v-else class="placeholder">
            <p class="muted">No image available. Add PSG screenshots to sleep-imgs.</p>
          </div>
        </div>
        <p v-if="currentImage" class="filename">File: {{ currentImage.fileName }}</p>
      </section>

      <aside class="sidebar">
        <div class="sidebar-header">
          <div>
            <p class="eyebrow">Stages</p>
            <p class="muted">Toggle a stage out of the pool, then guess with the main button.</p>
          </div>
          <button class="ghost" type="button" @click="pickRandomImage">Shuffle</button>
        </div>

        <div class="stage-list">
          <div v-for="stage in stages" :key="stage.key" class="stage-row">
            <button
              class="toggle"
              type="button"
              :aria-pressed="enabledStages[stage.key]"
              @click="toggleStage(stage.key)"
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
              :disabled="!enabledStages[stage.key] || !currentImage"
              @click="handleGuess(stage.key)"
            >
              {{ stage.label }}
            </button>
          </div>
        </div>

        <p class="hint">Left toggle removes the stage from the draw pool.</p>

        <div v-if="feedback" class="feedback">{{ feedback }}</div>
        <div v-else-if="poolEmpty" class="feedback warning">Enable at least one stage.</div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 3rem;
  color: #eaf2f7;
}

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

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1.5rem;
  min-height: 70vh;
}

.viewer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  background: radial-gradient(circle at 20% 20%, rgba(123, 212, 192, 0.08), rgba(19, 31, 45, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0d1622;
}

.frame.empty {
  border-style: dashed;
}

.placeholder {
  padding: 1rem 1.5rem;
  text-align: center;
}

.filename {
  margin: 0;
  color: #7bd4c0;
  font-size: 0.95rem;
}

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

.toggle:hover {
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

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .frame {
    min-height: 360px;
  }
}

@media (max-width: 720px) {
  .shell {
    padding: 1.25rem 1rem 2rem;
  }

  .stage-row {
    grid-template-columns: 1fr;
  }

  .toggle {
    justify-content: space-between;
  }
}
</style>
