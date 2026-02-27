<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import StageSidebar from './components/StageSidebar.vue'
import ViewerPane from './components/ViewerPane.vue'
import {
  catalog,
  stageLabels,
  stageMeta,
  type CatalogEntry,
  type StageKey,
  progressiveOrder,
  unlockThreshold,
} from './stageCatalog'

const mode = ref<'manual' | 'progressive'>('manual')

const manualEnabled = ref<Record<StageKey, boolean>>({
  wake: true,
  rem: true,
  n1: true,
  n2: true,
  n3: true,
})

const progressiveUnlocked = ref<Set<StageKey>>(new Set(progressiveOrder.slice(0, 2)))
const unlockPointer = ref(2)
const progressiveCorrect = ref(0)

const stageScores = ref<Record<StageKey, number>>({
  wake: 0,
  rem: 0,
  n1: 0,
  n2: 0,
  n3: 0,
})

const enabledStages = computed<Record<StageKey, boolean>>(() => {
  if (mode.value === 'manual') return manualEnabled.value

  const map: Record<StageKey, boolean> = {
    wake: false,
    rem: false,
    n1: false,
    n2: false,
    n3: false,
  }

  stageMeta.forEach((stage) => {
    map[stage.key] = progressiveUnlocked.value.has(stage.key)
  })

  return map
})

const currentImage = ref<CatalogEntry | null>(null)
const lastGuess = ref<StageKey | null>(null)
const feedback = ref('')

const imagesByStage = computed<Record<StageKey, CatalogEntry[]>>(() => {
  const map: Record<StageKey, CatalogEntry[]> = {
    wake: [],
    rem: [],
    n1: [],
    n2: [],
    n3: [],
  }

  catalog.forEach((entry) => {
    map[entry.stageKey].push(entry)
  })

  return map
})

const candidateStages = computed(() =>
  stageMeta.filter(
    (stage) => enabledStages.value[stage.key] && imagesByStage.value[stage.key].length > 0
  )
)

const poolEmpty = computed(() => candidateStages.value.length === 0)

const unlockedCount = computed(() => {
  if (mode.value === 'manual') {
    return stageMeta.filter((stage) => manualEnabled.value[stage.key]).length
  }
  return progressiveUnlocked.value.size
})

const pickRandomImage = () => {
  lastGuess.value = null
  feedback.value = ''

  if (poolEmpty.value) {
    currentImage.value = null
    feedback.value = 'Enable at least one stage to draw a new card.'
    return
  }

  const weights = candidateStages.value.map((stage) => Math.exp(stageScores.value[stage.key]))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * total
  let pickedStage: StageKey = candidateStages.value[0].key

  for (let i = 0; i < candidateStages.value.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) {
      pickedStage = candidateStages.value[i].key
      break
    }
  }

  const stageImages = imagesByStage.value[pickedStage]
  const choice = stageImages[Math.floor(Math.random() * stageImages.length)]
  currentImage.value = choice
  stageScores.value[pickedStage] -= 1
}

const toggleStage = (stageKey: StageKey) => {
  if (mode.value !== 'manual') return

  manualEnabled.value[stageKey] = !manualEnabled.value[stageKey]

  if (currentImage.value && !manualEnabled.value[currentImage.value.stageKey]) {
    pickRandomImage()
  }
}

const unlockNextStage = () => {
  if (unlockPointer.value >= progressiveOrder.length) return
  const nextStage = progressiveOrder[unlockPointer.value]
  progressiveUnlocked.value = new Set([...progressiveUnlocked.value, nextStage])
  unlockPointer.value += 1
}

const handleGuess = (stageKey: StageKey) => {
  if (!currentImage.value) return

  lastGuess.value = stageKey
  const isCorrect = stageKey === currentImage.value.stageKey

  feedback.value = isCorrect
    ? `Nice call — that is ${stageLabels[currentImage.value.stageKey]}.`
    : `Not this time. It was ${stageLabels[currentImage.value.stageKey]}.`

  if (mode.value === 'progressive' && isCorrect) {
    progressiveCorrect.value += 1
    if (
      progressiveCorrect.value % unlockThreshold === 0 &&
      unlockPointer.value < progressiveOrder.length
    ) {
      unlockNextStage()
    }
  }
}

const resetProgressive = () => {
  progressiveUnlocked.value = new Set(progressiveOrder.slice(0, 2))
  unlockPointer.value = 2
  progressiveCorrect.value = 0
  stageScores.value = {
    wake: 0,
    rem: 0,
    n1: 0,
    n2: 0,
    n3: 0,
  }
}

const handleModeToggle = () => {
  mode.value = mode.value === 'manual' ? 'progressive' : 'manual'
  feedback.value = ''
  lastGuess.value = null

  stageScores.value = {
    wake: 0,
    rem: 0,
    n1: 0,
    n2: 0,
    n3: 0,
  }

  if (mode.value === 'progressive') {
    resetProgressive()
  }

  pickRandomImage()
}

onMounted(() => {
  pickRandomImage()
})
</script>

<template>
  <div class="shell">
    <HeaderBar :mode="mode" @toggle-mode="handleModeToggle" @next="pickRandomImage" />

    <main class="layout">
      <ViewerPane :current-image="currentImage" />

      <StageSidebar
        :stages="stageMeta"
        :enabled-stages="enabledStages"
        :last-guess="lastGuess"
        :current-image-exists="Boolean(currentImage)"
        :feedback="feedback"
        :pool-empty="poolEmpty"
        :allow-toggle="mode === 'manual'"
        :mode="mode"
        :unlock-threshold="unlockThreshold"
        :unlocked-count="unlockedCount"
        :total-stages="stageMeta.length"
        @toggle="toggleStage"
        @guess="handleGuess"
        @shuffle="pickRandomImage"
      />
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

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1.5rem;
  min-height: 70vh;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .shell {
    padding: 1.25rem 1rem 2rem;
  }
}
</style>
