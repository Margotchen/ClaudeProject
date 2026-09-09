import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据看板' } },
      { path: 'parking-map', name: 'ParkingMap', component: () => import('@/views/ParkingMap.vue'), meta: { title: '车位地图' } },
      { path: 'my-reservations', name: 'MyReservation', component: () => import('@/views/MyReservation.vue'), meta: { title: '我的预约' } },
      { path: 'my-vehicles', name: 'MyVehicle', component: () => import('@/views/MyVehicle.vue'), meta: { title: '我的车辆' } },
      { path: 'reservations', name: 'ReservationManage', component: () => import('@/views/ReservationManage.vue'), meta: { title: '预约管理', roles: ['parking_admin', 'system_admin'] } },
      { path: 'spots', name: 'SpotManage', component: () => import('@/views/SpotManage.vue'), meta: { title: '车位管理', roles: ['parking_admin', 'system_admin'] } },
      { path: 'violations', name: 'ViolationManage', component: () => import('@/views/ViolationManage.vue'), meta: { title: '违约管理', roles: ['parking_admin', 'system_admin'] } },
      { path: 'statistics', name: 'Statistics', component: () => import('@/views/Statistics.vue'), meta: { title: '统计报表', roles: ['parking_admin', 'system_admin'] } },
      { path: 'users', name: 'UserManage', component: () => import('@/views/UserManage.vue'), meta: { title: '用户管理', roles: ['system_admin'] } },
      { path: 'system-config', name: 'SystemConfig', component: () => import('@/views/SystemConfig.vue'), meta: { title: '系统配置', roles: ['system_admin'] } },
      { path: 'logs', name: 'Logs', component: () => import('@/views/Logs.vue'), meta: { title: '操作日志', roles: ['system_admin'] } }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = !!userStore.token;

  if (to.meta.public) {
    if (isAuthenticated && to.path === '/login') {
      return next('/dashboard');
    }
    return next();
  }

  if (!isAuthenticated) {
    return next('/login');
  }

  if (to.meta.roles && !to.meta.roles.includes(userStore.userInfo.role)) {
    return next('/dashboard');
  }

  next();
});

export default router;
