<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">课堂监督</div>
      <div class="page-desc">查看正在直播的课堂，进入后仅可旁听监督（互动区只读）</div>
    </div>

    <BaseCard>
      <div class="toolbar">
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px" @change="loadData">
          <el-option label="直播中" :value="1" />
          <el-option label="未开始" :value="0" />
          <el-option label="已结束" :value="2" />
        </el-select>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
      <el-table v-else v-loading="loading" :data="tableData" stripe>
        <template #empty><el-empty description="暂无进行中的直播" :image-size="80" /></template>
        <el-table-column prop="liveTitle" label="直播主题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="courseName" label="所属课程" min-width="130" show-overflow-tooltip />
        <el-table-column prop="teacherName" label="讲师" width="100" />
        <el-table-column prop="startTime" label="开播时间" width="170" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="{ 0: 'info', 1: 'danger', 2: 'success' }[row.status]">
              {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="enterRoom(row)">进入监督</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @change="loadData"
      />
    </BaseCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageSchedules } from '../../../api/live'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, status: 1 })

async function loadData() {
  loading.value = true
  try {
    const data = await pageSchedules(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function enterRoom(row) {
  router.push(`/live/room/${row.id}?mode=monitor`)
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
