<script setup>
import { onMounted, ref } from 'vue'
import { PhCheckCircle } from '@phosphor-icons/vue'
import { api } from '../api/client'
import StatePanel from '../components/StatePanel.vue'

const wins = ref([])
const loading = ref(true)
const error = ref('')
onMounted(async () => { try { wins.value = await api('/v1/recent-wins/') } catch (err) { error.value = err.message } finally { loading.value = false } })
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><p class="text-sm font-semibold text-[var(--app-accent)]">Published record</p><h1 class="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Results stay visible.</h1><p class="mt-4 text-[var(--app-muted)]">Review settled sequences and the outcome published by the BK desk.</p></header>
    <div v-if="loading" class="mt-10 grid gap-4"><div v-for="n in 3" :key="n" class="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div></div>
    <StatePanel v-else-if="error" title="Results unavailable" :message="error" tone="error" class="mt-10" />
    <StatePanel v-else-if="!wins.length" title="No published results yet" message="Settled records will appear here once the owner publishes them." class="mt-10" />
    <div v-else class="mt-10 grid gap-4">
      <article v-for="win in wins" :key="win.id" class="grid gap-5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 sm:p-6 md:grid-cols-[10rem_1fr_auto] md:items-center">
        <div v-if="win.image_url" class="aspect-video overflow-hidden rounded-xl md:aspect-square"><img :src="win.image_url" :alt="win.title" class="h-full w-full object-cover" /></div><div v-else class="grid aspect-video place-items-center rounded-xl bg-[var(--app-surface-2)] text-[var(--app-accent)] md:aspect-square"><PhCheckCircle :size="42" weight="duotone" /></div>
        <div><time class="text-xs font-semibold text-[var(--app-muted)]">{{ new Date(win.settled_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }) }}</time><h2 class="mt-2 text-2xl font-bold tracking-[-.035em]">{{ win.title }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">{{ win.summary }}</p></div>
        <strong class="text-4xl font-black tracking-[-.06em] numbers">{{ win.odds || 'N/A' }}<small class="block text-xs font-semibold tracking-normal text-[var(--app-muted)]">combined odds</small></strong>
      </article>
    </div>
  </div>
</template>
