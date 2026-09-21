<script setup>
import { onMounted, ref } from 'vue'
import { PhTrophy } from '@phosphor-icons/vue'
import { api } from '../api/client'
import StatePanel from '../components/StatePanel.vue'

const wins = ref([])
const loading = ref(true)
const error = ref('')
onMounted(async () => { try { wins.value = await api('/v1/recent-wins/') } catch (err) { error.value = err.message } finally { loading.value = false } })
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><h1 class="text-4xl font-black tracking-[-.055em] sm:text-6xl">Recent wins.</h1></header>
    <div v-if="loading" class="mt-10 grid gap-4"><div v-for="n in 3" :key="n" class="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div></div>
    <StatePanel v-else-if="error" title="Recent wins unavailable" :message="error" tone="error" class="mt-10" />
    <StatePanel v-else-if="!wins.length" title="No recent wins" message="Published wins will appear here." class="mt-10" />
    <div v-else class="mt-10 grid gap-4 md:grid-cols-2">
      <article v-for="win in wins" :key="win.id" class="relative min-h-80 overflow-hidden bg-[var(--app-surface)]">
        <img v-if="win.image_url" :src="win.image_url" :alt="win.caption" class="absolute inset-0 h-full w-full object-cover" /><div v-else class="grid h-full place-items-center text-[var(--app-accent)]"><PhTrophy :size="52" weight="duotone" /></div>
        <div class="absolute inset-x-0 bottom-0 bg-black/75 p-5 text-white"><p class="font-bold">{{ win.caption }}</p><time class="mt-2 block text-xs text-white/50">{{ new Date(win.settled_at).toLocaleDateString('en-UG') }}</time></div>
      </article>
    </div>
  </div>
</template>
