<template>
  <div class="page-container">
    <div class="page-header">
      <h2>车位管理</h2>
      <el-button type="primary" @click="openDialog()"><Plus /> 新增车位</el-button>
    </div>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="区域">
        <el-select v-model="query.areaId" placeholder="全部区域" clearable @change="loadData">
          <el-option v-for="area in areas" :key="area.id" :label="area.name" :value="area.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.spotType" placeholder="全部类型" clearable @change="loadData">
          <el-option label="固定车位" value="fixed" />
          <el-option label="共享车位" value="shared" />
          <el-option label="访客车位" value="visitor" />
          <el-option label="充电车位" value="charging" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable @change="loadData">
          <el-option label="空闲" value="available" />
          <el-option label="占用" value="occupied" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="query.keyword" placeholder="车位编号" clearable @keyup.enter="loadData" />
      </el-form-item>
      <el-form-item>
        <el-button @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="spots" border v-loading="loading">
      <el-table-column prop="spot_code" label="车位编号" />
      <el-table-column prop="area_name" label="区域" />
      <el-table-column prop="spot_type" label="类型">
        <template #default="{ row }">
          <el-tag :type="typeTagType(row.spot_type)">{{ typeText(row.spot_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="owner_name" label="固定车主" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      class="pagination"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车位' : '新增车位'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="车位编号" prop="spotCode">
          <el-input v-model="form.spotCode" placeholder="例如：A001" />
        </el-form-item>
        <el-form-item label="所属区域" prop="areaId">
          <el-select v-model="form.areaId" placeholder="请选择区域">
            <el-option v-for="area in areas" :key="area.id" :label="area.name" :value="area.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位类型">
          <el-select v-model="form.spotType" placeholder="请选择类型">
            <el-option label="固定车位" value="fixed" />
            <el-option label="共享车位" value="shared" />
            <el-option label="访客车位" value="visitor" />
            <el-option label="充电车位" value="charging" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="空闲" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="坐标 X">
          <el-input-number v-model="form.positionX" />
        </el-form-item>
        <el-form-item label="坐标 Y">
          <el-input-number v-model="form.positionY" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSpots, getAreas, createSpot, updateSpot, deleteSpot } from '@/api/spot';

const loading = ref(false);
const spots = ref([]);
const areas = ref([]);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const currentId = ref(null);

const query = reactive({
  areaId: '',
  spotType: '',
  status: '',
  keyword: '',
  page: 1,
  pageSize: 20
});

const form = reactive({
  spotCode: '',
  areaId: '',
  spotType: 'shared',
  status: 'available',
  positionX: 0,
  positionY: 0
});

const rules = {
  spotCode: [{ required: true, message: '请输入车位编号', trigger: 'blur' }],
  areaId: [{ required: true, message: '请选择区域', trigger: 'change' }]
};

const typeText = (type) => ({
  fixed: '固定车位',
  shared: '共享车位',
  visitor: '访客车位',
  charging: '充电车位'
}[type] || type);

const typeTagType = (type) => ({
  fixed: 'info',
  shared: 'success',
  visitor: 'warning',
  charging: 'primary'
}[type] || '');

const statusText = (status) => ({
  available: '空闲',
  occupied: '占用',
  maintenance: '维护中'
}[status] || status);

const statusTagType = (status) => ({
  available: 'success',
  occupied: 'danger',
  maintenance: 'info'
}[status] || '');

async function loadAreas() {
  const res = await getAreas();
  areas.value = res.data || [];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getSpots(query);
    spots.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openDialog(row = null) {
  isEdit.value = !!row;
  currentId.value = row?.id || null;
  form.spotCode = row?.spot_code || '';
  form.areaId = row?.area_id || '';
  form.spotType = row?.spot_type || 'shared';
  form.status = row?.status || 'available';
  form.positionX = row?.position_x || 0;
  form.positionY = row?.position_y || 0;
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload = {
      spotCode: form.spotCode,
      areaId: form.areaId,
      spotType: form.spotType,
      status: form.status,
      positionX: form.positionX,
      positionY: form.positionY
    };
    if (isEdit.value) {
      await updateSpot(currentId.value, payload);
    } else {
      await createSpot(payload);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该车位吗？', '提示', { type: 'warning' });
    await deleteSpot(row.id);
    ElMessage.success('删除成功');
    await loadData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败');
    }
  }
}

onMounted(async () => {
  await loadAreas();
  await loadData();
});
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
