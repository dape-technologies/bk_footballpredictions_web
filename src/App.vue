<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { PhChartLineUp, PhCrown, PhDownloadSimple, PhHouse, PhMoon, PhSignOut, PhSoccerBall, PhSun, PhUserCircle } from '@phosphor-icons/vue'
import BrandMark from './components/BrandMark.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const auth = useAuthStore()
const isOwnerArea = computed(() => route.path.startsWith('/owner'))
const isAuthArea = computed(() => ['/login', '/register'].includes(route.path))
const showPublicShell = computed(() => !isOwnerArea.value && !isAuthArea.value)
const deferredInstall = ref(null)
const canInstall = ref(false)
const theme = ref('dark')

const navigation = computed(() => [
  { to: '/', label: 'Home', icon: PhHouse },
  { to: '/predictions', label: 'Predictions', icon: PhSoccerBall },
  { to: '/packages', label: 'VIP plans', icon: PhCrown },
  { to: '/results', label: 'Results', icon: PhChartLineUp },
  { to: auth.isAuthenticated ? '/account' : '/login', label: auth.isAuthenticated ? 'Account' : 'Sign in', icon: PhUserCircle },
])

function applyTheme(next) {
  theme.value = next
  document.documentElement.dataset.theme = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#070b09' : '#eef1ed')
  localStorage.setItem('bk-theme', next)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function captureInstall(event) {
  event.preventDefault()
  deferredInstall.value = event
  canInstall.value = true
}

async function installApp() {
  if (!deferredInstall.value) return
  deferredInstall.value.prompt()
  await deferredInstall.value.userChoice
  deferredInstall.value = null
  canInstall.value = false
}

onMounted(() => {
  auth.initialize()
  const saved = localStorage.getItem('bk-theme')
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  applyTheme(saved || preferred)
  window.addEventListener('beforeinstallprompt', captureInstall)
  window.addEventListener('appinstalled', () => { canInstall.value = false }, { once: true })
})

onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', captureInstall))
</script>

<template>
  <div :class="['min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)]', { 'app-safe-bottom md:pb-0': showPublicShell }]">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header v-if="showPublicShell" class="app-safe-top sticky top-0 z-40 border-b border-[var(--app-line)] bg-[var(--app-bg)]/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="shrink-0" aria-label="BK Football Predictions home"><BrandMark /></RouterLink>
        <nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <RouterLink v-for="item in navigation.slice(1)" :key="item.to" :to="item.to" class="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]" active-class="!bg-[var(--app-surface)] !text-[var(--app-text)]">
            {{ item.label }}
          </RouterLink>
        </nav>
        <button v-if="canInstall" type="button" class="hidden items-center gap-2 rounded-xl bg-bk-acid px-4 py-2 text-sm font-bold text-bk-ink active:scale-[.98] lg:flex" @click="installApp">
          <PhDownloadSimple :size="18" /> Install
        </button>
        <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-text)]" :aria-label="`Use ${theme === 'dark' ? 'light' : 'dark'} theme`" @click="toggleTheme">
          <PhSun v-if="theme === 'dark'" :size="19" /><PhMoon v-else :size="19" />
        </button>
        <button v-if="auth.isAuthenticated" type="button" class="hidden size-10 place-items-center rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] md:grid" aria-label="Sign out" @click="auth.logout">
          <PhSignOut :size="19" />
        </button>
      </div>
    </header>

    <main id="main-content"><RouterView /></main>

    <button v-if="showPublicShell && canInstall" type="button" class="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-2xl bg-bk-acid px-4 py-3 text-sm font-bold text-bk-ink shadow-[0_14px_35px_rgba(94,122,31,.35)] active:scale-[.98] md:hidden" @click="installApp">
      <PhDownloadSimple :size="18" /> Install BK
    </button>

    <nav v-if="showPublicShell" class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-line)] bg-[var(--app-bg)]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="App navigation">
      <div class="mx-auto grid h-[4.75rem] max-w-lg grid-cols-5">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[var(--app-muted)]" active-class="!text-[var(--app-accent)]">
          <component :is="item.icon" :size="22" weight="duotone" />
          <span class="max-w-full truncate">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <footer v-if="showPublicShell" class="hidden border-t border-[var(--app-line)] md:block">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-8 px-8 py-8 text-sm text-[var(--app-muted)]">
        <div><BrandMark compact /><p class="mt-3">Football predictions for adults 18+. Play responsibly.</p></div>
        <div class="flex items-center gap-6"><RouterLink to="/about">About</RouterLink><RouterLink to="/packages">VIP plans</RouterLink><span>© {{ new Date().getFullYear() }} BK</span></div>
      </div>
    </footer>
  </div>
</template>
