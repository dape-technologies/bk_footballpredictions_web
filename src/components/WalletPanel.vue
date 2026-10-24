<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhArrowClockwise, PhPaperPlaneTilt, PhWallet } from '@phosphor-icons/vue'
import { api } from '../api/client'

const props = defineProps({ endpoint: { type: String, required: true }, title: { type: String, default: 'Wallet and payouts' } })
const data = ref(null)
const amount = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const wallet = computed(() => data.value?.wallet || {})
const money = (value) => `UGX ${Number(value || 0).toLocaleString('en-UG')}`
const date = (value) => value ? new Date(value).toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'

async function load() {
  loading.value = true
  error.value = ''
  try { data.value = await api(`${props.endpoint}/wallet/`) }
  catch (caught) { error.value = caught.message }
  finally { loading.value = false }
}

async function requestPayout() {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const requestToken = window.crypto?.randomUUID?.() || `payout-${Date.now()}`
    const response = await api(`${props.endpoint}/payout-requests/`, {
      method: 'POST', body: JSON.stringify({ amount: Number(amount.value), request_token: requestToken }),
    })
    notice.value = response.message
    amount.value = ''
    data.value = response
  } catch (caught) { error.value = caught.message }
  finally { saving.value = false }
}

async function cancel(item) {
  if (!window.confirm(`Cancel payout request ${item.reference}?`)) return
  try {
    data.value = await api(`${props.endpoint}/payout-requests/${item.id}/cancel/`, { method: 'POST' })
    notice.value = 'Payout request cancelled and funds released.'
  } catch (caught) { error.value = caught.message }
}

onMounted(load)
</script>

<template>
  <section class="wallet-panel">
    <header><div><p>Relworx settlement</p><h2>{{ title }}</h2></div><button type="button" aria-label="Refresh wallet" :disabled="loading" @click="load"><PhArrowClockwise :size="19" /></button></header>
    <p v-if="error" class="wallet-message error" role="alert">{{ error }}</p>
    <p v-if="notice" class="wallet-message success" role="status">{{ notice }}</p>
    <p v-if="loading" class="wallet-empty">Loading wallet balances...</p>
    <template v-else-if="data">
      <div class="wallet-metrics">
        <article><span>Available</span><strong>{{ money(wallet.available) }}</strong><small>Ready for payout</small></article>
        <article><span>Reserved</span><strong>{{ money(wallet.reserved) }}</strong><small>Pending or processing</small></article>
        <article><span>Total credited</span><strong>{{ money(wallet.credited) }}</strong><small>{{ money(wallet.today_credited) }} today</small></article>
      </div>
      <div class="wallet-grid">
        <form @submit.prevent="requestPayout">
          <PhWallet :size="25" />
          <h3>Request payout</h3>
          <p>{{ data.execution_mode === 'immediate' ? 'Approved requests are sent to Relworx immediately.' : 'Requests reserve funds until live execution is enabled.' }}</p>
          <label>Amount (UGX)<input v-model="amount" type="number" required :min="data.minimum_payout" :max="wallet.available" placeholder="Enter amount"></label>
          <small>Allowed: {{ money(data.minimum_payout) }} to {{ money(data.maximum_payout) }}</small>
          <button type="submit" :disabled="saving || !data.destination_configured || Number(amount) > Number(wallet.available)"><PhPaperPlaneTilt :size="17" />{{ saving ? 'Submitting...' : 'Submit payout' }}</button>
          <p v-if="!data.destination_configured" class="config-note">The payout destination is not configured on the server.</p>
          <p v-else-if="!data.payouts_enabled" class="config-note">Relworx live payouts are currently server-disabled.</p>
        </form>
        <div class="wallet-list"><h3>Payout requests</h3><p v-if="!data.requests.length" class="wallet-empty">No payout requests yet.</p><article v-for="item in data.requests" :key="item.id"><div><strong>{{ money(item.amount) }}</strong><span :class="item.status">{{ item.status }}</span><small>{{ item.reference }} · {{ date(item.created_at) }} · {{ item.destination }}</small><em v-if="item.failure_reason">{{ item.failure_reason }}</em></div><button v-if="item.status === 'pending'" type="button" @click="cancel(item)">Cancel</button></article></div>
      </div>
      <div class="wallet-ledger"><h3>Ledger</h3><div class="ledger-scroll"><table><thead><tr><th>Date</th><th>Entry</th><th>Reference</th><th>Amount</th></tr></thead><tbody><tr v-for="entry in data.ledger" :key="entry.id"><td>{{ date(entry.created_at) }}</td><td>{{ entry.entry_type.replaceAll('_', ' ') }}</td><td><code>{{ entry.reference || 'Internal' }}</code></td><td :class="Number(entry.amount) < 0 ? 'negative' : 'positive'">{{ money(entry.amount) }}</td></tr></tbody></table></div></div>
    </template>
  </section>
