<template>
  <div class="base-card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
// 通用卡片组件 - 统一样式与 hover 动效
</script>

<style scoped>
.base-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  overflow: hidden;
}

.base-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-body {
  padding: 20px;
  color: var(--color-text-secondary);
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-base);
}
</style>
