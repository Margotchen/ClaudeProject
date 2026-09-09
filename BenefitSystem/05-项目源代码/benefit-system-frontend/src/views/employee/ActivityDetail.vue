<template>
  <div class="activity-detail-page" v-loading="loading">
    <el-page-header @back="goBack" title="活动详情" />

    <el-card class="info-card" v-if="activity">
      <template #header>
        <span>{{ activity.activity_name }}</span>
      </template>
      <p><strong>类型：</strong>{{ activity.activity_type }}</p>
      <p><strong>时间：</strong>{{ formatTime(activity.start_time) }} 至 {{ formatTime(activity.end_time) }}</p>
      <p><strong>每人限选：</strong>{{ activity.limit_count }} 件</p>
      <p><strong>说明：</strong>{{ activity.description || '无' }}</p>
    </el-card>

    <el-alert
      v-if="existingApply"
      title="您已申领该活动，重新提交将覆盖原申领记录"
      type="warning"
      :closable="false"
      style="margin-top: 16px"
    />

    <el-alert
      v-if="isActivityClosed"
      title="该活动已结束或已停用，无法提交或修改申领"
      type="error"
      :closable="false"
      style="margin-top: 16px"
    />

    <el-card class="gift-card" v-if="activity">
      <template #header>
        <span>选择礼品（已选 {{ selectedCount }}/{{ activity.limit_count }} 件）</span>
      </template>

      <el-alert v-if="selectedCount > activity.limit_count" title="超出每人限选数量" type="error" :closable="false" />

      <el-row :gutter="20">
        <el-col :span="8" v-for="gift in gifts" :key="gift.id" class="gift-col">
          <el-card shadow="hover" :class="{ disabled: gift.stock <= 0 || gift.status !== 1 }"
          >
            <img v-if="gift.image_url" :src="gift.image_url" class="gift-image" />
            <div class="gift-info">
              <h4>{{ gift.gift_name }}</h4>
              <p class="spec">{{ gift.specification }}</p>
              <p class="stock" :class="{ warning: gift.stock <= gift.warn_stock }">
                剩余库存：{{ gift.stock }}
              </p>
            </div>

            <el-input-number
              v-model="selectedMap[gift.id]"
              :min="0"
              :max="giftMax(gift)"
              :disabled="gift.stock <= 0 || gift.status !== 1 || isActivityClosed"
              style="width: 100%"
            />
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="address-card" v-if="activity">
      <template #header>
        <span>选择收货地址</span>
      </template>

      <el-radio-group v-model="selectedAddressId" :disabled="isActivityClosed">
        <el-radio-button v-for="addr in addresses" :key="addr.id" :label="addr.id">
          {{ addr.receiver }} {{ addr.phone }} {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail_address }}
          <el-tag v-if="addr.is_default" type="success" size="small">默认</el-tag>
        </el-radio-button>
      </el-radio-group>

      <el-empty v-if="!addresses.length" description="暂无收货地址，请先到地址管理添加" />
    </el-card>

    <div class="submit-bar" v-if="!isActivityClosed">
      <el-button type="primary" size="large" :disabled="!canSubmit" @click="submit">
        {{ existingApply ? '覆盖提交' : '提交申领' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getActivityDetail, getActivityGifts } from '@/api/activity'
import { getAddressList } from '@/api/address'
import { submitApply, getMyApplyList } from '@/api/apply'

const route = useRoute()
const router = useRouter()
const activityId = Number(route.params.id)

const loading = ref(false)
const activity = ref(null)
const gifts = ref([])
const addresses = ref([])
const selectedMap = ref({})
const selectedAddressId = ref(null)
const existingApply = ref(null)

const selectedCount = computed(() => {
  return Object.values(selectedMap.value).reduce((sum, val) => sum + (val || 0), 0)
})

const isActivityClosed = computed(() => {
  if (!activity.value) return false
  const now = new Date()
  const endTime = new Date(activity.value.end_time)
  return activity.value.status !== 1 || now > endTime
})

const canSubmit = computed(() => {
  return !!activity.value
    && selectedCount.value > 0
    && selectedCount.value <= activity.value.limit_count
    && selectedAddressId.value != null
    && !isActivityClosed.value
})

const giftMax = (gift) => {
  if (!activity.value) return 0
  const current = selectedMap.value[gift.id] || 0
  const remaining = activity.value.limit_count - selectedCount.value + current
  return Math.min(gift.stock, remaining)
}

onMounted(async () => {
  loading.value = true
  try {
    const [activityRes, giftsRes, addressRes, applyRes] = await Promise.all([
      getActivityDetail(activityId),
      getActivityGifts(activityId),
      getAddressList(),
      getMyApplyList({ page: 1, pageSize: 1000 })
    ])
    activity.value = activityRes.data
    gifts.value = giftsRes.data || []
    addresses.value = addressRes.data || []

    const applyList = applyRes.data?.list || []
    existingApply.value = applyList.find(a => a.activity_id === activityId && a.apply_status !== 4) || null

    // 初始化礼品选择 map
    gifts.value.forEach(gift => {
      selectedMap.value[gift.id] = 0
    })

    // 回填已有申领数据（礼品数量）
    if (existingApply.value) {
      existingApply.value.items?.forEach(item => {
        selectedMap.value[item.gift_id] = item.quantity
      })
    }

    // 使用默认地址
    const defaultAddr = addresses.value.find(a => a.is_default)
    if (defaultAddr) selectedAddressId.value = defaultAddr.id
  } finally {
    loading.value = false
  }
})

const submit = async () => {
  const items = Object.entries(selectedMap.value)
    .filter(([, quantity]) => quantity > 0)
    .map(([giftId, quantity]) => ({ giftId: Number(giftId), quantity }))

  if (existingApply.value) {
    try {
      await ElMessageBox.confirm(
        '您已存在该活动的申领单，提交后将覆盖原有礼品、地址和物流信息，是否继续？',
        '覆盖确认',
        { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  try {
    await submitApply({
      activityId,
      addressId: selectedAddressId.value,
      items
    })
    ElMessage.success(existingApply.value ? '修改成功' : '申领成功')
    router.push('/employee/my-apply')
  } catch (err) {
    ElMessage.error(err.message || '申领失败')
  }
}

const goBack = () => {
  router.back()
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}
</script>

<style scoped>
.activity-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.info-card,
.gift-card,
.address-card {
  margin-top: 20px;
}

.gift-col {
  margin-bottom: 20px;
}

.gift-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.gift-info h4 {
  margin-bottom: 8px;
}

.spec {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.stock {
  color: #67c23a;
  font-size: 13px;
  margin-bottom: 12px;
}

.stock.warning {
  color: #e6a23c;
}

.disabled {
  opacity: 0.6;
}

.submit-bar {
  margin-top: 24px;
  text-align: center;
}

.submit-bar .el-button {
  width: 200px;
}
</style>
