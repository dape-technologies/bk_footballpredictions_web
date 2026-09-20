import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import PredictionsView from '../views/PredictionsView.vue'
import PackagesView from '../views/PackagesView.vue'
import ResultsView from '../views/ResultsView.vue'
import AuthView from '../views/AuthView.vue'
import AccountView from '../views/AccountView.vue'
import AboutView from '../views/AboutView.vue'
import OwnerDashboard from '../views/OwnerDashboard.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
  routes: [
    { path: '/', component: HomeView }, { path: '/predictions', component: PredictionsView },
    { path: '/packages', component: PackagesView }, { path: '/results', component: ResultsView },
    { path: '/about', component: AboutView },
    { path: '/login', component: AuthView, props: { mode: 'login' }, meta: { guest: true } },
    { path: '/register', component: AuthView, props: { mode: 'register' }, meta: { guest: true } },
    { path: '/account', component: AccountView, meta: { auth: true } },
    { path: '/owner', component: OwnerDashboard, meta: { owner: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundView },
  ],
})
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.auth || to.meta.owner || to.meta.guest) await auth.initialize()
  else auth.initialize()
  if (to.meta.auth && !auth.isAuthenticated) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.owner && !auth.isOwner) return { path: '/login', query: { next: '/owner' } }
  if (to.meta.guest && auth.isAuthenticated) return auth.isOwner ? '/owner' : '/account'
  return true
})
export default router
