<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { PhChartLineUp, PhCrown, PhDownloadSimple, PhHouse, PhSignOut, PhUserCircle } from '@phosphor-icons/vue'
import BrandMark from './components/BrandMark.vue'
import AppDialog from './components/AppDialog.vue'
import { api } from './api/client'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isOwnerArea = computed(() => route.path.startsWith('/admin'))
const showPublicShell = computed(() => !isOwnerArea.value)
const deferredInstall = ref(null)
const canInstall = ref(false)
const dialog = ref(null)
const profileOpen = ref(false)
const profileMenu = ref(null)
const purchases = ref([])
const profileLoading = ref(false)
const profileError = ref('')
const paidPurchases = computed(() => purchases.value.filter((purchase) => purchase.is_paid))
const checkoutPackage = ref(JSON.parse(sessionStorage.getItem('bk-checkout-package') || 'null'))

const navigation = computed(() => [
  { id: 'top', label: 'Home', icon: PhHouse },
  { id: 'packages', label: 'VIP access', icon: PhCrown },
  { id: 'results', label: 'Recent wins', icon: PhChartLineUp },
])

function openDialog(mode) {
  dialog.value = mode
}

function startPackageCheckout(plan) {
  checkoutPackage.value = plan
  sessionStorage.setItem('bk-checkout-package', JSON.stringify(plan))
  openDialog(auth.isAuthenticated ? 'checkout' : 'login')
}

function handleAuthenticated(user) {
  if (user?.is_owner) {
    closeDialog()
    router.push('/admin')
    return
  }
  openDialog(checkoutPackage.value ? 'checkout' : 'account')
}

function finishCheckout() {
  sessionStorage.removeItem('bk-checkout-package')
}

function closeDialog() {
  dialog.value = null
  if (route.meta.dialog) router.replace('/')
}

async function toggleProfile() {
  profileOpen.value = !profileOpen.value
  if (!profileOpen.value) return
  profileLoading.value = true
  profileError.value = ''
  try { purchases.value = await api('/v1/me/purchases/') }
  catch (error) { profileError.value = error.message }
  finally { profileLoading.value = false }
}

function closeProfileFromOutside(event) {
  if (profileOpen.value && !profileMenu.value?.contains(event.target)) profileOpen.value = false
}

function closeProfileFromKeyboard(event) {
  if (event.key === 'Escape') profileOpen.value = false
}

