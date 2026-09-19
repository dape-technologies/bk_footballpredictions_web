<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api/client'
import PredictionCard from '../components/PredictionCard.vue'
import StatePanel from '../components/StatePanel.vue'
const predictions = ref([]), loading = ref(true), error = ref(''), filter = ref('all')
const filtered = computed(() => filter.value === 'all' ? predictions.value : predictions.value.filter((item) => item.access_level === filter.value))
onMounted(async () => { try { predictions.value = await api('/v1/predictions/') } catch (e) { error.value = e.message } finally { loading.value = false } })
</script>
<template><div class="public-page"><section class="page-hero section-wrap"><p class="kicker">Match desk</p><h1>Today’s board,<br>without the noise.</h1><p>Kickoff times use East Africa Time. Member selections unlock only with active access.</p></section><section class="section-wrap content-section"><div class="filter-bar" role="group" aria-label="Filter predictions"><button v-for="option in ['all','free','premium']" :key="option" :class="{ active: filter === option }" @click="filter = option">{{ option }}</button></div><div v-if="loading" class="prediction-grid skeleton-grid"><div v-for="n in 4" :key="n" class="skeleton"></div></div><StatePanel v-else-if="error" title="Could not load predictions" :message="error" tone="error"/><StatePanel v-else-if="!filtered.length" title="No matches in this view" message="The owner has not published any predictions for this category yet."/><div v-else class="prediction-grid"><PredictionCard v-for="pick in filtered" :key="pick.id" :prediction="pick" /></div></section></div></template>
