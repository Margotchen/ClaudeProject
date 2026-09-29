import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { startProgress, finishProgress } from '@/utils/progress'
import Login from '@/views/login/index.vue'
import Layout from '@/components/Layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/employee/hall',
    children: [
      // 员工端
      {
        path: 'employee/hall',
        component: () => import('@/views/employee/Hall.vue'),
        meta: { roles: ['employee', 'hr', 'admin'] }
      },
      {
        path: 'employee/activity/:id',
        component: () => import('@/views/employee/ActivityDetail.vue'),
        meta: { roles: ['employee', 'hr', 'admin'] }
      },
      {
        path: 'employee/my-apply',
        component: () => import('@/views/employee/MyApply.vue'),
        meta: { roles: ['employee', 'hr', 'admin'] }
      },
      {
        path: 'employee/address',
        component: () => import('@/views/employee/AddressManage.vue'),
        meta: { roles: ['employee', 'hr', 'admin'] }
      },
      // HR 端
      {
        path: 'hr/dashboard',
        component: () => import('@/views/hr/Dashboard.vue'),
        meta: { roles: ['hr', 'admin'] }
      },
      {
        path: 'hr/activity',
        component: () => import('@/views/hr/ActivityManage.vue'),
        meta: { roles: ['hr', 'admin'] }
      },
      {
        path: 'hr/gift',
        component: () => import('@/views/hr/GiftManage.vue'),
        meta: { roles: ['hr', 'admin'] }
      },
      {
        path: 'hr/apply',
        component: () => import('@/views/hr/ApplyManage.vue'),
        meta: { roles: ['hr', 'admin'] }
      },
      {
        path: 'hr/export',
        component: () => import('@/views/hr/ExportCenter.vue'),
        meta: { roles: ['hr', 'admin'] }
      },
      // 管理员端
      {
        path: 'admin/user',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'admin/role',
        component: () => import('@/views/admin/RoleManage.vue'),
        meta: { roles: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  startProgress()
  const userStore = useUserStore()

  if (to.meta.public) {
    return next()
  }

  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      userStore.logout()
      return next('/login')
    }
  }

  const role = userStore.roleCode
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    return next('/')
  }

  next()
})

router.afterEach(() => {
  finishProgress()
})

export default router
