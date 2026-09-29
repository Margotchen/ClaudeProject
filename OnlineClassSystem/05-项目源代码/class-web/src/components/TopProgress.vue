<template>
  <div v-show="progress.visible" class="top-progress">
    <div class="top-progress-bar" :style="{ width: progress.percent + '%' }" />
  </div>
</template>

<script setup>
import { progress } from '../utils/progress'
</script>

<style lang="scss" scoped>
.top-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 9999;
  pointer-events: none;

  .top-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-end));
    transition: width 0.2s ease;
    box-shadow: 0 0 6px var(--color-primary);
  }
}
</style>
