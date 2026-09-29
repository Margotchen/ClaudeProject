<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div>
        <i style="margin-top: 5px" class="el-icon-search"></i>
        <span style="margin-top: 5px">筛选搜索</span>
        <el-button
          style="float: right"
          type="primary"
          size="small"
          @click="handleSearchList()"
        >
          查询
        </el-button>
        <el-button
          style="float: right; margin-right: 15px"
          size="small"
          @click="handleResetSearch()"
        >
          重置
        </el-button>
      </div>
      <div style="margin-top: 15px">
        <el-form :inline="true" :model="listQuery" size="small">
          <el-form-item label="店铺名称：">
            <el-input
              v-model="listQuery.keyword"
              placeholder="请输入店铺名称"
              style="width: 200px"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="operate-container">
      <i class="el-icon-tickets"></i>
      <span>数据列表</span>
      <el-button
        size="small"
        class="btn-add"
        @click="handleAdd()"
        style="float: right"
      >添加</el-button>
    </el-card>

    <div class="table-container">
      <el-skeleton v-if="!listLoaded" :rows="5" animated />
      <el-table v-show="listLoaded"
        ref="merchantTable"
        :data="list"
        style="width: 100%"
        v-loading="listLoading"
        border
      >
        <el-table-column label="编号" width="80" align="center">
          <template #default="scope">{{ scope.row.id }}</template>
        </el-table-column>
        <el-table-column label="店铺名称" align="center">
          <template #default="scope">{{ scope.row.shopName }}</template>
        </el-table-column>
        <el-table-column label="联系人" width="120" align="center">
          <template #default="scope">{{ scope.row.contactName }}</template>
        </el-table-column>
        <el-table-column label="联系电话" width="140" align="center">
          <template #default="scope">{{ scope.row.contactPhone }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            >
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
              <template #empty><el-empty :image-size="80" description="暂无数据" /></template>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[5, 10, 15]"
        :current-page.sync="listQuery.pageNum"
        :page-size.sync="listQuery.pageSize"
        :total="total"
      >
      </el-pagination>
    </div>

    <el-dialog :title="isEdit ? '编辑商家' : '添加商家'" v-model="dialogVisible" width="40%">
      <el-form :model="merchantForm" ref="merchantFormRef" label-width="150px" size="small">
        <el-form-item label="店铺名称：">
          <el-input v-model="merchantForm.shopName" style="width: 250px"></el-input>
        </el-form-item>
        <el-form-item label="联系人：">
          <el-input v-model="merchantForm.contactName" style="width: 250px"></el-input>
        </el-form-item>
        <el-form-item label="联系电话：">
          <el-input v-model="merchantForm.contactPhone" style="width: 250px"></el-input>
        </el-form-item>
        <el-form-item label="状态：">
          <el-radio-group v-model="merchantForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="handleDialogConfirm()" size="small">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchList,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} from '@/apis/merchant'
import { formatDateTime } from '@/utils/datetime'

const listQuery = reactive({
  keyword: '',
  pageNum: 1,
  pageSize: 5,
})

const list = ref<any[]>([])
const total = ref(0)
const listLoading = ref(false)
const listLoaded = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const merchantForm = reactive({
  id: undefined as number | undefined,
  shopName: '',
  contactName: '',
  contactPhone: '',
  status: 1,
})

const getList = async () => {
  listLoading.value = true
  try {
    const res = await fetchList(listQuery)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    listLoading.value = false
    listLoaded.value = true
  }
}

const handleSearchList = () => {
  listQuery.pageNum = 1
  getList()
}

const handleResetSearch = () => {
  listQuery.keyword = ''
  listQuery.pageNum = 1
  getList()
}

const handleSizeChange = (val: number) => {
  listQuery.pageNum = 1
  listQuery.pageSize = val
  getList()
}

const handleCurrentChange = (val: number) => {
  listQuery.pageNum = val
  getList()
}

const handleAdd = () => {
  isEdit.value = false
  merchantForm.id = undefined
  merchantForm.shopName = ''
  merchantForm.contactName = ''
  merchantForm.contactPhone = ''
  merchantForm.status = 1
  dialogVisible.value = true
}

const handleUpdate = (row: any) => {
  isEdit.value = true
  merchantForm.id = row.id
  merchantForm.shopName = row.shopName
  merchantForm.contactName = row.contactName
  merchantForm.contactPhone = row.contactPhone
  merchantForm.status = row.status
  dialogVisible.value = true
}

const handleDialogConfirm = async () => {
  try {
    if (isEdit.value && merchantForm.id) {
      await updateMerchant(merchantForm.id, merchantForm)
      ElMessage.success('修改成功！')
    } else {
      await createMerchant(merchantForm)
      ElMessage.success('添加成功！')
    }
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('是否要删除该商家？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteMerchant(row.id)
    ElMessage.success('删除成功！')
    getList()
  })
}

const handleStatusChange = async (row: any) => {
  await updateMerchant(row.id, { status: row.status })
  ElMessage.success('状态修改成功！')
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.operate-container {
  margin-top: 20px;
}
.table-container {
  margin-top: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
.btn-add {
  margin-left: 20px;
}
</style>
