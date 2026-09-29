<template>
  <el-select v-model="currentLocale" style="width: 100px" size="small">
    <el-option label="中文" value="zh-CN" />
    <el-option label="English" value="en-US" />
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
import { locale, setLocale } from '@/locales'

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => setLocale(val)
})
</script>
