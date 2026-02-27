<script setup lang="ts">
import type { CatalogEntry } from '../stageCatalog'

defineProps<{
  currentImage: CatalogEntry | null
}>()
</script>

<template>
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
</template>

<style scoped>
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

.muted {
  margin: 0;
  color: #a8b8c5;
}
</style>
