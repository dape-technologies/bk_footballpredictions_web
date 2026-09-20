<script setup>
defineProps({ compact: { type: Boolean, default: false } })
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <span :class="['relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--app-accent)] font-black tracking-[-.08em] text-[var(--app-accent-ink)]', compact ? 'size-8 text-xs' : 'size-10 text-sm']" aria-hidden="true">
      BK<span class="absolute inset-x-1 bottom-1 h-px -rotate-12 bg-[var(--app-accent-ink)]/35"></span>
    </span>
    <span class="flex flex-col leading-none">
      <strong :class="['font-extrabold tracking-[-.055em]', compact ? 'text-base' : 'text-xl']">BK</strong>
      <small class="mt-1 text-[8px] font-bold uppercase tracking-[.16em] text-[var(--app-muted)]">Football predictions</small>
    </span>
  </span>
</template>