async function signOut() {
  profileOpen.value = false
  await auth.logout()
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
provide('startPackageCheckout', startPackageCheckout)

watch(() => route.meta.dialog, (mode) => {
  if (mode) dialog.value = mode
}, { immediate: true })

onMounted(() => {
  auth.initialize()
  document.documentElement.dataset.theme = 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080d0a')
  localStorage.removeItem('bk-theme')
  window.addEventListener('beforeinstallprompt', captureInstall)
  document.addEventListener('pointerdown', closeProfileFromOutside)
  document.addEventListener('keydown', closeProfileFromKeyboard)
  window.addEventListener('appinstalled', () => { canInstall.value = false }, { once: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', captureInstall)
  document.removeEventListener('pointerdown', closeProfileFromOutside)
  document.removeEventListener('keydown', closeProfileFromKeyboard)
})
</script>

<template>
  <div :class="['min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)]', { 'app-safe-bottom md:pb-0': showPublicShell }]">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header v-if="showPublicShell" class="app-safe-top sticky top-0 z-40 border-b border-[var(--app-line)] bg-[#080d0a]/92 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" class="shrink-0 text-left" aria-label="BK Football Predictions home" @click="scrollToSection('top')"><BrandMark /></button>
        <p v-if="auth.isAuthenticated" class="min-w-0 border-l border-[var(--app-line)] pl-3 text-[11px] font-extrabold leading-tight text-white/70 sm:text-xs">
          Welcome, <strong class="block max-w-24 truncate text-base font-black text-white sm:max-w-40">{{ auth.user?.first_name }}</strong>
        </p>
        <nav class="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <button v-for="item in navigation.slice(1)" :key="item.id" type="button" class="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]" @click="scrollToSection(item.id)">
            {{ item.label }}
          </button>
        </nav>
        <button v-if="canInstall" type="button" class="hidden items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2 text-sm font-bold text-[var(--app-accent-ink)] active:scale-[.98] lg:flex" @click="installApp">
          <PhDownloadSimple :size="18" /> Install
        </button>
        <div v-if="auth.isAuthenticated" ref="profileMenu" class="relative ml-auto md:ml-0">
          <button type="button" class="grid size-10 place-items-center rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] active:scale-[.97]" :aria-expanded="profileOpen" aria-haspopup="menu" aria-label="Open profile menu" @click="toggleProfile">
            <PhUserCircle :size="22" weight="duotone" />
          </button>
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-2 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="translate-y-0 opacity-100" leave-to-class="-translate-y-1 opacity-0">
            <section v-if="profileOpen" class="absolute right-0 top-[calc(100%+.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#101713] text-[#f2f7f3] shadow-[0_24px_70px_rgba(0,0,0,.55)]" role="menu" aria-label="Profile menu">
              <header class="flex items-center gap-3 border-b border-white/10 p-4">
                <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--app-accent)] font-black text-[var(--app-accent-ink)]">{{ auth.user?.first_name?.charAt(0) }}</span>
                <div class="min-w-0"><p class="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Signed in as</p><strong class="block truncate text-lg">{{ auth.user?.first_name }} {{ auth.user?.surname }}</strong></div>
              </header>
              <div class="p-4">
                <div class="flex items-center justify-between"><p class="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">My purchases</p><PhCrown :size="18" class="text-[var(--app-accent)]" weight="duotone" /></div>
                <p v-if="profileLoading" class="mt-3 animate-pulse text-sm text-white/45">Checking your purchases…</p>
                <p v-else-if="profileError" class="mt-3 text-sm text-red-300">{{ profileError }}</p>
                <div v-else-if="paidPurchases.length" class="mt-3 grid gap-2">
                  <button v-for="purchase in paidPurchases" :key="purchase.id" type="button" class="flex w-full items-center justify-between rounded-xl bg-white/5 p-3 text-left hover:bg-white/8" @click="profileOpen=false; openDialog('account')">
                    <span><strong class="block text-sm">{{ purchase.package.name }}</strong><small class="mt-1 block text-[11px] text-white/40">Purchased {{ new Date(purchase.paid_at).toLocaleDateString('en-UG') }}</small></span><span class="size-2 rounded-full bg-[var(--app-accent)]"></span>
                  </button>
                </div>
                <button v-else type="button" class="mt-3 w-full rounded-xl border border-dashed border-white/15 p-3 text-left text-sm text-white/45 hover:border-white/25 hover:text-white/70" @click="profileOpen=false; scrollToSection('packages')">No paid packages yet. View packages.</button>
              </div>
              <button type="button" class="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3.5 text-sm font-bold text-white/55 hover:bg-white/5 hover:text-white" role="menuitem" @click="signOut"><PhSignOut :size="18" /> Sign out</button>
            </section>
          </Transition>
        </div>
        <button v-else type="button" class="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--app-line)] px-3 text-sm font-bold text-[var(--app-text)] hover:border-[var(--app-accent)] hover:bg-[var(--app-surface)] md:ml-0" @click="openDialog('login')">
          <PhUserCircle :size="19" /> <span class="hidden sm:inline">Sign in</span>
        </button>
      </div>
    </header>

    <main id="main-content"><RouterView /></main>

    <button v-if="showPublicShell && canInstall" type="button" class="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-bold text-[var(--app-accent-ink)] shadow-[0_14px_35px_rgba(86,110,34,.35)] active:scale-[.98] md:hidden" @click="installApp">
      <PhDownloadSimple :size="18" /> Install BK
    </button>

    <nav v-if="showPublicShell" class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-line)] bg-[#080d0a]/96 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="App navigation">
      <div :class="['mx-auto grid h-[4.75rem] max-w-lg', auth.isAuthenticated ? 'grid-cols-3' : 'grid-cols-4']">
        <button v-for="item in navigation" :key="item.id" type="button" class="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-accent)]" @click="scrollToSection(item.id)">
          <component :is="item.icon" :size="22" weight="duotone" />
          <span class="max-w-full truncate">{{ item.label }}</span>
        </button>
        <button v-if="!auth.isAuthenticated" type="button" class="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-accent)]" @click="openDialog('login')">
          <PhUserCircle :size="22" weight="duotone" />
          <span>Sign in</span>
        </button>
      </div>
    </nav>

    <footer v-if="showPublicShell" id="about" class="border-t border-[var(--app-line)] bg-[#080d0a]">
      <div class="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-8 text-sm text-[var(--app-muted)] sm:px-6 md:flex-row md:items-center lg:px-8">
        <div><BrandMark compact /><p class="mt-3">Independent football analysis for adults 18+. Play responsibly.</p></div>
        <div class="flex flex-wrap items-center gap-5"><button type="button" @click="scrollToSection('packages')">VIP access</button><button type="button" @click="scrollToSection('results')">Recent wins</button><span>© {{ new Date().getFullYear() }} BK</span></div>
      </div>
    </footer>

    <AppDialog v-if="dialog" :mode="dialog" :package="checkoutPackage" @close="closeDialog" @switch="openDialog" @authenticated="handleAuthenticated" @purchase-complete="finishCheckout" />
  </div>
</template>
