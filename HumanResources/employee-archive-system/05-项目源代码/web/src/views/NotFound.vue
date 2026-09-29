<template>
  <div class="not-found">
    <el-empty description="页面不存在或已被移除" :image-size="160">
      <el-button type="primary" @click="$router.replace('/')">返回首页</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-base);
}
</style>
