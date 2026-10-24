import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
const OwnerDashboard = () => import('../views/OwnerDashboard.vue')
const DeveloperDashboard = () => import('../views/DeveloperDashboard.vue')
import DeveloperLoginView from '../views/DeveloperLoginView.vue'

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
    { path: '/owner/login', component: AdminLoginView, meta: { ownerGuest: true } },
    { path: '/owner/dashboard', component: OwnerDashboard, meta: { owner: true } },
    { path: '/owner', redirect: '/owner/dashboard' },
    { path: '/developer/login', component: DeveloperLoginView, meta: { developerGuest: true } },
    { path: '/developer/dashboard', component: DeveloperDashboard, meta: { developer: true } },
    { path: '/developer', redirect: '/developer/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.auth || to.meta.owner || to.meta.developer || to.meta.guest || to.meta.ownerGuest || to.meta.developerGuest) await auth.initialize()
  else auth.initialize()
  if (to.meta.auth && !auth.isAuthenticated) return { path: '/login' }
  if (to.meta.owner && !auth.isOwner) return { path: '/owner/login', query: { next: to.fullPath } }
  if (to.meta.developer && !auth.isDeveloper) return { path: '/developer/login', query: { next: to.fullPath } }
  if (to.meta.ownerGuest && auth.isOwner) return '/owner/dashboard'
  if (to.meta.developerGuest && auth.isDeveloper) return '/developer/dashboard'
  if (to.meta.guest && auth.isAuthenticated) return auth.isOwner ? '/owner/dashboard' : '/'
  return true
})

export default router
