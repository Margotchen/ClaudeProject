import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import EmployeeList from '../views/EmployeeList.vue';
import EmployeeDetail from '../views/EmployeeDetail.vue';
import ReminderCenter from '../views/ReminderCenter.vue';
import OrgChart from '../views/OrgChart.vue';
import ChangeHistory from '../views/ChangeHistory.vue';

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/', redirect: '/employees' },
  { path: '/employees', component: EmployeeList },
  { path: '/employees/:id', component: EmployeeDetail },
  { path: '/reminders', component: ReminderCenter },
  { path: '/org', component: OrgChart },
  { path: '/history', component: ChangeHistory }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) {
    return next('/login');
  }
  if (to.path === '/login' && token) {
    return next('/');
  }
  next();
});

export default router;
