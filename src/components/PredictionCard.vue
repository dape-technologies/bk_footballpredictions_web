<script setup>
import { computed } from 'vue'
import { PhArrowUpRight, PhClock, PhLockKey, PhTrendUp } from '@phosphor-icons/vue'

const props = defineProps({ prediction: { type: Object, required: true }, featured: Boolean })
const kickoff = computed(() => new Intl.DateTimeFormat('en-UG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(props.prediction.kickoff_at)))
</script>

<template>
  <article :class="['group flex min-h-72 snap-start flex-col rounded-2xl border p-5 transition duration-300 active:scale-[.99]', featured ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-text)] hover:-translate-y-1 hover:border-[var(--app-muted)]']">
    <header class="flex items-start justify-between gap-3">
      <span :class="['text-[11px] font-bold uppercase tracking-[.13em]', featured ? 'text-[var(--app-accent-ink)]/65' : 'text-[var(--app-muted)]']">{{ prediction.competition }}</span>
      <span :class="['inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold', featured ? 'bg-[var(--app-accent-ink)]/10' : 'bg-[var(--app-surface-2)] text-[var(--app-muted)]']">
        <PhLockKey v-if="prediction.locked" :size="13" /><PhTrendUp v-else :size="13" />
        {{ prediction.locked ? prediction.package_name || 'VIP' : 'Free' }}
      </span>
    </header>

    <div class="mt-9">
      <h3 class="text-2xl font-extrabold tracking-[-.04em]">{{ prediction.home_team }}</h3>
      <p :class="['my-1 text-xs font-semibold', featured ? 'text-[var(--app-accent-ink)]/55' : 'text-[var(--app-muted)]']">against</p>
      <h3 class="text-2xl font-extrabold tracking-[-.04em]">{{ prediction.away_team }}</h3>
    </div>

    <p :class="['mt-4 flex items-center gap-1.5 text-xs font-semibold numbers', featured ? 'text-[var(--app-accent-ink)]/65' : 'text-[var(--app-muted)]']"><PhClock :size="14" />{{ kickoff }}</p>

    <div :class="['mt-auto border-t pt-4', featured ? 'border-[var(--app-accent-ink)]/20' : 'border-[var(--app-line)]']">
      <template v-if="!prediction.locked">
        <div class="flex items-end justify-between gap-4"><div><p :class="['text-xs', featured ? 'text-[var(--app-accent-ink)]/60' : 'text-[var(--app-muted)]']">{{ prediction.market }}</p><strong class="mt-1 block text-lg">{{ prediction.selection }}</strong></div><b v-if="prediction.odds" class="text-3xl tracking-[-.06em] numbers">{{ prediction.odds }}</b></div>
        <p v-if="prediction.analysis" :class="['mt-3 line-clamp-2 text-xs leading-5', featured ? 'text-[var(--app-accent-ink)]/65' : 'text-[var(--app-muted)]']">{{ prediction.analysis }}</p>
      </template>
      <a v-else href="#packages" class="flex items-center justify-between gap-3 text-sm font-bold">Open an access pass <PhArrowUpRight :size="17" /></a>
    </div>
  </article>
</template>
