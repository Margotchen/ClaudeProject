import { createRouter, createWebHistory } from 'vue-router';
import { startProgress, finishProgress } from '../utils/progress';

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/employees',
    children: [
      { path: 'employees', component: () => import('../views/EmployeeList.vue') },
      { path: 'employees/:id', component: () => import('../views/EmployeeDetail.vue') },
      { path: 'reminders', component: () => import('../views/ReminderCenter.vue') },
      { path: 'org', component: () => import('../views/OrgChart.vue') },
      { path: 'history', component: () => import('../views/ChangeHistory.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue'), meta: { public: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  startProgress();
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) {
    return next('/login');
  }
  if (to.path === '/login' && token) {
    return next('/');
  }
  next();
});

router.afterEach(() => {
  finishProgress();
});

export default router;
