<script setup>
defineProps({ compact: { type: Boolean, default: false } })
</script>

<template>
  <span class="brand-lockup inline-flex items-center gap-2.5">
    <span :class="['brand-mark-icon relative grid shrink-0 place-items-center overflow-hidden', compact ? 'size-8' : 'size-10']">
      <img src="/favicon.svg" alt="BK Football Predictions logo" class="size-full object-contain" />
    </span>
    <span class="flex flex-col leading-none">
      <strong :class="['font-extrabold tracking-[-.055em]', compact ? 'text-base' : 'text-xl']">BK</strong>
      <small class="mt-1 text-[8px] font-bold uppercase tracking-[.16em] text-[var(--app-muted)]">Football predictions</small>
    </span>
  </span>
</template>

<style scoped>
.brand-mark-icon {
  filter: drop-shadow(0 0 .7rem rgb(168 201 87 / .2));
  isolation: isolate;
}

.brand-mark-icon::before {
  position: absolute;
  z-index: 2;
  inset: -45% auto -45% -65%;
  width: 42%;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / .65), transparent);
  transform: skewX(-18deg);
  animation: brand-mark-shine 4.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes brand-mark-shine {
  0%, 68%, 100% { left: -65%; opacity: 0; }
  76% { opacity: 1; }
  90% { left: 130%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .brand-mark-icon::before { animation: none; }
}
</style>
