<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReturnApplyByIdAPI, returnApplyHandleAPI } from '@/apis/returnApply'
import { formatDateTime } from '@/utils/datetime'
import type { OmsOrderReturnApply, ReturnApplyHandleParam } from '@/types/returnApply'

// 路由相关
const route = useRoute()
const router = useRouter()

// 当前售后申请ID
const id = ref()
// 当前售后申请
const orderReturnApply = ref({} as OmsOrderReturnApply)
// 凭证图片
const proofPics = ref<string[]>([])
// 售后商品列表
const productList = ref()
// 处理意见
const handleRemark = ref('')
// 获取详情
const getDetail = async () => {
  const res = await getReturnApplyByIdAPI(id.value)
  orderReturnApply.value = res.data
  productList.value = []
  productList.value.push(orderReturnApply.value)
  if (orderReturnApply.value.proofPics) {
    proofPics.value = orderReturnApply.value.proofPics.split(",")
  }
  handleRemark.value = orderReturnApply.value.handleRemark || ''
}

// 组件挂载
onMounted(() => {
  id.value = route.query.id
  getDetail()
})

// 计算属性
const totalAmount = computed(() => {
  if (orderReturnApply.value != null) {
    return orderReturnApply.value.productRealPrice * orderReturnApply.value.productCount
  } else {
    return 0
  }
})

// 格式化状态（0-待处理 1-已通过 2-已完成 3-已驳回）
const formatStatus = (status: number) => {
  if (status === 0) {
    return "待处理"
  } else if (status === 1) {
    return "已通过"
  } else if (status === 2) {
    return "已完成"
  } else {
    return "已驳回"
  }
}

// 格式化售后类型
const formatReturnType = (returnType?: number) => {
  const map: Record<number, string> = { 1: '退货', 2: '退款' }
  return map[returnType || 1] || '退货'
}

// 查看订单详情
const handleViewOrder = () => {
  router.push({ path: '/oms/orderDetail', query: { id: orderReturnApply.value.orderId } })
}

// 审核售后申请（通过/驳回）
const handleUpdateStatus = async (status: number) => {
  await ElMessageBox.confirm('是否要进行此操作?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  const param: ReturnApplyHandleParam = {
    applyId: Number(id.value),
    status: status,
    handleRemark: handleRemark.value,
  }
  await returnApplyHandleAPI(param)
  ElMessage({
    type: 'success',
    message: '操作成功!',
    duration: 1000
  })
  router.back()
}


</script>

<template>
  <div class="detail-container">
    <el-card shadow="never">
      <span class="font-title-medium">退货商品</span>
      <el-table border class="standard-margin" ref="productTable" :data="productList">
        <el-table-column label="商品图片" width="160" align="center">
          <template #default="scope">
            <img style="height:80px" :src="scope.row.productPic">
          </template>
        </el-table-column>
        <el-table-column label="商品名称" align="center">
          <template #default="scope">
            <span class="font-small">{{ scope.row.productName }}</span><br>
            <span class="font-small">品牌：{{ scope.row.productBrand }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格/货号" width="180" align="center">
          <template #default="scope">
            <span class="font-small">价格：￥{{ scope.row.productRealPrice }}</span><br>
            <span class="font-small">货号：NO.{{ scope.row.productId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="属性" width="180" align="center">
          <template #default="scope">{{ scope.row.productAttr }}</template>
        </el-table-column>
        <el-table-column label="数量" width="100" align="center">
          <template #default="scope">{{ scope.row.productCount }}</template>
        </el-table-column>
        <el-table-column label="小计" width="100" align="center">
          <template>￥{{ totalAmount }}</template>
        </el-table-column>
      </el-table>
      <div style="float:right;margin-top:15px;margin-bottom:15px">
        <span class="font-title-medium">合计：</span>
        <span class="font-title-medium color-danger">￥{{ totalAmount }}</span>
      </div>
    </el-card>
    <el-card shadow="never" class="standard-margin">
      <span class="font-title-medium">服务单信息</span>
      <div class="form-container-border">
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">服务单号</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.id }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">申请状态</el-col>
          <el-col class="form-border font-small" :span="18">{{ formatStatus(orderReturnApply.status) }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">售后类型</el-col>
          <el-col class="form-border font-small" :span="18">{{ formatReturnType(orderReturnApply.returnType) }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small" style="height:50px;line-height:30px">订单编号
          </el-col>
          <el-col class="form-border font-small" :span="18" style="height:50px">
            {{ orderReturnApply.orderSn }}
            <el-button type="text" size="small" @click="handleViewOrder">查看</el-button>
          </el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">申请时间</el-col>
          <el-col class="form-border font-small" :span="18">{{ formatDateTime(orderReturnApply.createTime) }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">用户账号</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.memberUsername }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">联系人</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.returnName }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">联系电话</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.returnPhone }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">退货原因</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.reason }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">问题描述</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.description }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6" style="height:100px;line-height:80px">凭证图片
          </el-col>
          <el-col class="form-border font-small" :span="18" style="height:100px">
            <img v-for="item in proofPics" style="width:80px;height:80px" :src="item" :key="item">
          </el-col>
        </el-row>
      </div>
      <div class="form-container-border" v-show="orderReturnApply.status !== 0">
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">处理人员</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.handleMan }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">处理时间</el-col>
          <el-col class="form-border font-small" :span="18">{{ formatDateTime(orderReturnApply.handleTime) }}</el-col>
        </el-row>
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6">处理意见</el-col>
          <el-col class="form-border font-small" :span="18">{{ orderReturnApply.handleRemark || '无' }}</el-col>
        </el-row>
      </div>
      <div class="form-container-border" v-show="orderReturnApply.status === 0">
        <el-row>
          <el-col class="form-border form-left-bg font-small" :span="6"
            style="height:52px;line-height:32px">处理意见</el-col>
          <el-col class="form-border font-small" :span="18">
            <el-input size="small" v-model="handleRemark"
              style="width:300px;margin-left: 10px"></el-input>
          </el-col>
        </el-row>
      </div>
      <div style="margin-top:15px;text-align: center" v-show="orderReturnApply.status === 0">
        <el-button type="primary" size="small" @click="handleUpdateStatus(1)">
          同意{{ orderReturnApply.returnType === 2 ? '退款' : '退货' }}
        </el-button>
        <el-button type="danger" size="small" @click="handleUpdateStatus(2)">
          拒绝{{ orderReturnApply.returnType === 2 ? '退款' : '退货' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.detail-container {
  position: absolute;
  left: 0;
  right: 0;
  width: 1080px;
  padding: 35px 35px 15px 35px;
  margin: 20px auto;
}

.standard-margin {
  margin-top: 15px;
}

.form-border {
  border-right: 1px solid #DCDFE6;
  border-bottom: 1px solid #DCDFE6;
  padding: 10px;
}

.form-container-border {
  border-left: 1px solid #DCDFE6;
  border-top: 1px solid #DCDFE6;
  margin-top: 15px;
}

.form-left-bg {
  background: #F2F6FC;
}
</style>
