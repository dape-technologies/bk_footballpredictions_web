<script setup>
import { inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowRight, PhClock, PhMoneyWavy } from '@phosphor-icons/vue'
import { api } from '../api/client'
import StatePanel from '../components/StatePanel.vue'

const packages = ref([])
const loading = ref(true)
const error = ref('')
const route = useRoute()
const startCheckout = inject('startPackageCheckout')
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const formatStart = (value) => value ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'To be announced'

onMounted(async () => {
  try { packages.value = await api('/v1/packages/') }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
})

function requestAccess(plan) { startCheckout?.(plan) }
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><h1 class="text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Choose your earning package.</h1></header>
    <StatePanel v-if="error" title="Something needs attention" :message="error" tone="error" class="mt-8" />
    <div v-if="loading" class="package-rail mt-10 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[30rem] w-[min(84vw,22rem)] shrink-0 snap-start animate-pulse rounded-2xl bg-[var(--app-surface)] md:w-auto"></div></div>
    <div v-else class="package-rail mt-10 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3">
      <article v-for="plan in packages" :key="plan.id" :class="['flex min-h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start flex-col overflow-hidden border border-[var(--app-line)] bg-[var(--app-surface)] transition md:w-auto', route.query.plan === plan.slug ? 'ring-2 ring-[var(--app-accent)]' : '']">
        <div class="grid h-48 place-items-center overflow-hidden bg-[var(--app-surface-2)]"><img v-if="plan.image_url" :src="plan.image_url" :alt="`${plan.name} package`" class="h-full w-full object-cover"><PhMoneyWavy v-else :size="56" class="text-[var(--app-accent)]" weight="duotone" /></div>
        <div class="flex flex-1 flex-col p-6"><span class="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">{{ plan.package_type }}</span><h2 class="mt-2 text-3xl font-extrabold tracking-[-.05em]">{{ plan.name }}</h2><div class="mt-6 grid grid-cols-2 gap-4 border-y border-[var(--app-line)] py-4"><div><small class="block text-[var(--app-muted)]">Probability</small><strong class="text-2xl">{{ plan.win_probability }}%</strong></div><div><small class="block text-[var(--app-muted)]">{{ plan.is_open ? 'Closes' : 'Closed' }}</small><strong class="mt-1 flex items-center gap-1 text-sm"><PhClock :size="15" />{{ formatStart(plan.closes_at) }}</strong></div></div><div class="my-6"><small class="block text-xs font-bold">{{ plan.currency }}</small><strong class="text-4xl font-black tracking-[-.07em] numbers">{{ money(plan.price) }}</strong></div><button class="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-4 font-bold text-[var(--app-accent-ink)] transition active:scale-[.98] disabled:opacity-45" :disabled="!plan.is_open" @click="requestAccess(plan)">{{ plan.is_open ? 'Buy package' : 'Closed' }} <PhArrowRight v-if="plan.is_open" :size="17" /></button></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.package-rail { overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.package-rail::-webkit-scrollbar { display: none; }
</style>
