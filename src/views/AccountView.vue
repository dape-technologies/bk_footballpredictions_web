<script setup>
import { onMounted, ref } from 'vue'
import { PhArrowRight, PhCalendar, PhClock, PhUserCircle } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'

const auth = useAuthStore()
const subscriptions = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try { subscriptions.value = await api('/v1/me/subscriptions/') }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}

async function cancel(id) {
  try { await api(`/v1/me/subscriptions/${id}/cancel/`, { method: 'POST' }); await load() }
  catch (err) { error.value = err.message }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-sm font-semibold text-[var(--app-accent)]">Member account</p><h1 class="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Hello, {{ auth.user?.display_name }}.</h1></div><div class="flex items-center gap-3 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4"><PhUserCircle :size="32" /><span><strong class="block">{{ auth.user?.display_name }}</strong><small class="text-[var(--app-muted)]">{{ auth.user?.phone }}</small></span></div></header>
    <section class="mt-12"><h2 class="text-2xl font-bold tracking-[-.03em]">Your access</h2><p class="mt-2 text-sm text-[var(--app-muted)]">Track active packages and pending requests.</p>
      <StatePanel v-if="error" title="Could not load your access" :message="error" tone="error" class="mt-6" />
      <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div>
      <StatePanel v-else-if="!subscriptions.length" title="No access requests yet" message="Choose a plan and send your first request." class="mt-6"><RouterLink to="/packages" class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3 font-bold text-[var(--app-accent-ink)]">Browse plans <PhArrowRight :size="16" /></RouterLink></StatePanel>
      <div v-else class="mt-6 grid gap-4">
        <article v-for="sub in subscriptions" :key="sub.id" class="grid gap-5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div><span :class="['inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em]', sub.status === 'active' ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'bg-[var(--app-surface-2)] text-[var(--app-muted)]']">{{ sub.status }}</span><h3 class="mt-3 text-xl font-bold">{{ sub.package.name }}</h3><p class="mt-1 text-sm text-[var(--app-muted)]">{{ sub.customer_message || 'The owner will update this request shortly.' }}</p></div>
          <dl class="grid grid-cols-2 gap-5 text-sm"><div><dt class="flex items-center gap-1.5 text-[var(--app-muted)]"><PhCalendar :size="15" /> Requested</dt><dd class="mt-1 font-semibold">{{ new Date(sub.requested_at).toLocaleDateString('en-UG') }}</dd></div><div><dt class="flex items-center gap-1.5 text-[var(--app-muted)]"><PhClock :size="15" /> Expires</dt><dd class="mt-1 font-semibold">{{ sub.expires_at ? new Date(sub.expires_at).toLocaleString('en-UG') : 'Not set' }}</dd></div></dl>
          <button v-if="['pending', 'active'].includes(sub.status)" class="justify-self-start rounded-xl border border-red-400/30 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10 md:justify-self-end" @click="cancel(sub.id)">Cancel access</button>
        </article>
      </div>
    </section>
  </div>
</template>
