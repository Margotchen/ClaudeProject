<template>
  <el-card class="stat-card" :body-style="{ padding: '20px' }">
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </el-card>
</template>

<script setup>
defineProps({
  value: [String, Number],
  label: String
});
</script>

<style scoped lang="scss">
.stat-card {
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    color: var(--color-text-placeholder);
  }
}
</style>
