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
    children: [
      // Passenger routes
      {
        path: '/passenger/search',
        component: () => import('@/views/passenger/FlightSearch.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/detail/:id',
        component: () => import('@/views/passenger/FlightDetail.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/booking/:scheduleId',
        component: () => import('@/views/passenger/Booking.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/orders',
        component: () => import('@/views/passenger/MyOrders.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/order/:id',
        component: () => import('@/views/passenger/OrderDetail.vue'),
        meta: { roles: ['passenger', 'service', 'operator'] }
      },
      {
        path: '/passenger/pay/:orderId',
        component: () => import('@/views/passenger/Payment.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/checkin/:orderId',
        component: () => import('@/views/passenger/CheckIn.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/itinerary/:orderId',
        component: () => import('@/views/passenger/Itinerary.vue'),
        meta: { roles: ['passenger'] }
      },
      {
        path: '/passenger/refund-change/:orderId',
        component: () => import('@/views/passenger/RefundChange.vue'),
        meta: { roles: ['passenger'] }
      },
      // Service routes
      {
        path: '/service/refunds',
        component: () => import('@/views/service/RefundChangeHandle.vue'),
        meta: { roles: ['service', 'operator'] }
      },
      {
        path: '/service/orders',
        component: () => import('@/views/service/PassengerOrders.vue'),
        meta: { roles: ['service', 'operator'] }
      },
      // Operator routes
      {
        path: '/operator/flights',
        component: () => import('@/views/operator/FlightManage.vue'),
        meta: { roles: ['operator'] }
      },
      {
        path: '/operator/status',
        component: () => import('@/views/operator/FlightStatusManage.vue'),
        meta: { roles: ['operator'] }
      },
      {
        path: '/operator/dashboard',
        component: () => import('@/views/operator/Dashboard.vue'),
        meta: { roles: ['operator'] }
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

const defaultHomeByRole = {
  service: '/service/refunds',
  operator: '/operator/dashboard',
  passenger: '/passenger/search'
}

const KNOWN_ROLES = ['passenger', 'service', 'operator']

export function getHomeByRole(roleCode) {
  return defaultHomeByRole[roleCode] || null
}

function isKnownRole(roleCode) {
  return KNOWN_ROLES.includes(roleCode)
}

function redirectToLogin(next, to, options = {}) {
  const query = {}
  if (to.path !== '/login') {
    query.redirect = to.fullPath
  }
  if (options.error) {
    query.error = options.error
  }
  return next({ path: '/login', query, replace: true })
}

router.beforeEach(async (to, from, next) => {
  if (to.path !== from.path) startProgress()
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.isLoggedIn && isKnownRole(userStore.roleCode)) {
      const home = getHomeByRole(userStore.roleCode)
      if (home && to.path !== home) {
        return next({ path: home, replace: true })
      }
    }
    return next()
  }

  if (!userStore.isLoggedIn) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      return redirectToLogin(next, to)
    }
  }

  if (!userStore.isLoggedIn || !isKnownRole(userStore.roleCode)) {
    userStore.clearSession?.()
    return redirectToLogin(next, to, { error: 'role' })
  }

  if (to.path === '/') {
    const home = getHomeByRole(userStore.roleCode)
    return next({ path: home, replace: true })
  }

  if (to.meta.roles && !to.meta.roles.includes(userStore.roleCode)) {
    const home = getHomeByRole(userStore.roleCode)
    return next({ path: home, replace: true })
  }

  next()
})

router.afterEach(() => {
  finishProgress()
})

router.onError(() => {
  finishProgress()
})

export default router
