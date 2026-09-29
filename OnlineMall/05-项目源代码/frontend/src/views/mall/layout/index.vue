<script setup lang="ts">
import { RouterView } from 'vue-router'

defineOptions({
  name: 'MallLayout'
})
</script>

<template>
  <div class="mall-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.mall-layout {
  min-height: 100vh;
  background-color: #f4f4f4;
}
</style>
