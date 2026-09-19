<script setup>defineProps({ title: String, message: String, tone: { type: String, default: 'neutral' } })</script>
<template><div class="state-panel" :class="`state-${tone}`"><strong>{{ title }}</strong><p>{{ message }}</p><slot /></div></template>
