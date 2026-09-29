<template>
  <div class="page-container">
    <div class="page-header">
      <h2>违约管理</h2>
    </div>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable @change="loadData">
          <el-option label="有效" value="active" />
          <el-option label="已减免" value="pardoned" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="query.keyword" placeholder="用户名/姓名/单号" clearable @keyup.enter="loadData" />
      </el-form-item>
      <el-form-item>
        <el-button @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-skeleton v-if="!listLoaded" :rows="5" animated />
    <el-table v-show="listLoaded" :data="violations" border v-loading="loading">
      <el-table-column prop="reservation_no" label="预约单号" />
      <el-table-column prop="real_name" label="用户" />
      <el-table-column prop="reserve_date" label="预约日期" />
      <el-table-column prop="time_slot" label="时段">
        <template #default="{ row }">{{ slotText(row.time_slot) }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="违约原因" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'danger' : 'info'">{{ row.status === 'active' ? '有效' : '已减免' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="记录时间" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'active'"
            size="small"
            type="success"
            @click="handlePardon(row)"
          >减免</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无违约记录" :image-size="80" />
      </template>
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
import { ElMessage } from 'element-plus';
import { getViolations, pardonViolation } from '@/api/violation';

const loading = ref(false);
const listLoaded = ref(false);
const violations = ref([]);
const total = ref(0);
const query = reactive({
  status: '',
  keyword: '',
  page: 1,
  pageSize: 20
});

function slotText(slot) {
  return {
    morning: '上午',
    afternoon: '下午',
    all_day: '全天'
  }[slot];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getViolations(query);
    violations.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
    listLoaded.value = true;
  }
}

async function handlePardon(row) {
  try {
    await pardonViolation(row.id);
    ElMessage.success('减免成功');
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '减免失败');
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.page-container {
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
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
