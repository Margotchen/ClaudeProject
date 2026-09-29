<template>
  <TopProgress />
  <router-view v-slot="{ Component }">
    <transition name="fade-slide" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import TopProgress from './components/TopProgress.vue'
</script>
