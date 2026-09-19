<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight, PhCheck, PhClock } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'
const packages = ref([]), loading = ref(true), error = ref(''), message = ref(''), submitting = ref(null)
const auth = useAuthStore(), router = useRouter()
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
onMounted(async () => { try { packages.value = await api('/v1/packages/') } catch (e) { error.value = e.message } finally { loading.value = false } })
async function requestAccess(plan) {
  if (!auth.isAuthenticated) return router.push({ path: '/login', query: { next: '/packages' } })
  submitting.value = plan.id; message.value = ''; error.value = ''
  try { await api('/v1/me/subscriptions/', { method:'POST', body: JSON.stringify({ package_id: plan.id }) }); message.value = `Your ${plan.name} request is now with the owner.` }
  catch (e) { error.value = e.message } finally { submitting.value = null }
}
</script>
<template><div class="public-page"><section class="page-hero section-wrap"><p class="kicker">Membership</p><h1>Access built around<br>how you follow football.</h1><p>Choose a working rhythm. Requests are reviewed manually by the BK owner during the MVP.</p></section><section class="section-wrap content-section"><StatePanel v-if="message" title="Request received" :message="message" tone="success"/><StatePanel v-if="error" title="Something needs attention" :message="error" tone="error"/><div v-if="loading" class="package-grid"><div v-for="n in 3" :key="n" class="skeleton tall"></div></div><div v-else class="package-grid"><article v-for="(plan,index) in packages" :key="plan.id" class="plan-card" :class="{ featured: plan.is_featured }"><div class="plan-card-head"><span>0{{ index + 1 }}</span><i v-if="plan.is_featured">Recommended</i></div><p class="plan-duration"><PhClock :size="16" /> {{ plan.duration_days }}-day access</p><h2>{{ plan.name }}</h2><p>{{ plan.description }}</p><div class="plan-price"><small>{{ plan.currency }}</small><strong>{{ money(plan.price) }}</strong><span>informational</span></div><ul><li v-for="benefit in plan.benefits" :key="benefit"><PhCheck :size="16" weight="bold" /> {{ benefit }}</li></ul><button class="button primary full" :disabled="submitting === plan.id || !plan.is_open" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Sending request…' : plan.is_open ? 'Request access' : 'Requests closed' }} <PhArrowRight :size="17" /></button></article></div></section></div></template>
