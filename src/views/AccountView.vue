<script setup>
import { onMounted, ref } from 'vue'
import { PhArrowRight, PhCopy, PhUserCircle } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'

const auth = useAuthStore()
const purchases = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try { purchases.value = await api('/v1/me/purchases/') }
  catch (caught) { error.value = caught.message }
  finally { loading.value = false }
}

function copyCode(code) { navigator.clipboard.writeText(code) }

onMounted(load)
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-sm font-semibold text-[var(--app-accent)]">Member account</p><h1 class="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Hello, {{ auth.user?.first_name }}.</h1></div><div class="flex items-center gap-3 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4"><PhUserCircle :size="32" /><span><strong class="block">{{ auth.user?.full_name }}</strong><small class="text-[var(--app-muted)]">{{ auth.user?.phone }}</small></span></div></header>
    <section class="mt-12"><h2 class="text-2xl font-bold tracking-[-.03em]">My purchases</h2><p class="mt-2 text-sm text-[var(--app-muted)]">Paid packages remain available permanently.</p>
      <StatePanel v-if="error" title="Could not load your purchases" :message="error" tone="error" class="mt-6" />
      <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div>
      <StatePanel v-else-if="!purchases.length" title="No purchases yet" message="Choose an open package to get started." class="mt-6"><RouterLink to="/packages" class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3 font-bold text-[var(--app-accent-ink)]">Browse packages <PhArrowRight :size="16" /></RouterLink></StatePanel>
      <div v-else class="mt-6 grid gap-4"><article v-for="item in purchases" :key="item.id" class="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5"><div class="flex flex-wrap items-center justify-between gap-3"><h3 class="text-xl font-bold">{{ item.package.name }}</h3><span class="status-chip paid">{{ item.status }}</span></div><div v-if="item.is_paid" class="mt-5 grid gap-3 border-t border-[var(--app-line)] pt-5"><div class="flex items-center justify-between gap-3"><code class="text-lg font-black text-[var(--app-accent)]">{{ item.code }}</code><button type="button" aria-label="Copy code" @click="copyCode(item.code)"><PhCopy :size="18" /></button></div><a :href="item.betslip_link" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--app-accent)] px-4 font-bold text-[var(--app-accent-ink)]">Open betslip</a></div><p v-else class="mt-3 text-sm text-[var(--app-muted)]">{{ item.latest_payment?.provider_message || 'Payment not completed.' }}</p></article></div>
    </section>
  </div>
</template>
