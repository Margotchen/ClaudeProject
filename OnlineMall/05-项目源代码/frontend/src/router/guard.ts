import router from '@/router/index'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user'
import usePermissionStore from '@/stores/permission'
import { useBuyerStore } from '@/stores/buyer'

// 无需登陆的白名单路径
const whiteList = ['/login', '/mall', '/mall/index', '/buyer/login', '/buyer/register', '/buyer/index']

// 判断是否为买家端路由
const isBuyerRoute = (path: string) => {
  return path.startsWith('/buyer')
}

// 配置路由前置守卫函数（每次路由跳转都会执行）
router.beforeEach((to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const buyerStore = useBuyerStore()

  // 买家端路由由买家 token 控制
  if (isBuyerRoute(to.path)) {
    if (to.path === '/buyer/login' || to.path === '/buyer/register' || to.path === '/buyer/index') {
      next()
      NProgress.done()
      return
    }
    if (buyerStore.token) {
      next()
    } else {
      next('/buyer/login')
      NProgress.done()
    }
    return
  }

  if (userStore.userInfo.token) {
    if (to.path === '/login') {
      // 登录状态下访问login直接跳转到首页
      next({ path: '/' })
      NProgress.done()
    } else {
      if (!permissionStore.isGenerated) {
        // 登录状态下无动态路由时根据menus生成动态路由
        permissionStore.generateRoutes({
          menus: userStore.userInfo.menus,
          username: userStore.userInfo.username,
        })
        permissionStore.addRouters.forEach(route => {
          router.addRoute(route)
        })
        next({ ...to, replace: true })
      } else {
        next()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      // 未登录状态下白名单路径放行
      next()
    } else {
      // 未登录状态下非白名单路径跳转到登录页
      next('/login')
      NProgress.done()
    }
  }
})

// 配置路由后置函数守卫函数
router.afterEach(() => {
  NProgress.done()
})
