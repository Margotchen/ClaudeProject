<template>
  <el-config-provider :locale="elementLocale">
    <TopProgress />
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { locale } from '@/locales'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import TopProgress from '@/components/TopProgress.vue'

const elementLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCn : en
})
</script>
