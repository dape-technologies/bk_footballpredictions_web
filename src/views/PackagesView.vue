<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight, PhCheck, PhClock, PhCrown } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'

const packages = ref([])
const loading = ref(true)
const error = ref('')
const message = ref('')
const submitting = ref(null)
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const money = (value) => new Intl.NumberFormat('en-UG').format(value)

onMounted(async () => {
  try { packages.value = await api('/v1/packages/') }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
})

async function requestAccess(plan) {
  if (!auth.isAuthenticated) return router.push({ path: '/login', query: { next: '/packages' } })
  submitting.value = plan.id
  message.value = ''
  error.value = ''
  try {
    await api('/v1/me/subscriptions/', { method: 'POST', body: JSON.stringify({ package_id: plan.id }) })
    message.value = `Your ${plan.name} request is now with the owner.`
  } catch (err) { error.value = err.message }
  finally { submitting.value = null }
}
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><PhCrown :size="34" class="text-[var(--app-accent)]" weight="duotone" /><h1 class="mt-5 text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Choose your VIP access.</h1><p class="mt-4 max-w-xl text-[var(--app-muted)]">Select a plan and send an access request. You can track its status from your account.</p></header>
    <StatePanel v-if="message" title="Request received" :message="message" tone="success" class="mt-8" />
    <StatePanel v-if="error" title="Something needs attention" :message="error" tone="error" class="mt-8" />
    <div v-if="loading" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[30rem] animate-pulse rounded-2xl bg-[var(--app-surface)]"></div></div>
    <div v-else class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="(plan, index) in packages" :key="plan.id" :class="['flex min-h-[30rem] flex-col rounded-2xl border p-6 transition', plan.is_featured ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'border-[var(--app-line)] bg-[var(--app-surface)]', route.query.plan === plan.slug ? 'ring-2 ring-[var(--app-accent)] ring-offset-4 ring-offset-[var(--app-bg)]' : '']">
        <div class="flex items-center justify-between text-xs font-bold"><span>Plan {{ index + 1 }}</span><span v-if="route.query.plan === plan.slug" class="rounded-lg bg-[var(--app-accent-ink)]/10 px-2 py-1">Selected</span><span v-else-if="plan.is_featured" class="rounded-lg bg-[var(--app-accent-ink)]/10 px-2 py-1">Most popular</span></div>
        <p :class="['mt-10 flex items-center gap-2 text-sm', plan.is_featured ? 'text-[var(--app-accent-ink)]/65' : 'text-[var(--app-muted)]']"><PhClock :size="17" /> {{ plan.duration_days }}-day access</p>
        <h2 class="mt-3 text-3xl font-extrabold tracking-[-.05em]">{{ plan.name }}</h2>
        <p :class="['mt-3 leading-6', plan.is_featured ? 'text-[var(--app-accent-ink)]/70' : 'text-[var(--app-muted)]']">{{ plan.description }}</p>
        <div class="mt-7"><small class="block text-xs font-bold">{{ plan.currency }}</small><strong class="text-5xl font-black tracking-[-.07em] numbers">{{ money(plan.price) }}</strong></div>
        <ul class="mt-7 grid gap-3 text-sm"><li v-for="benefit in plan.benefits" :key="benefit" class="flex items-start gap-2"><PhCheck :size="17" weight="bold" class="mt-0.5 shrink-0" /> {{ benefit }}</li></ul>
        <button :class="['mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-bold transition active:scale-[.98]', plan.is_featured ? 'bg-[var(--app-accent-ink)] text-[var(--app-accent)]' : 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]']" :disabled="submitting === plan.id || !plan.is_open" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Sending request...' : plan.is_open ? 'Request access' : 'Requests closed' }} <PhArrowRight :size="17" /></button>
      </article>
    </div>
  </div>
</template>
