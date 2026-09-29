<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的车辆</h2>
      <el-button type="primary" @click="openDialog()"><Plus /> 添加车辆</el-button>
    </div>

    <el-skeleton v-if="!listLoaded" :rows="5" animated />
    <el-table v-show="listLoaded" :data="vehicles" border v-loading="loading">
      <el-table-column prop="plate_number" label="车牌号" />
      <el-table-column prop="car_type" label="车型" />
      <el-table-column prop="color" label="颜色" />
      <el-table-column label="默认车辆" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.is_default" type="success">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无车辆，点击右上角添加" :image-size="80" />
      </template>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车辆' : '添加车辆'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="form.plateNumber" placeholder="例如：京A12345" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="车型">
          <el-input v-model="form.carType" placeholder="例如：轿车/SUV" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="form.color" placeholder="例如：白色" />
        </el-form-item>
        <el-form-item label="默认车辆">
          <el-switch v-model="form.isDefault" />
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
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicle';

const loading = ref(false);
const listLoaded = ref(false);
const vehicles = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const currentId = ref(null);

const form = reactive({
  plateNumber: '',
  carType: '',
  color: '',
  isDefault: false
});

const rules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
};

async function loadData() {
  loading.value = true;
  try {
    const res = await getVehicles();
    vehicles.value = res.data || [];
  } finally {
    loading.value = false;
    listLoaded.value = true;
  }
}

function openDialog(row = null) {
  isEdit.value = !!row;
  currentId.value = row?.id || null;
  form.plateNumber = row?.plate_number || '';
  form.carType = row?.car_type || '';
  form.color = row?.color || '';
  form.isDefault = !!row?.is_default;
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateVehicle(currentId.value, {
        carType: form.carType,
        color: form.color,
        isDefault: form.isDefault
      });
    } else {
      await createVehicle({
        plateNumber: form.plateNumber,
        carType: form.carType,
        color: form.color,
        isDefault: form.isDefault
      });
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
    await ElMessageBox.confirm('确定删除该车辆吗？', '提示', { type: 'warning' });
    await deleteVehicle(row.id);
    ElMessage.success('删除成功');
    await loadData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败');
    }
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.page-container {
  background: var(--color-bg-card);
  padding: 24px;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
