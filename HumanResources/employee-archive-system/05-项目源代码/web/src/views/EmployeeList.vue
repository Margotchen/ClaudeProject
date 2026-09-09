<template>
  <div class="page">
    <search-bar :departments="departments" @search="handleSearch" @reset="handleReset" />

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>员工档案列表</span>
          <div class="actions">
            <el-button type="primary" @click="handleAdd">新增员工</el-button>
            <el-button @click="exportDialogVisible = true">导出花名册</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe border @sort-change="handleSort">
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/employees/${row.id}`)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="70">
          <template #default="{ row }">{{ row.gender === 1 ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column prop="entry_date" label="入职日期" width="120" sortable="custom" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '在职' : '离职' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          @change="fetchList"
        />
      </div>
    </el-card>

    <employee-form v-model="formVisible" :data="currentRow" @submit="handleFormSubmit" />
    <export-dialog v-model="exportDialogVisible" :filter="query" @export="handleExport" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import request from '../api/request.js';
import SearchBar from '../components/SearchBar.vue';
import EmployeeForm from '../components/EmployeeForm.vue';
import ExportDialog from '../components/ExportDialog.vue';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const departments = ref([]);
const formVisible = ref(false);
const exportDialogVisible = ref(false);
const currentRow = ref(null);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  department: '',
  status: 1,
  sortField: 'entry_date',
  sortOrder: 'desc'
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await request.get('/employees', { params: query });
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    loading.value = false;
  }
}

async function fetchDepartments() {
  const res = await request.get('/employees/options/departments');
  departments.value = res.data;
}

function handleSearch(form) {
  query.page = 1;
  query.keyword = form.keyword;
  query.department = form.department;
  query.status = form.status ?? 1;
  fetchList();
}

function handleReset(form) {
  query.page = 1;
  query.keyword = form.keyword;
  query.department = form.department;
  query.status = form.status;
  fetchList();
}

function handleSort({ prop, order }) {
  query.sortField = prop || 'entry_date';
  query.sortOrder = order === 'ascending' ? 'asc' : 'desc';
  fetchList();
}

function handleAdd() {
  currentRow.value = null;
  formVisible.value = true;
}

function handleEdit(row) {
  currentRow.value = row;
  formVisible.value = true;
}

async function handleFormSubmit(data) {
  try {
    if (data.id || currentRow.value?.id) {
      await request.put(`/employees/${currentRow.value.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/employees', data);
      ElMessage.success('创建成功');
    }
    formVisible.value = false;
    fetchList();
  } catch (e) {
    ElMessage.error(e.message);
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除员工 ${row.name} 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/employees/${row.id}`);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
}

async function handleExport({ format, fields, filename, filter }) {
  try {
    const params = {
      format,
      fields: fields.join(','),
      filename,
      keyword: filter.keyword,
      department: filter.department,
      status: filter.status
    };
    const response = await request.get('/export/employees', {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([response], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || '花名册'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    exportDialogVisible.value = false;
    ElMessage.success('导出成功');
  } catch (e) {
    ElMessage.error('导出失败：' + e.message);
  }
}

watch(() => [query.page, query.pageSize], fetchList, { immediate: false });

onMounted(() => {
  fetchList();
  fetchDepartments();
});
</script>

<style scoped>
.page {
  min-height: calc(100vh - 140px);
}
.table-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  gap: 10px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
