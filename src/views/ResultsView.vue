<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'
import StatePanel from '../components/StatePanel.vue'
const wins=ref([]), loading=ref(true), error=ref('')
onMounted(async()=>{try{wins.value=await api('/v1/recent-wins/')}catch(e){error.value=e.message}finally{loading.value=false}})
</script>
<template><div class="public-page"><section class="page-hero section-wrap"><p class="kicker">The record</p><h1>Results stay visible.</h1><p>Selected settled sequences and the reasoning behind the board.</p></section><section class="section-wrap content-section"><div v-if="loading" class="results-list"><div v-for="n in 3" :key="n" class="skeleton"></div></div><StatePanel v-else-if="error" title="Results unavailable" :message="error" tone="error"/><StatePanel v-else-if="!wins.length" title="No published results yet" message="Settled records will appear here once the owner publishes them."/><div v-else class="results-list"><article v-for="win in wins" :key="win.id"><span>{{ new Date(win.settled_at).toLocaleDateString('en-UG',{day:'2-digit',month:'short',year:'numeric'}) }}</span><div><h2>{{ win.title }}</h2><p>{{ win.summary }}</p></div><strong>{{ win.odds || '—' }}<small>odds</small></strong></article></div></section></div></template>
