<script setup>
import { computed } from 'vue'
import { PhArrowUpRight, PhLockKey, PhTrendUp } from '@phosphor-icons/vue'
const props = defineProps({ prediction: { type: Object, required: true }, featured: Boolean })
const kickoff = computed(() => new Intl.DateTimeFormat('en-UG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(props.prediction.kickoff_at)))
</script>
<template>
  <article class="prediction-card" :class="{ featured }">
    <header><span class="competition">{{ prediction.competition }}</span><span class="access-tag" :class="prediction.locked ? 'locked' : 'open'"><PhLockKey v-if="prediction.locked" :size="14" /><PhTrendUp v-else :size="14" />{{ prediction.locked ? prediction.package_name || 'Premium' : prediction.access_level }}</span></header>
    <div class="fixture"><h3>{{ prediction.home_team }}</h3><span>vs</span><h3>{{ prediction.away_team }}</h3></div><p class="kickoff">{{ kickoff }}</p>
    <div v-if="!prediction.locked" class="prediction-readout"><span>{{ prediction.market }}</span><strong>{{ prediction.selection }}</strong><b v-if="prediction.odds">{{ prediction.odds }}</b></div>
    <div v-else class="locked-readout"><span>Analysis reserved for members</span><RouterLink to="/packages">View access <PhArrowUpRight :size="15" /></RouterLink></div>
    <p v-if="!prediction.locked && prediction.analysis" class="analysis">{{ prediction.analysis }}</p>
  </article>
</template>
