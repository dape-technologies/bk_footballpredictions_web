<script setup>
defineProps({ title: String, message: String, tone: { type: String, default: 'neutral' } })
</script>

<template>
  <div :class="['rounded-2xl border p-5', tone === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-100' : tone === 'success' ? 'border-[var(--app-accent)]/35 bg-[var(--app-accent)]/10' : 'border-[var(--app-line)] bg-[var(--app-surface)]']">
    <strong class="block text-base">{{ title }}</strong>
    <p class="mt-1 text-sm leading-6 text-[var(--app-muted)]">{{ message }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
