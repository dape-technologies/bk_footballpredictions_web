<script setup>
import { PhEye, PhLockKey, PhTarget, PhWarning } from '@phosphor-icons/vue'
</script>

<template>
  <div class="mx-auto min-h-[calc(100dvh-4rem)] max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
    <header class="max-w-3xl"><p class="text-sm font-semibold text-[var(--app-accent)]">How BK works</p><h1 class="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Fewer picks. Clearer accountability.</h1><p class="mt-5 max-w-2xl text-lg leading-7 text-[var(--app-muted)]">BK Football Predictions is built around selectivity, readable reasoning and a visible record.</p></header>
    <section class="mt-12 grid gap-4 md:grid-cols-2">
      <article class="rounded-2xl bg-[var(--app-accent)] p-7 text-[var(--app-accent-ink)] md:row-span-2"><PhTarget :size="36" weight="duotone" /><h2 class="mt-14 text-3xl font-extrabold tracking-[-.04em]">Selection before publication</h2><p class="mt-4 max-w-md text-[var(--app-accent-ink)]/70">Not every fixture belongs on the board. The owner publishes only matches that meet the day’s standard.</p></article>
      <article class="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-7"><PhEye :size="30" class="text-[var(--app-accent)]" /><h2 class="mt-8 text-2xl font-bold">Context beside confidence</h2><p class="mt-3 text-[var(--app-muted)]">Every open selection includes its market, kickoff and reasoning. Confidence never represents certainty.</p></article>
      <article class="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-7"><PhLockKey :size="30" class="text-[var(--app-accent)]" /><h2 class="mt-8 text-2xl font-bold">Access enforced at source</h2><p class="mt-3 text-[var(--app-muted)]">The API protects member analysis and releases it only to customers with active package access.</p></article>
    </section>
    <section class="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-7"><PhWarning :size="30" class="text-amber-300" /><h2 class="mt-5 text-2xl font-bold">Use predictions responsibly.</h2><p class="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">Football outcomes remain uncertain. Set limits, avoid chasing losses and never treat a selection as guaranteed income. BK is intended for adults aged 18 and over.</p></section>
  </div>
</template>