</template>

<style scoped>
.wallet-panel{display:grid;gap:1rem;color:#111}.wallet-panel>header{display:flex;align-items:center;justify-content:space-between}.wallet-panel header p{margin:0 0 .35rem;color:#687078;font-size:.68rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.wallet-panel h2,.wallet-panel h3{margin:0}.wallet-panel>header button{width:2.75rem;height:2.75rem;display:grid;place-items:center;border:1px solid #d9d9d5;border-radius:.6rem;background:#fff;cursor:pointer}.wallet-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}.wallet-metrics article,.wallet-grid>*,.wallet-ledger{padding:1.1rem;border:1px solid #deded9;border-radius:.65rem;background:#fff}.wallet-metrics span{color:#687078;font-size:.68rem;font-weight:800;text-transform:uppercase}.wallet-metrics strong{display:block;margin:.55rem 0;font-size:1.45rem}.wallet-metrics small{color:#73787d}.wallet-grid{display:grid;grid-template-columns:minmax(17rem,.7fr) minmax(24rem,1.3fr);gap:1rem}.wallet-grid form{display:grid;align-content:start;gap:.75rem}.wallet-grid form>p{margin:0;color:#687078;line-height:1.55}.wallet-grid label{display:grid;gap:.4rem;margin-top:.5rem;font-size:.72rem;font-weight:800;text-transform:uppercase}.wallet-grid input{min-height:3rem;padding:.75rem;border:1px solid #cfcfca;border-radius:.5rem;font:inherit}.wallet-grid form>button{min-height:3rem;display:flex;align-items:center;justify-content:center;gap:.45rem;border:0;border-radius:.5rem;background:#111;color:#fff;font-weight:850;cursor:pointer}.wallet-grid button:disabled{cursor:not-allowed;opacity:.45}.config-note{color:#933b32!important;font-size:.75rem}.wallet-list{padding:0;overflow:hidden}.wallet-list h3,.wallet-ledger h3{padding:1rem;margin:0;border-bottom:1px solid #e6e6e2}.wallet-list article{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;border-bottom:1px solid #ededE9}.wallet-list article div{display:grid;gap:.3rem}.wallet-list span{width:max-content;padding:.2rem .4rem;border-radius:999px;background:#eee;font-size:.6rem;font-weight:850;text-transform:uppercase}.wallet-list span.completed{background:#e0f1da;color:#285726}.wallet-list span.failed{background:#f8dfdc;color:#7f2922}.wallet-list span.pending,.wallet-list span.processing{background:#fff3cf;color:#6f5200}.wallet-list small{color:#73787d}.wallet-list em{color:#8b3029;font-size:.72rem;font-style:normal}.wallet-list button{border:1px solid #a6372e;border-radius:.4rem;background:#fff;color:#8b3029;padding:.5rem .7rem;cursor:pointer}.wallet-message{margin:0;padding:.8rem;border-radius:.5rem}.wallet-message.error{background:#fff0ee;color:#7f2922}.wallet-message.success{background:#e9f5e4;color:#285726}.wallet-empty{padding:1rem;color:#73787d}.ledger-scroll{overflow:auto}.wallet-ledger{padding:0;overflow:hidden}.wallet-ledger table{width:100%;border-collapse:collapse;font-size:.75rem}.wallet-ledger th,.wallet-ledger td{padding:.75rem 1rem;border-bottom:1px solid #ecece8;text-align:left}.wallet-ledger th{background:#f6f6f3;color:#687078;text-transform:uppercase}.positive{color:#285726;font-weight:800}.negative{color:#8b3029;font-weight:800}@media(max-width:800px){.wallet-metrics,.wallet-grid{grid-template-columns:1fr}}
</style>
