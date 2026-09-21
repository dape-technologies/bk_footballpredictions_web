<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { PhChartLineUp, PhCrown, PhDownloadSimple, PhHouse, PhSignOut, PhUserCircle } from '@phosphor-icons/vue'
import BrandMark from './components/BrandMark.vue'
import AppDialog from './components/AppDialog.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isOwnerArea = computed(() => route.path.startsWith('/owner'))
const showPublicShell = computed(() => !isOwnerArea.value)
const deferredInstall = ref(null)
const canInstall = ref(false)
const dialog = ref(null)

const navigation = computed(() => [
  { id: 'top', label: 'Home', icon: PhHouse },
  { id: 'packages', label: 'VIP access', icon: PhCrown },
  { id: 'results', label: 'Results', icon: PhChartLineUp },
])

function openDialog(mode) {
  dialog.value = mode
}

function closeDialog() {
  dialog.value = null
  if (route.meta.dialog) router.replace('/')
}

function scrollToSection(id) {
  if (route.path !== '/') {
    router.push({ path: '/', hash: id === 'top' ? '' : `#${id}` })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

provide('openAppDialog', openDialog)

watch(() => route.meta.dialog, (mode) => {
  if (mode) dialog.value = mode
}, { immediate: true })

onMounted(() => {
  auth.initialize()
  document.documentElement.dataset.theme = 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080d0a')
  localStorage.removeItem('bk-theme')
  window.addEventListener('beforeinstallprompt', captureInstall)
  window.addEventListener('appinstalled', () => { canInstall.value = false }, { once: true })
})

onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', captureInstall))
</script>

<template>
  <div :class="['min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)]', { 'app-safe-bottom md:pb-0': showPublicShell }]">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header v-if="showPublicShell" class="app-safe-top sticky top-0 z-40 border-b border-[var(--app-line)] bg-[#080d0a]/92 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" class="shrink-0 text-left" aria-label="BK Football Predictions home" @click="scrollToSection('top')"><BrandMark /></button>
        <nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <button v-for="item in navigation.slice(1)" :key="item.id" type="button" class="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]" @click="scrollToSection(item.id)">
            {{ item.label }}
          </button>
        </nav>
        <button v-if="canInstall" type="button" class="hidden items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2 text-sm font-bold text-[var(--app-accent-ink)] active:scale-[.98] lg:flex" @click="installApp">
          <PhDownloadSimple :size="18" /> Install
        </button>
        <button type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--app-line)] px-3 text-sm font-bold text-[var(--app-text)] hover:border-[var(--app-accent)] hover:bg-[var(--app-surface)]" @click="openDialog(auth.isAuthenticated ? 'account' : 'login')">
          <PhUserCircle :size="19" /> <span class="hidden sm:inline">{{ auth.isAuthenticated ? 'My access' : 'Sign in' }}</span>
        </button>
        <button v-if="auth.isAuthenticated" type="button" class="hidden size-10 place-items-center rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] md:grid" aria-label="Sign out" @click="auth.logout">
          <PhSignOut :size="19" />
        </button>
      </div>
    </header>

    <main id="main-content"><RouterView /></main>

    <button v-if="showPublicShell && canInstall" type="button" class="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-bold text-[var(--app-accent-ink)] shadow-[0_14px_35px_rgba(86,110,34,.35)] active:scale-[.98] md:hidden" @click="installApp">
      <PhDownloadSimple :size="18" /> Install BK
    </button>

    <nav v-if="showPublicShell" class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-line)] bg-[#080d0a]/96 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="App navigation">
      <div class="mx-auto grid h-[4.75rem] max-w-lg grid-cols-4">
        <button v-for="item in navigation" :key="item.id" type="button" class="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-accent)]" @click="scrollToSection(item.id)">
          <component :is="item.icon" :size="22" weight="duotone" />
          <span class="max-w-full truncate">{{ item.label }}</span>
        </button>
        <button type="button" class="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-accent)]" @click="openDialog(auth.isAuthenticated ? 'account' : 'login')">
          <PhUserCircle :size="22" weight="duotone" />
          <span>{{ auth.isAuthenticated ? 'My access' : 'Sign in' }}</span>
        </button>
      </div>
    </nav>

    <footer v-if="showPublicShell" id="about" class="border-t border-[var(--app-line)] bg-[#080d0a]">
      <div class="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-8 text-sm text-[var(--app-muted)] sm:px-6 md:flex-row md:items-center lg:px-8">
        <div><BrandMark compact /><p class="mt-3">Independent football analysis for adults 18+. Play responsibly.</p></div>
        <div class="flex flex-wrap items-center gap-5"><button type="button" @click="scrollToSection('packages')">VIP access</button><button type="button" @click="scrollToSection('results')">Results</button><span>© {{ new Date().getFullYear() }} BK</span></div>
      </div>
    </footer>

    <AppDialog v-if="dialog" :mode="dialog" @close="closeDialog" @switch="openDialog" />
  </div>
</template>
