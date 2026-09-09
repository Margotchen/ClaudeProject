<template>
  <div class="page">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="合同到期提醒" name="contract">
        <el-alert
          title="合同到期提醒"
          description="展示当前在职员工中，30 天内即将到期或已逾期的固定期限合同。"
          type="info"
          :closable="false"
          class="reminder-alert"
        />
        <el-table :data="contractReminders" stripe border v-loading="loading.contract">
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
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="入职周年" name="anniversary">
        <el-radio-group v-model="anniversaryScope" @change="fetchAnniversary">
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
        </el-radio-group>
        <el-table :data="anniversaryReminders" stripe border class="reminder-table" v-loading="loading.anniversary">
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
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="生日提醒" name="birthday">
        <el-table :data="birthdayReminders" stripe border v-loading="loading.birthday">
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
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request.js';
import { ElMessage } from 'element-plus';

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
</style>
