<template>
  <div class="page-container">
    <div class="page-header">
      <h2>系统配置</h2>
    </div>

    <el-table :data="configs" border v-loading="loading">
      <el-table-column prop="config_key" label="配置项" />
      <el-table-column prop="description" label="说明" />
      <el-table-column prop="config_value" label="当前值">
        <template #default="{ row }">
          <el-input v-if="editing[row.config_key]" v-model="row._tempValue" />
          <span v-else>{{ row.config_value }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <template v-if="editing[row.config_key]">
            <el-button size="small" type="primary" @click="saveConfig(row)">保存</el-button>
            <el-button size="small" @click="cancelEdit(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="startEdit(row)">编辑</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getConfigs, updateConfig } from '@/api/config';

const loading = ref(false);
const configs = ref([]);
const editing = reactive({});

async function loadData() {
  loading.value = true;
  try {
    const res = await getConfigs();
    configs.value = (res.data || []).map(c => ({ ...c, _tempValue: c.config_value }));
  } finally {
    loading.value = false;
  }
}

function startEdit(row) {
  row._tempValue = row.config_value;
  editing[row.config_key] = true;
}

function cancelEdit(row) {
  editing[row.config_key] = false;
  row._tempValue = row.config_value;
}

async function saveConfig(row) {
  try {
    await updateConfig(row.config_key, row._tempValue);
    row.config_value = row._tempValue;
    editing[row.config_key] = false;
    ElMessage.success('保存成功');
  } catch (err) {
    ElMessage.error(err.message || '保存失败');
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
</style>
