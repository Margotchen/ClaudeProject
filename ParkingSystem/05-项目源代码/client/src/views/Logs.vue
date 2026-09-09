<template>
  <div class="page-container">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="模块">
        <el-select v-model="query.module" placeholder="全部模块" clearable @change="loadData">
          <el-option label="登录" value="auth" />
          <el-option label="用户" value="user" />
          <el-option label="车辆" value="vehicle" />
          <el-option label="车位" value="spot" />
          <el-option label="预约" value="reservation" />
          <el-option label="违约" value="violation" />
          <el-option label="配置" value="config" />
          <el-option label="定时任务" value="scheduler" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="logs" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="created_at" label="时间" />
      <el-table-column prop="real_name" label="操作人" />
      <el-table-column prop="module" label="模块" />
      <el-table-column prop="action" label="动作" />
      <el-table-column prop="detail" label="详情" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP" />
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getLogs } from '@/api/log';

const loading = ref(false);
const logs = ref([]);
const total = ref(0);
const query = reactive({
  module: '',
  page: 1,
  pageSize: 20
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getLogs(query);
    logs.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
