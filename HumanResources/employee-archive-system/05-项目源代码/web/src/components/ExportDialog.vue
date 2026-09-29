<template>
  <el-dialog v-model="visible" title="导出花名册" width="500px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="导出格式">
        <el-radio-group v-model="form.format">
          <el-radio label="xlsx">Excel</el-radio>
          <el-radio label="pdf">PDF</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="导出字段">
        <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
        <el-checkbox-group v-model="form.fields" @change="handleCheckedChange">
          <el-checkbox v-for="f in allFields" :key="f.key" :label="f.key">{{ f.label }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="文件名">
        <el-input v-model="form.filename" placeholder="花名册_YYYYMMDD_部门" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleExport">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  filter: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'export']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const allFields = [
  { key: 'employee_no', label: '工号' },
  { key: 'name', label: '姓名' },
  { key: 'gender', label: '性别' },
  { key: 'department', label: '部门' },
  { key: 'position', label: '岗位' },
  { key: 'id_card', label: '身份证号' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱' },
  { key: 'entry_date', label: '入职日期' },
  { key: 'status', label: '在职状态' },
  { key: 'emergency_contact', label: '紧急联系人' },
  { key: 'emergency_phone', label: '紧急联系电话' },
  { key: 'address', label: '居住地址' }
];

const allKeys = allFields.map(f => f.key);

const form = ref({
  format: 'xlsx',
  fields: [...allKeys],
  filename: ''
});

const checkAll = ref(true);
const isIndeterminate = ref(false);

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value.fields = [...allKeys];
    checkAll.value = true;
    isIndeterminate.value = false;
  }
});

function handleCheckAllChange(val) {
  form.value.fields = val ? [...allKeys] : [];
  isIndeterminate.value = false;
}

function handleCheckedChange(value) {
  const checkedCount = value.length;
  checkAll.value = checkedCount === allKeys.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < allKeys.length;
}

function handleExport() {
  if (form.value.fields.length === 0) {
    return;
  }
  emit('export', { ...form.value, filter: props.filter });
}
</script>
