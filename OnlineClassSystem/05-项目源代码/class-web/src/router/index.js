import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../store/user'
import { getToken } from '../utils/auth'
import { startProgress, finishProgress } from '../utils/progress'

export const routes = [
  {
    path: '/login',
    component: () => import('../views/login/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
      },
      {
        path: 'system/user',
        component: () => import('../views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['ADMIN'] }
      },
      {
        path: 'course/list',
        component: () => import('../views/course/list/index.vue'),
        meta: { title: '课程管理', icon: 'Reading', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'course/center',
        component: () => import('../views/course/center/index.vue'),
        meta: { title: '课程中心', icon: 'Collection', roles: ['STUDENT', 'HEAD_TEACHER'] }
      },
      {
        path: 'live/schedule',
        component: () => import('../views/live/schedule/index.vue'),
        meta: { title: '直播排课', icon: 'VideoCamera', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER'] }
      },
      {
        path: 'live/monitor',
        component: () => import('../views/live/monitor/index.vue'),
        meta: { title: '课堂监督', icon: 'View', roles: ['ADMIN', 'HEAD_TEACHER'] }
      },
      {
        path: 'live/playback',
        component: () => import('../views/live/playback/index.vue'),
        meta: { title: '课程录播', icon: 'Film', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
      },
      {
        path: 'study/schedule',
        component: () => import('../views/study/schedule/index.vue'),
        meta: { title: '我的课表', icon: 'Calendar', roles: ['STUDENT'] }
      },
      {
        path: 'study/homework',
        component: () => import('../views/study/homework/index.vue'),
        meta: { title: '作业考试', icon: 'EditPen', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
      },
      {
        path: 'study/exam/:examId',
        component: () => import('../views/study/exam/index.vue'),
        meta: { title: '在线考试', hidden: true, roles: ['STUDENT'] }
      },
      {
        path: 'live/room/:scheduleId',
        component: () => import('../views/live/room/index.vue'),
        meta: { title: '直播教室', hidden: true, roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
      },
      {
        path: 'stats',
        component: () => import('../views/stats/index.vue'),
        meta: { title: '学习统计', icon: 'DataAnalysis', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
      }
    ]
  },
  {
    path: '/403',
    component: () => import('../views/error/403.vue'),
    meta: { title: '无权限' }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const WHITE_LIST = ['/login', '/403', '/404']

router.beforeEach(async (to) => {
  startProgress()
  const token = getToken()
  if (WHITE_LIST.includes(to.path)) {
    // 已登录访问登录页时回到首页
    return to.path === '/login' && token ? '/' : true
  }
  if (!token) {
    return '/login'
  }
  const userStore = useUserStore()
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      userStore.logout()
      return '/login'
    }
  }
  // 角色鉴权：meta.roles 不含当前角色则回工作台
  if (to.meta.roles && !to.meta.roles.includes(userStore.roleCode)) {
    return '/dashboard'
  }
  return true
})

router.afterEach(() => {
  finishProgress()
})

export default router
