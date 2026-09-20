<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api/client'
import PredictionCard from '../components/PredictionCard.vue'
import StatePanel from '../components/StatePanel.vue'

const predictions = ref([])
const loading = ref(true)
const error = ref('')
const filter = ref('all')
const filtered = computed(() => filter.value === 'all' ? predictions.value : predictions.value.filter((item) => item.access_level === filter.value))

onMounted(async () => {
  try { predictions.value = await api('/v1/predictions/') }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
})
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-2xl"><p class="text-sm font-semibold text-[var(--app-accent)]">Match board</p><h1 class="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Today’s football predictions.</h1><p class="mt-4 max-w-xl text-[var(--app-muted)]">Kickoff times use East Africa Time. Active VIP access unlocks member selections.</p></header>
    <div class="mt-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter predictions">
      <button v-for="option in ['all', 'free', 'premium']" :key="option" :class="['rounded-xl px-4 py-2 text-sm font-bold capitalize transition active:scale-[.98]', filter === option ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)]']" @click="filter = option">{{ option }}</button>
    </div>
    <div v-if="loading" class="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="n in 6" :key="n" class="h-72 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div></div>
    <StatePanel v-else-if="error" title="Could not load predictions" :message="error" tone="error" class="mt-7" />
    <StatePanel v-else-if="!filtered.length" title="No matches in this view" message="The BK desk has not published predictions for this category yet." class="mt-7" />
    <div v-else class="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><PredictionCard v-for="(pick, index) in filtered" :key="pick.id" :prediction="pick" :featured="index === 0 && filter !== 'premium'" /></div>
  </div>
</template>
