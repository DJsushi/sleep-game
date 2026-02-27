export type StageKey = 'wake' | 'rem' | 'n1' | 'n2' | 'n3'

export type StageMeta = {
  key: StageKey
  label: string
}

export const stageMeta: StageMeta[] = [
  { key: 'wake', label: 'Wake' },
  { key: 'rem', label: 'REM' },
  { key: 'n1', label: 'N1' },
  { key: 'n2', label: 'N2' },
  { key: 'n3', label: 'N3' },
]

export const stageLabels: Record<StageKey, string> = stageMeta.reduce((acc, stage) => {
  acc[stage.key] = stage.label
  return acc
}, {} as Record<StageKey, string>)

export type CatalogEntry = {
  stageKey: StageKey
  fileName: string
  src: string
}

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

export const catalog: CatalogEntry[] = Object.entries(imageModules).flatMap(
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

export const progressiveOrder: StageKey[] = ['rem', 'n3', 'wake', 'n2', 'n1']
export const unlockThreshold = 5
