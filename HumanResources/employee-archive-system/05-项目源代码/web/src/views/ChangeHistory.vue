<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工变动历史</span>
          <el-button type="primary" size="small" @click="fetchList">刷新</el-button>
        </div>
      </template>

      <el-form :model="filter" inline class="filter-form">
        <el-form-item label="员工">
          <el-input v-model="filter.employee_id" placeholder="员工 ID" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="变动类型">
          <el-select v-model="filter.change_type" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-skeleton v-if="!listLoaded" :rows="5" animated />
      <template v-else>
      <el-table :data="list" stripe border v-loading="loading">
        <el-table-column prop="operate_time" label="操作时间" width="160" />
        <el-table-column prop="change_type" label="变动类型" width="100" />
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="变更内容" min-width="300">
          <template #default="{ row }">
            <pre class="json-pre">{{ formatChanges(row) }}</pre>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <template #empty>
          <el-empty description="暂无变动记录" :image-size="80" />
        </template>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="fetchList"
        />
      </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import request from '../api/request.js';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const listLoaded = ref(false);
const list = ref([]);
const total = ref(0);
const types = ref([]);

const query = reactive({ page: 1, pageSize: 20 });
const filter = reactive({
  employee_id: '',
  change_type: '',
  dateRange: []
});

async function fetchList() {
  loading.value = true;
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      employee_id: filter.employee_id || undefined,
      change_type: filter.change_type || undefined,
      start_date: filter.dateRange?.[0],
      end_date: filter.dateRange?.[1]
    };
    const res = await request.get('/history', { params });
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    loading.value = false;
    listLoaded.value = true;
  }
}

async function fetchTypes() {
  const res = await request.get('/history/types');
  types.value = res.data;
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  filter.employee_id = '';
  filter.change_type = '';
  filter.dateRange = [];
  query.page = 1;
  fetchList();
}

function formatChanges(row) {
  if (row.before_value && row.after_value) {
    try {
      const changes = JSON.parse(row.remark || '{}');
      return JSON.stringify(changes, null, 2);
    } catch (e) {
      return row.remark || '-';
    }
  }
  return row.remark || '-';
}

onMounted(() => {
  fetchList();
  fetchTypes();
});
</script>

<style scoped>
.page {
  min-height: calc(100vh - 140px);
}
.filter-form {
  margin-bottom: 16px;
}
.json-pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-base);
  padding: 8px;
  border-radius: 4px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
