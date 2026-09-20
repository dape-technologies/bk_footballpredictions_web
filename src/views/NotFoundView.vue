<script setup>
import { PhArrowLeft } from '@phosphor-icons/vue'
</script>

<template>
  <section class="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-4xl place-items-center px-4 py-16 text-center sm:px-6">
    <div><p class="text-sm font-semibold text-[var(--app-accent)]">404: offside</p><h1 class="mt-4 text-balance text-5xl font-black tracking-[-.06em] sm:text-7xl">This route left the field.</h1><p class="mx-auto mt-5 max-w-md text-[var(--app-muted)]">The page may have moved or never made the final team sheet.</p><RouterLink to="/" class="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 py-3 font-bold text-[var(--app-accent-ink)]"><PhArrowLeft :size="18" /> Return home</RouterLink></div>
  </section>
</template>
