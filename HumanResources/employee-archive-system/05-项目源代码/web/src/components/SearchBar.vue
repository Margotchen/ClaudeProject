<template>
  <el-form :model="form" inline class="search-bar">
    <el-form-item label="关键词">
      <el-input v-model="form.keyword" placeholder="姓名 / 工号" clearable @keyup.enter="handleSearch" />
    </el-form-item>
    <el-form-item label="部门">
      <el-select v-model="form.department" placeholder="全部部门" clearable style="width: 160px">
        <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
      </el-select>
    </el-form-item>
    <el-form-item label="状态">
      <el-select v-model="form.status" placeholder="全部状态" clearable style="width: 120px">
        <el-option label="在职" :value="1" />
        <el-option label="离职" :value="2" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  departments: { type: Array, default: () => [] }
});

const emit = defineEmits(['search', 'reset']);

const form = reactive({
  keyword: '',
  department: '',
  status: 1
});

function handleSearch() {
  emit('search', { ...form });
}

function handleReset() {
  form.keyword = '';
  form.department = '';
  form.status = 1;
  emit('reset', { ...form });
}

watch(() => props.departments, () => {}, { immediate: true });
</script>

<style scoped>
.search-bar {
  background: #fff;
  padding: 18px;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
