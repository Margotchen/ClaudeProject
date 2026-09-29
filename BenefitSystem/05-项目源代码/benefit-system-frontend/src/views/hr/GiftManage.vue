<template>
  <div class="gift-manage-page">
    <div class="page-header">
      <h2>礼品库管理</h2>
      <el-button type="primary" @click="openDialog()">新增礼品</el-button>
    </div>

    <el-skeleton v-if="!listLoaded" :rows="5" animated />
    <el-table v-show="listLoaded" :data="gifts" border v-loading="loading">
      <el-table-column prop="gift_name" label="礼品名称" />
      <el-table-column label="主图" width="120">
        <template #default="{ row }">
          <img v-if="row.image_url" :src="row.image_url" style="width: 80px; height: 80px; object-fit: cover" />
        </template>
      </el-table-column>
      <el-table-column prop="specification" label="规格" />
      <el-table-column prop="stock" label="库存" width="100">
        <template #default="{ row }">
          <span :class="{ warning: row.stock <= row.warn_stock }">{{ row.stock }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="warn_stock" label="预警阈值" width="100" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" @click="openStockDialog(row)">库存</el-button>
          <el-button v-if="row.status === 1" size="small" type="warning" @click="changeStatus(row, 0)">下架</el-button>
          <el-button v-else size="small" type="success" @click="changeStatus(row, 1)">上架</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无礼品" :image-size="80" />
      </template>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top: 16px"
    />

    <!-- 礼品表单 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑礼品' : '新增礼品'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="礼品名称" prop="gift_name">
          <el-input v-model="form.gift_name" />
        </el-form-item>
        <el-form-item label="主图 URL">
          <el-input v-model="form.image_url" />
        </el-form-item>
        <el-form-item label="规格描述">
          <el-input v-model="form.specification" />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="form.warn_stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="form.supplier_name" />
        </el-form-item>
        <el-form-item label="供应商联系人">
          <el-input v-model="form.supplier_contact" />
        </el-form-item>
        <el-form-item label="供应商电话">
          <el-input v-model="form.supplier_phone" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库存调整 -->
    <el-dialog v-model="stockDialogVisible" title="库存调整" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前库存">
          <span>{{ currentGift?.stock }}</span>
        </el-form-item>
        <el-form-item label="新库存">
          <el-input-number v-model="newStock" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStockSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGiftList, createGift, updateGift, deleteGift, updateGiftStatus, adjustGiftStock } from '@/api/gift'

const loading = ref(false)
const listLoaded = ref(false)
const gifts = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const stockDialogVisible = ref(false)
const formRef = ref()
const currentGift = ref(null)
const newStock = ref(0)

const form = reactive({
  id: null,
  gift_name: '',
  image_url: '',
  specification: '',
  stock: 0,
  warn_stock: 10,
  supplier_name: '',
  supplier_contact: '',
  supplier_phone: ''
})

const rules = {
  gift_name: [{ required: true, message: '请输入礼品名称', trigger: 'blur' }]
}

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getGiftList(query)
    gifts.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
    listLoaded.value = true
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, {
      id: null,
      gift_name: '',
      image_url: '',
      specification: '',
      stock: 0,
      warn_stock: 10,
      supplier_name: '',
      supplier_contact: '',
      supplier_phone: ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (form.id) {
    await updateGift(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await createGift(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadData()
}

const changeStatus = async (row, status) => {
  await updateGiftStatus(row.id, { status })
  ElMessage.success('操作成功')
  await loadData()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该礼品吗？', '提示', { type: 'warning' })
    await deleteGift(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 取消
  }
}

const openStockDialog = (row) => {
  currentGift.value = row
  newStock.value = row.stock
  stockDialogVisible.value = true
}

const handleStockSubmit = async () => {
  await adjustGiftStock(currentGift.value.id, { stock: newStock.value })
  ElMessage.success('库存调整成功')
  stockDialogVisible.value = false
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

.warning {
  color: #e6a23c;
  font-weight: bold;
}
</style>
