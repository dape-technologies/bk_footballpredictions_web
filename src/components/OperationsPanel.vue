<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'
const data = ref(null)
const error = ref('')
const segment = ref('package')
async function load() { try { data.value = await api('/v1/operations/report/') } catch (caught) { error.value = caught.message } }
const label = (value) => value.replaceAll('_', ' ')
onMounted(load)
</script>
<template>
  <section class="operations-panel"><header><div><p>Customer journey and performance</p><h2>Conversion insights</h2></div><button type="button" @click="load">Refresh</button></header><p v-if="error" role="alert">{{ error }}</p>
    <template v-if="data">
      <p>{{ data.funnel.counting_note }}</p><p>{{ data.funnel.approval_note }}</p>
      <div class="stage-grid"><article v-for="stage in data.funnel.stages" :key="stage"><span>{{ label(stage) }}</span><strong>{{ data.funnel.totals[stage] }}</strong></article></div>
      <p>Checkouts without confirmation: <strong>{{ data.funnel.totals.checkout_without_confirmation }}</strong>. View-to-paid conversion: {{ data.funnel.totals.view_to_paid_percent == null ? 'Not enough data' : data.funnel.totals.view_to_paid_percent + '%' }}.</p>
      <label>Break down by<select v-model="segment"><option value="package">Package</option><option value="device">Device</option><option value="browser">Browser</option><option value="hour">Hour (Kampala)</option><option value="customer_type">New / returning customer</option></select></label>
      <div class="scroll"><table><thead><tr><th>Segment</th><th v-for="stage in data.funnel.stages" :key="stage">{{ label(stage) }}</th><th>No confirmation</th></tr></thead><tbody><tr v-for="row in data.funnel.segments[segment]" :key="row.label"><td>{{ row.label }}</td><td v-for="stage in data.funnel.stages" :key="stage">{{ row[stage] }}</td><td>{{ row.checkout_without_confirmation }}</td></tr></tbody></table></div>
      <h3>Mobile-money attempts</h3><p>Network is taken from Relworx responses. Unknown networks are shown explicitly.</p><div class="scroll"><table><thead><tr><th>Network</th><th>Attempts</th><th>Confirmed</th><th>Failed</th></tr></thead><tbody><tr v-for="(row, network) in data.funnel.networks" :key="network"><td>{{ network }}</td><td>{{ row.attempts }}</td><td>{{ row.confirmed }}</td><td>{{ row.failed }}</td></tr></tbody></table></div>
      <h3>Failure categories</h3><p v-if="!data.funnel.failure_categories.length">No categorized failures in this period.</p><p v-for="row in data.funnel.failure_categories" :key="row.failure_category">{{ row.failure_category }}: {{ row.count }}</p>
      <h3>Real-user performance — last 30 days</h3><p>75th percentile, split by device. LCP target &lt; 2,500 ms; INP &lt; 200 ms; CLS &lt; 0.1. New measurements accumulate after release.</p><div v-if="data.web_vitals.length" class="scroll"><table><thead><tr><th>Metric</th><th>Device</th><th>Samples</th><th>p75</th><th>Target</th></tr></thead><tbody><tr v-for="row in data.web_vitals" :key="row.metric + row.device"><td>{{ row.metric }}</td><td>{{ row.device }}</td><td>{{ row.samples }}</td><td :class="{ slow: row.p75 > row.target }">{{ Number(row.p75).toFixed(row.metric === 'CLS' ? 3 : 0) }}</td><td>{{ row.target }}</td></tr></tbody></table></div><p v-else>No real-user performance samples yet.</p>
    </template>
  </section>
</template>
<style scoped>
.operations-panel{display:grid;gap:1rem;color:#111}.operations-panel header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.operations-panel h2{font-size:1.7rem;margin:.4rem 0}.operations-panel p{color:#687078;font-size:.8rem;line-height:1.6;margin:0}.operations-panel button,.operations-panel select{padding:.7rem 1rem;min-height:2.8rem;border:1px solid #ccc;border-radius:.4rem;background:#fff;color:#111}.operations-panel label{display:grid;gap:.4rem;font-size:.8rem}.stage-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem}.stage-grid article{padding:1rem;border:1px solid #dededb;border-radius:.6rem;background:#fff}.stage-grid span{font-size:.7rem;color:#687078;text-transform:capitalize}.stage-grid strong{display:block;margin-top:.7rem;font-size:1.8rem}.scroll{max-width:100%;overflow:auto;border:1px solid #dededb;border-radius:.5rem;background:#fff}.operations-panel table{width:100%;border-collapse:collapse;font-size:.75rem}.operations-panel th,.operations-panel td{padding:.8rem;text-align:left;border-bottom:1px solid #e6e6e2;white-space:nowrap}.operations-panel th{background:#f4f4f1;text-transform:capitalize}.slow{color:#a12c26;font-weight:800}@media(max-width:760px){.stage-grid{display:flex;overflow:auto}.stage-grid article{flex:0 0 9rem}}
</style>
<style scoped>.operations-panel select,.operations-panel option{color:#111;background:#fff}</style>
