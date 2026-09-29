<template>
  <div class="address-page">
    <div class="page-header">
      <h2>地址管理</h2>
      <el-button type="primary" @click="openDialog()">新增地址</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="5" animated />

    <el-empty v-else-if="!addresses.length" description="暂无收货地址" :image-size="80" />

    <el-card v-for="addr in addresses" :key="addr.id" class="address-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ addr.receiver }} {{ addr.phone }}</span>
          <el-tag v-if="addr.is_default" type="success">默认</el-tag>
        </div>
      </template>

      <p>{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail_address }}</p>

      <div class="actions">
        <el-button size="small" @click="openDialog(addr)">编辑</el-button>
        <el-button size="small" type="danger" @click="handleDelete(addr.id)">删除</el-button>
        <el-button v-if="!addr.is_default" size="small" type="success" @click="setDefault(addr.id)">设为默认</el-button>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑地址' : '新增地址'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="form.receiver" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="form.province" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="form.city" />
        </el-form-item>
        <el-form-item label="区县" prop="district">
          <el-input v-model="form.district" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail_address">
          <el-input v-model="form.detail_address" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="form.is_default" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAddressList, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/api/address'

const addresses = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail_address: '',
  is_default: 0
})

const rules = {
  receiver: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  detail_address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

onMounted(() => {
  loadData()
})

const loadData = async () => {
  try {
    const res = await getAddressList()
    addresses.value = res.data || []
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, {
      id: null,
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
      is_default: 0
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (form.id) {
    await updateAddress(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await createAddress(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadData()
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该地址吗？', '提示', { type: 'warning' })
    await deleteAddress(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 取消
  }
}

const setDefault = async (id) => {
  await setDefaultAddress(id)
  ElMessage.success('设置成功')
  await loadData()
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.address-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  margin-top: 12px;
}
</style>
