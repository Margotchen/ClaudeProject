<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑员工' : '新增员工'" width="700px" destroy-on-close>
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="工号" prop="employee_no">
            <el-input v-model="form.employee_no" :disabled="isEdit" placeholder="请输入工号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别">
            <el-radio-group v-model="form.gender">
              <el-radio :label="1">男</el-radio>
              <el-radio :label="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="form.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="岗位">
            <el-input v-model="form.position" placeholder="请输入岗位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职日期" prop="entry_date">
            <el-date-picker v-model="form.entry_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="身份证号">
            <el-input v-model="form.id_card" placeholder="请输入身份证号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="在职状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="在职" :value="1" />
              <el-option label="离职" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="紧急联系人">
        <el-input v-model="form.emergency_contact" placeholder="请输入紧急联系人" />
      </el-form-item>
      <el-form-item label="紧急电话">
        <el-input v-model="form.emergency_phone" placeholder="请输入紧急联系电话" />
      </el-form-item>
      <el-form-item label="居住地址">
        <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入居住地址" />
      </el-form-item>

      <el-divider content-position="left">合同信息（可选）</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同类型">
            <el-select v-model="form.contract.contract_type" style="width: 100%" placeholder="请选择">
              <el-option label="固定期限" :value="1" />
              <el-option label="无固定期限" :value="2" />
              <el-option label="试用期" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开始日期">
            <el-date-picker v-model="form.contract.start_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="结束日期">
            <el-date-picker v-model="form.contract.end_date" type="date" value-format="YYYY-MM-DD" placeholder="无固定期限可不填" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注">
            <el-input v-model="form.contract.remark" placeholder="合同备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  data: { type: Object, default: () => null }
});

const emit = defineEmits(['update:modelValue', 'submit']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isEdit = computed(() => !!props.data?.id);
const formRef = ref(null);

const defaultContract = () => ({
  contract_type: 1,
  start_date: '',
  end_date: '',
  remark: ''
});

const form = ref({
  employee_no: '',
  name: '',
  gender: 1,
  department: '',
  position: '',
  id_card: '',
  phone: '',
  email: '',
  entry_date: '',
  status: 1,
  emergency_contact: '',
  emergency_phone: '',
  address: '',
  contract: defaultContract()
});

const rules = {
  employee_no: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  entry_date: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
};

watch(() => props.data, (val) => {
  if (val) {
    form.value = {
      ...val,
      contract: val.contract || defaultContract()
    };
  } else {
    form.value = {
      employee_no: '',
      name: '',
      gender: 1,
      department: '',
      position: '',
      id_card: '',
      phone: '',
      email: '',
      entry_date: '',
      status: 1,
      emergency_contact: '',
      emergency_phone: '',
      address: '',
      contract: defaultContract()
    };
  }
}, { immediate: true });

function handleSubmit() {
  formRef.value.validate((valid) => {
    if (!valid) return;
    emit('submit', { ...form.value });
  });
}
</script>
