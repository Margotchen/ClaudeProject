<template>
  <div class="page">
    <el-page-header @back="$router.back()" title="员工详情" />

    <el-row :gutter="20" class="detail-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button type="primary" size="small" @click="editVisible = true">编辑</el-button>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工号">{{ detail.employee?.employee_no }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ detail.employee?.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ detail.employee?.gender === 1 ? '男' : '女' }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ detail.employee?.department }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ detail.employee?.position }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ detail.employee?.entry_date }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ detail.employee?.id_card }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detail.employee?.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detail.employee?.email }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="detail.employee?.status === 1 ? 'success' : 'info'">{{ detail.employee?.status === 1 ? '在职' : '离职' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="紧急联系人">{{ detail.employee?.emergency_contact }}</el-descriptions-item>
            <el-descriptions-item label="紧急电话">{{ detail.employee?.emergency_phone }}</el-descriptions-item>
            <el-descriptions-item label="居住地址" :span="2">{{ detail.employee?.address }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>合同信息</span>
              <el-button type="primary" size="small" @click="contractVisible = true">新增合同</el-button>
            </div>
          </template>
          <el-table :data="detail.contracts" stripe border>
            <el-table-column prop="contract_type" label="合同类型">
              <template #default="{ row }">{{ contractTypeText(row.contract_type) }}</template>
            </el-table-column>
            <el-table-column prop="start_date" label="开始日期" />
            <el-table-column prop="end_date" label="结束日期" />
            <el-table-column prop="renewal_count" label="续签次数" />
            <el-table-column prop="is_current" label="是否当前">
              <template #default="{ row }">
                <el-tag :type="row.is_current ? 'success' : 'info'">{{ row.is_current ? '当前' : '历史' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button v-if="row.is_current && row.contract_type === 1" type="primary" link size="small" @click="handleRenew(row)">续签</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="section-card" title="教育履历">
          <el-table :data="detail.education" stripe border>
            <el-table-column prop="school" label="院校" />
            <el-table-column prop="degree" label="学历" />
            <el-table-column prop="major" label="专业" />
            <el-table-column prop="start_date" label="入学时间" />
            <el-table-column prop="end_date" label="毕业时间" />
          </el-table>
        </el-card>

        <el-card class="section-card" title="工作履历">
          <el-table :data="detail.workExperience" stripe border>
            <el-table-column prop="company" label="公司" />
            <el-table-column prop="position" label="职位" />
            <el-table-column prop="start_date" label="入职时间" />
            <el-table-column prop="end_date" label="离职时间" />
            <el-table-column prop="description" label="工作描述" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card title="最近变动" class="section-card">
          <el-timeline v-if="histories.length">
            <el-timeline-item v-for="h in histories" :key="h.id" :timestamp="h.operate_time">
              <p>{{ h.change_type }}</p>
              <p class="history-remark">{{ h.remark }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无变动记录" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑员工弹窗 -->
    <employee-form v-model="editVisible" :data="detail.employee" @submit="handleEditSubmit" />

    <!-- 新增合同弹窗 -->
    <el-dialog v-model="contractVisible" title="新增合同" width="500px">
      <el-form :model="contractForm" label-width="100px">
        <el-form-item label="合同类型">
          <el-select v-model="contractForm.contract_type" style="width: 100%">
            <el-option label="固定期限" :value="1" />
            <el-option label="无固定期限" :value="2" />
            <el-option label="试用期" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="contractForm.start_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="contractForm.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="contractForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contractVisible = false">取消</el-button>
        <el-button type="primary" @click="handleContractSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 续签弹窗 -->
    <el-dialog v-model="renewVisible" title="合同续签" width="500px">
      <el-form :model="renewForm" label-width="100px">
        <el-form-item label="新开始日期">
          <el-date-picker v-model="renewForm.start_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="新结束日期">
          <el-date-picker v-model="renewForm.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="renewForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenewSubmit">确认续签</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import request from '../api/request.js';
import EmployeeForm from '../components/EmployeeForm.vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const id = route.params.id;

const detail = ref({ employee: {}, contracts: [], education: [], workExperience: [] });
const histories = ref([]);
const editVisible = ref(false);
const contractVisible = ref(false);
const renewVisible = ref(false);
const renewContractId = ref(null);

const contractForm = ref({ contract_type: 1, start_date: '', end_date: '', remark: '' });
const renewForm = ref({ start_date: '', end_date: '', remark: '' });

async function fetchDetail() {
  const res = await request.get(`/employees/${id}`);
  detail.value = res.data;
}

async function fetchHistory() {
  const res = await request.get('/history', { params: { employee_id: id, pageSize: 10 } });
  histories.value = res.data.list;
}

function contractTypeText(type) {
  return type === 1 ? '固定期限' : type === 2 ? '无固定期限' : '试用期';
}

async function handleEditSubmit(data) {
  await request.put(`/employees/${id}`, data);
  ElMessage.success('更新成功');
  editVisible.value = false;
  fetchDetail();
  fetchHistory();
}

async function handleContractSubmit() {
  await request.post('/contracts', { ...contractForm.value, employee_id: Number(id) });
  ElMessage.success('合同创建成功');
  contractVisible.value = false;
  fetchDetail();
  fetchHistory();
}

function handleRenew(row) {
  renewContractId.value = row.id;
  renewForm.value = { start_date: '', end_date: '', remark: '' };
  renewVisible.value = true;
}

async function handleRenewSubmit() {
  await request.post(`/contracts/${renewContractId.value}/renew`, renewForm.value);
  ElMessage.success('续签成功');
  renewVisible.value = false;
  fetchDetail();
  fetchHistory();
}

onMounted(() => {
  fetchDetail();
  fetchHistory();
});
</script>

<style scoped>
.page {
  min-height: calc(100vh - 140px);
}
.detail-row {
  margin-top: 16px;
}
.section-card {
  margin-top: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.history-remark {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
