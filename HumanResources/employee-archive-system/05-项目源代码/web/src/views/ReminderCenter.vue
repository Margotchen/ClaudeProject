<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">{{ greeting }}，{{ username }}</div>
      <div class="page-desc">以下是当前待关注的员工提醒事项</div>
    </div>

    <div class="stat-row">
      <BaseCard class="stat-card">
        <div class="stat-value contract">{{ contractReminders.length }}</div>
        <div class="stat-label">合同到期提醒</div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-value anniversary">{{ anniversaryReminders.length }}</div>
        <div class="stat-label">入职周年（{{ anniversaryScope === 'month' ? '本月' : '本周' }}）</div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-value birthday">{{ birthdayReminders.length }}</div>
        <div class="stat-label">生日提醒</div>
      </BaseCard>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="合同到期提醒" name="contract">
        <el-alert
          title="合同到期提醒"
          description="展示当前在职员工中，30 天内即将到期或已逾期的固定期限合同。"
          type="info"
          :closable="false"
          class="reminder-alert"
        />
        <el-skeleton v-if="loading.contract && !contractReminders.length" :rows="5" animated />
        <el-table v-else :data="contractReminders" stripe border v-loading="loading.contract">
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="岗位" width="120" />
          <el-table-column prop="end_date" label="合同到期日" width="120" />
          <el-table-column prop="remaining_days" label="剩余天数" width="100">
            <template #default="{ row }">
              <el-tag :type="tagType(row.level)">{{ row.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="renewal_count" label="续签次数" width="90" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="markHandled(row)">标记已处理</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无合同到期提醒" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="入职周年" name="anniversary">
        <el-radio-group v-model="anniversaryScope" @change="fetchAnniversary">
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
        </el-radio-group>
        <el-skeleton v-if="loading.anniversary && !anniversaryReminders.length" :rows="5" animated class="reminder-table" />
        <el-table v-else :data="anniversaryReminders" stripe border class="reminder-table" v-loading="loading.anniversary">
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="anniversary_date" label="周年日期" width="120" />
          <el-table-column prop="anniversary_years" label="周年数" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_key_year ? 'danger' : 'primary'">{{ row.anniversary_years }} 周年</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="祝福模板" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.template" type="textarea" rows="2" readonly />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="copyTemplate(row.template)">复制</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无入职周年提醒" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="生日提醒" name="birthday">
        <el-skeleton v-if="loading.birthday && !birthdayReminders.length" :rows="5" animated />
        <el-table v-else :data="birthdayReminders" stripe border v-loading="loading.birthday">
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="birthday" label="生日" width="120" />
          <el-table-column prop="birthday_day" label="日期" width="80">
            <template #default="{ row }">{{ row.birthday_month }} 月 {{ row.birthday_day }} 日</template>
          </el-table-column>
          <el-table-column label="祝福模板" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.template" type="textarea" rows="2" readonly />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="copyTemplate(row.template)">复制</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无生日提醒" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import request from '../api/request.js';
import BaseCard from '../components/BaseCard.vue';
import { ElMessage } from 'element-plus';

const username = ref('');
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const activeTab = ref('contract');
const anniversaryScope = ref('month');
const contractReminders = ref([]);
const anniversaryReminders = ref([]);
const birthdayReminders = ref([]);
const templates = ref({ anniversary: [], birthday: [] });
const loading = ref({ contract: false, anniversary: false, birthday: false });

async function fetchContract() {
  loading.value.contract = true;
  try {
    const res = await request.get('/reminders/contract');
    contractReminders.value = res.data;
  } finally {
    loading.value.contract = false;
  }
}

async function fetchAnniversary() {
  loading.value.anniversary = true;
  try {
    const res = await request.get('/reminders/anniversary', { params: { scope: anniversaryScope.value } });
    anniversaryReminders.value = res.data.map(item => ({
      ...item,
      template: templates.value.anniversary[0]?.replace('{n}', item.anniversary_years) || `祝 ${item.name} 入职 ${item.anniversary_years} 周年快乐！`
    }));
  } finally {
    loading.value.anniversary = false;
  }
}

async function fetchBirthday() {
  loading.value.birthday = true;
  try {
    const res = await request.get('/reminders/birthday');
    birthdayReminders.value = res.data.map(item => ({
      ...item,
      template: templates.value.birthday[0]?.replace('{name}', item.name) || `祝 ${item.name} 生日快乐！`
    }));
  } finally {
    loading.value.birthday = false;
  }
}

async function fetchTemplates() {
  const res = await request.get('/reminders/templates');
  templates.value = res.data;
}

function tagType(level) {
  if (level === 'danger') return 'danger';
  if (level === 'warning') return 'warning';
  if (level === 'primary') return 'primary';
  return 'success';
}

function markHandled(row) {
  ElMessage.success(`已将 ${row.name} 的合同到期标记为已处理`);
}

async function copyTemplate(text) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (e) {
    ElMessage.error('复制失败');
  }
}

onMounted(() => {
  try {
    username.value = JSON.parse(localStorage.getItem('user') || '{}').username || '';
  } catch (e) {
    username.value = '';
  }
  fetchTemplates().then(() => {
    fetchContract();
    fetchAnniversary();
    fetchBirthday();
  });
});
</script>

<style scoped>
.page {
  min-height: calc(100vh - 140px);
}
.reminder-alert {
  margin-bottom: 16px;
}
.reminder-table {
  margin-top: 16px;
}
.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  flex: 1;
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
}
.stat-value.contract {
  color: var(--color-danger);
}
.stat-value.anniversary {
  color: var(--color-primary);
}
.stat-value.birthday {
  color: var(--color-warning);
}
.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
