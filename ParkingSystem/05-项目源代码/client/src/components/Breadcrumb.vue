<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="item in crumbs" :key="item.path">
      {{ item.meta?.title || item.name }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 过滤掉布局壳路由，只展示带标题的业务页面
const crumbs = computed(() =>
  route.matched.filter((item) => item.meta?.title)
);
</script>
