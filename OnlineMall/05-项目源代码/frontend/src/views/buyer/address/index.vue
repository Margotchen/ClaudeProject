<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { listAddressAPI, addAddressAPI, updateAddressAPI, deleteAddressAPI } from '@/apis/address'
import { useBuyerStore } from '@/stores/buyer'
import type { Address } from '@/types/address'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({
  name: 'BuyerAddress'
})

const router = useRouter()
const buyerStore = useBuyerStore()

const addressList = ref<Address[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增地址')
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm: Address = {
  name: '',
  phoneNumber: '',
  province: '',
  city: '',
  region: '',
  detailAddress: '',
  postCode: '',
  defaultStatus: 0,
}
const form = reactive<Address>({ ...emptyForm })

const rules: FormRules = {
  name: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phoneNumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  region: [{ required: true, message: '请输入区/县', trigger: 'blur' }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

const loadList = async () => {
  if (!buyerStore.token) return
  loading.value = true
  try {
    const res = await listAddressAPI()
    addressList.value = res.data || []
  } catch (err) {
    console.error('加载地址失败:', err)
    ElMessage.error('加载地址失败')
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editingId.value = null
  dialogTitle.value = '新增地址'
  Object.assign(form, emptyForm)
  dialogVisible.value = true
}

const openEdit = (row: Address) => {
  editingId.value = row.id ?? null
  dialogTitle.value = '编辑地址'
  Object.assign(form, { ...emptyForm, ...row })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload: Address = { ...form, defaultStatus: form.defaultStatus ? 1 : 0 }
    if (editingId.value) {
      await updateAddressAPI(editingId.value, payload)
    } else {
      // add 接口不处理默认唯一性，先新增再 update 设默认
      const res = await addAddressAPI({ ...payload, defaultStatus: 0 })
      if (payload.defaultStatus === 1) {
        const listRes = await listAddressAPI()
        const created = (listRes.data || []).find(a =>
          a.name === payload.name && a.phoneNumber === payload.phoneNumber && a.detailAddress === payload.detailAddress
        )
        if (created?.id) {
          await updateAddressAPI(created.id, { ...created, defaultStatus: 1 })
        }
        void res
      }
    }
    ElMessage.success(editingId.value ? '修改成功' : '添加成功')
    dialogVisible.value = false
    loadList()
  } catch (err) {
    console.error('保存地址失败:', err)
    ElMessage.error('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}

const setDefault = async (row: Address) => {
  if (!row.id || row.defaultStatus === 1) return
  try {
    await updateAddressAPI(row.id, { ...row, defaultStatus: 1 })
    ElMessage.success('已设为默认地址')
    loadList()
  } catch (err) {
    console.error('设置默认地址失败:', err)
    ElMessage.error('设置失败，请重试')
  }
}

const removeAddress = async (row: Address) => {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确定删除收货地址「${row.name} ${row.detailAddress}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await deleteAddressAPI(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (err) {
    console.error('删除地址失败:', err)
    ElMessage.error('删除失败，请重试')
  }
}

const goLogin = () => {
  router.push('/buyer/login')
}

onMounted(loadList)
</script>

<template>
  <div class="buyer-address">
    <div v-if="!buyerStore.token" class="login-tip">
      <p>登录后管理收货地址</p>
      <el-button type="primary" @click="goLogin">去登录</el-button>
    </div>

    <template v-else>
      <div class="page-header">
        <h2 class="page-title">收货地址</h2>
        <el-button type="primary" :icon="Plus" @click="openAdd">新增地址</el-button>
      </div>

      <div v-loading="loading" class="address-list">
        <el-empty v-if="addressList.length === 0" description="暂无收货地址" />

        <div v-for="addr in addressList" :key="addr.id" class="address-card">
          <div class="address-header">
            <span class="address-name">{{ addr.name }}</span>
            <span class="address-phone">{{ addr.phoneNumber }}</span>
            <el-tag v-if="addr.defaultStatus === 1" type="danger" size="small" effect="plain">默认</el-tag>
          </div>
          <p class="address-detail">
            {{ addr.province }} {{ addr.city }} {{ addr.region }} {{ addr.detailAddress }}
            <span v-if="addr.postCode" class="post-code">（{{ addr.postCode }}）</span>
          </p>
          <div class="address-actions">
            <el-button v-if="addr.defaultStatus !== 1" size="small" text type="primary"
              @click="setDefault(addr)">设为默认</el-button>
            <el-button size="small" text type="primary" @click="openEdit(addr)">编辑</el-button>
            <el-button size="small" text type="danger" @click="removeAddress(addr)">删除</el-button>
          </div>
        </div>
      </div>
    </template>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="form.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phoneNumber">
          <el-input v-model="form.phoneNumber" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区">
          <div class="region-inputs">
            <el-form-item prop="province" class="region-item">
              <el-input v-model="form.province" placeholder="省份" />
            </el-form-item>
            <el-form-item prop="city" class="region-item">
              <el-input v-model="form.city" placeholder="城市" />
            </el-form-item>
            <el-form-item prop="region" class="region-item">
              <el-input v-model="form.region" placeholder="区/县" />
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2"
            placeholder="街道、楼牌号等详细信息" />
        </el-form-item>
        <el-form-item label="邮编" prop="postCode">
          <el-input v-model="form.postCode" placeholder="选填" maxlength="6" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.defaultStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.buyer-address {
  min-height: 100%;
  padding: 12px;
  background: $buyer-bg;
}

.login-tip {
  text-align: center;
  padding: 60px 0;
  color: $buyer-text-3;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: $buyer-text-1;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-card {
  @include buyer-card;
  padding: 14px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.address-name {
  font-size: 14px;
  font-weight: 600;
  color: $buyer-text-1;
}

.address-phone {
  font-size: 13px;
  color: $buyer-text-3;
}

.address-detail {
  margin: 0 0 8px;
  font-size: 13px;
  color: $buyer-text-2;
  line-height: 1.4;
}

.post-code {
  color: $buyer-text-3;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
}

.region-inputs {
  display: flex;
  gap: 8px;
  width: 100%;
}

.region-item {
  flex: 1;
  margin-bottom: 0;
}

/* PC 端：双列地址卡片 */
@media (min-width: 992px) {
  .buyer-address {
    padding: 16px 0 40px;
  }

  .address-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-items: start;
  }

  .address-list :deep(.el-empty) {
    grid-column: 1 / -1;
  }
}
</style>
