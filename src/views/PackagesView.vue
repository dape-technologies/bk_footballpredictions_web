<script setup>
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight, PhClock, PhMoneyWavy } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'

const packages = ref([])
const weeklyPlan = ref(null)
const tab = ref('one-off')
const loading = ref(true)
const error = ref('')
const message = ref('')
const submitting = ref(null)
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const openDialog = inject('openAppDialog')
let refreshTimer
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const formatStart = (value) => value ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'To be announced'

async function loadPackages(silent = false) {
  try {
    const [packageData, weeklyData] = await Promise.all([
      api('/v1/packages/'),
      api('/v1/weekly-plan/').catch((caught) => caught.status === 404 ? null : Promise.reject(caught)),
    ])
    packages.value = packageData
    weeklyPlan.value = weeklyData
    error.value = ''
  } catch (err) {
    if (!silent) error.value = err.message
  } finally {
    if (!silent) loading.value = false
  }
}

function refreshWhenVisible() {
  if (!document.hidden && !submitting.value) loadPackages(true)
}

onMounted(async () => {
  await loadPackages()
  refreshTimer = window.setInterval(refreshWhenVisible, 30_000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})

async function requestAccess(plan) {
  if (!auth.isAuthenticated) return router.push({ path: '/login', query: { next: '/packages' } })
  submitting.value = plan.id
  message.value = ''
  error.value = ''
  try {
    const purchase = await api('/v1/me/purchases/', { method: 'POST', body: JSON.stringify({ package_id: plan.id }) })
    openDialog?.(purchase.is_paid ? 'account' : 'payment', purchase.is_paid ? {} : { plan, purchase })
  } catch (err) { error.value = err.message }
  finally { submitting.value = null }
}

async function requestWeeklyAccess() {
  if (!auth.isAuthenticated) return router.push({ path: '/login', query: { next: '/packages' } })
  submitting.value = 'weekly'
  error.value = ''
  try {
    const order = await api('/v1/me/subscriptions/', { method: 'POST', body: '{}' })
    openDialog?.('payment', { plan: weeklyPlan.value, purchase: order, checkoutType: 'subscription' })
  } catch (err) {
    if (err.status === 409 && err.message.includes('still active')) openDialog?.('account')
    else error.value = err.message
  } finally { submitting.value = null }
}
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><h1 class="text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Choose your earning package.</h1></header>
    <div class="mt-8 inline-flex rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1" role="tablist" aria-label="Package offers">
      <button type="button" role="tab" :aria-selected="tab === 'one-off'" :class="['rounded-lg px-4 py-2.5 text-sm font-bold transition', tab === 'one-off' ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'text-[var(--app-muted)]']" @click="tab='one-off'">One-off Packages</button>
      <button type="button" role="tab" :aria-selected="tab === 'weekly'" :class="['rounded-lg px-4 py-2.5 text-sm font-bold transition', tab === 'weekly' ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'text-[var(--app-muted)]']" @click="tab='weekly'">Weekly Plan</button>
    </div>
    <StatePanel v-if="message" title="Request received" :message="message" tone="success" class="mt-8" />
    <StatePanel v-if="error" title="Something needs attention" :message="error" tone="error" class="mt-8" />
    <div v-if="loading" class="package-rail mt-10 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[30rem] w-[min(84vw,22rem)] shrink-0 snap-start animate-pulse rounded-2xl bg-[var(--app-surface)] md:w-auto"></div></div>
    <div v-else-if="tab === 'one-off'" class="package-rail mt-10 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3">
      <article v-for="plan in packages" :key="plan.id" :class="['flex min-h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start flex-col overflow-hidden border border-[var(--app-line)] bg-[var(--app-surface)] transition md:w-auto', route.query.plan === plan.slug ? 'ring-2 ring-[var(--app-accent)]' : '']">
        <div class="grid h-48 place-items-center overflow-hidden bg-[var(--app-surface-2)]"><img v-if="plan.image_url" :src="plan.image_url" :alt="`${plan.name} package`" class="h-full w-full object-cover"><PhMoneyWavy v-else :size="56" class="text-[var(--app-accent)]" weight="duotone" /></div>
        <div class="flex flex-1 flex-col p-6"><span class="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">{{ plan.package_type }}</span><h2 class="mt-2 text-3xl font-extrabold tracking-[-.05em]">{{ plan.name }}</h2><div class="mt-6 grid grid-cols-2 gap-4 border-y border-[var(--app-line)] py-4"><div><small class="block text-[var(--app-muted)]">Probability</small><strong class="text-2xl">{{ plan.win_probability }}%</strong></div><div><small class="block text-[var(--app-muted)]">Closes</small><strong class="mt-1 flex items-center gap-1 text-sm"><PhClock :size="15" />{{ formatStart(plan.closes_at) }}</strong></div></div><div class="my-6"><small class="block text-xs font-bold">{{ plan.currency }}</small><strong class="text-4xl font-black tracking-[-.07em] numbers">{{ money(plan.price) }}</strong></div><button class="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-4 font-bold text-[var(--app-accent-ink)] transition active:scale-[.98]" :disabled="submitting === plan.id || !plan.is_open" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Processing…' : plan.is_open ? 'Buy slip' : 'Unavailable' }} <PhArrowRight :size="17" /></button></div>
      </article>
    </div>
    <section v-else class="mt-10 max-w-3xl overflow-hidden border border-[var(--app-line)] bg-[var(--app-surface)]">
      <div class="grid gap-8 p-7 sm:p-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><span class="text-xs font-black uppercase tracking-[.16em] text-[var(--app-accent)]">Seven-day access</span><h2 class="mt-3 text-4xl font-black tracking-[-.055em]">{{ weeklyPlan?.name || 'Weekly Plan' }}</h2><p class="mt-4 max-w-xl leading-7 text-[var(--app-muted)]">{{ weeklyPlan?.description || 'The Weekly Plan is currently being prepared.' }}</p><ul class="mt-6 grid gap-3 text-sm"><li>Every current weekly package unlocks when payment is confirmed.</li><li>New weekly uploads appear automatically while your plan is active.</li><li>Access ends exactly seven days after payment confirmation.</li></ul></div>
        <div v-if="weeklyPlan" class="min-w-48 border-t border-[var(--app-line)] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0"><small class="font-bold text-[var(--app-muted)]">{{ weeklyPlan.currency }} / 7 days</small><strong class="mt-1 block text-4xl font-black tracking-[-.06em]">{{ money(weeklyPlan.price) }}</strong><button type="button" class="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)]" :disabled="submitting === 'weekly'" @click="requestWeeklyAccess">{{ submitting === 'weekly' ? 'Processing…' : 'Join Weekly Plan' }} <PhArrowRight :size="17" /></button></div>
        <p v-else class="text-sm font-semibold text-[var(--app-muted)]">Not available right now.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.package-rail { overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.package-rail::-webkit-scrollbar { display: none; }
</style>
