import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
import OwnerDashboard from '../views/OwnerDashboard.vue'

const sectionRedirect = (hash) => ({ path: '/', hash })

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 64, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    { path: '/', component: HomeView },
    { path: '/predictions', redirect: () => sectionRedirect('#packages') },
    { path: '/packages', redirect: () => sectionRedirect('#packages') },
    { path: '/results', redirect: () => sectionRedirect('#results') },
    { path: '/about', redirect: () => sectionRedirect('#about') },
    { path: '/login', component: HomeView, meta: { guest: true, dialog: 'login' } },
    { path: '/register', component: HomeView, meta: { guest: true, dialog: 'register' } },
    { path: '/account', component: HomeView, meta: { auth: true, dialog: 'account' } },
    { path: '/admin/login', component: AdminLoginView, meta: { adminGuest: true } },
    { path: '/admin', component: OwnerDashboard, meta: { owner: true } },
    { path: '/owner', redirect: '/admin' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.auth || to.meta.owner || to.meta.guest || to.meta.adminGuest) await auth.initialize()
  else auth.initialize()
  if (to.meta.auth && !auth.isAuthenticated) return { path: '/login' }
  if (to.meta.owner && !auth.isOwner) return { path: '/admin/login', query: { next: to.fullPath } }
  if (to.meta.adminGuest && auth.isOwner) return '/admin'
  if (to.meta.guest && auth.isAuthenticated) return auth.isOwner ? '/admin' : '/'
  return true
})

export default router
