<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowClockwise, PhCreditCard, PhCurrencyCircleDollar, PhGauge, PhPackage,
  PhShieldCheck, PhSignOut, PhSmiley, PhUsersThree, PhWallet, PhWarningCircle,
} from '@phosphor-icons/vue'
import '@fontsource-variable/outfit'
import BrandMark from '../components/BrandMark.vue'
import WalletPanel from '../components/WalletPanel.vue'
import SecurityPanel from '../components/SecurityPanel.vue'
import OperationsPanel from '../components/OperationsPanel.vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const section = ref('overview')
const loading = ref(true)
const error = ref('')
const analytics = ref(null)
const gateway = ref(null)
const gatewayTesting = ref(false)
const gatewayNotice = ref('')
const gatewayError = ref('')
const members = ref([])
async function toggleMember(member) {
  if (!window.confirm(`${member.is_blocked ? 'Restore' : 'Block'} this account?`)) return
  try {
    await api(`/v1/developer/users/${member.id}/block/`, { method: 'POST', body: JSON.stringify({ blocked: !member.is_blocked }) })
    members.value = await api('/v1/developer/users/')
  } catch (caught) { error.value = caught.message }
}
async function freezeOwner() {
  if (!window.confirm('Change the owner wallet payout freeze?')) return
  try {
    gateway.value = await api('/v1/developer/payment-gateway/', { method: 'PATCH', body: JSON.stringify({ owner_payouts_frozen: !gateway.value.owner_payouts_frozen }) })
  } catch (caught) { gatewayError.value = caught.message }
}

const sections = [
  { id: 'overview', label: 'Overview', note: 'System snapshot', icon: PhGauge },
  { id: 'finance', label: 'Finance', note: 'Revenue breakdown', icon: PhCurrencyCircleDollar },
  { id: 'commission', label: 'Commission', note: 'Platform transfer tracking', icon: PhSmiley },
  { id: 'wallet', label: 'Wallet & payouts', note: 'Relworx funds', icon: PhWallet },
  { id: 'users', label: 'Users', note: 'Member analytics', icon: PhUsersThree },
  { id: 'packages', label: 'Packages', note: 'Active plans', icon: PhPackage },
  { id: 'gateway', label: 'Payment gateway', note: 'Relworx connection', icon: PhCreditCard },
  { id: 'insights', label: 'Insights', note: 'Conversion and speed', icon: PhGauge },
  { id: 'security', label: 'Security', note: 'Sessions and verification', icon: PhUsersThree },
]

const activeMeta = computed(() => sections.find((item) => item.id === section.value) || sections[0])
const finance = computed(() => analytics.value?.finance || {})
const commission = computed(() => analytics.value?.commission || {})
const users = computed(() => analytics.value?.users || {})
const packages = computed(() => analytics.value?.packages || {})
const revenueChart = computed(() => analytics.value?.charts?.revenue || [])
const signupChart = computed(() => analytics.value?.charts?.signups || [])
const maxRevenue = computed(() => Math.max(...revenueChart.value.map((row) => Number(row.amount || 0)), 1))
const maxSignups = computed(() => Math.max(...signupChart.value.map((row) => Number(row.count || 0)), 1))
const maxPackageRevenue = computed(() => Math.max(...Object.values(finance.value.by_package || {}).map(Number), 1))

const money = (value) => `${Number(value || 0).toLocaleString('en-UG')} UGX`
const number = (value) => Number(value || 0).toLocaleString('en-UG')
const percent = (value) => `${Number(value || 0).toFixed(1)}%`
const date = (value) => value ? new Date(value).toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const shortDate = (value) => value ? new Date(value).toLocaleDateString('en-UG', { day: 'numeric', month: 'numeric' }) : ''
const barHeight = (value, max) => `${Math.max(3, (Number(value || 0) / Number(max || 1)) * 100)}%`
const barWidth = (value, max) => `${Math.max(1, (Number(value || 0) / Number(max || 1)) * 100)}%`
const titleCase = (value) => String(value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[analytics.value, gateway.value] = await Promise.all([
      api('/v1/developer/analytics/'), api('/v1/developer/payment-gateway/'),
    ])
  } catch (caught) { error.value = caught.message }
  finally { loading.value = false }
}

async function testConnection() {
  gatewayTesting.value = true
  gatewayError.value = ''
  gatewayNotice.value = ''
  try {
    const result = await api('/v1/developer/payment-gateway/relworx/check/', { method: 'POST', body: '{}' })
    gatewayNotice.value = `${result.message} Checked ${date(result.checked_at)}.`
  } catch (caught) { gatewayError.value = caught.message }
  finally { gatewayTesting.value = false }
}

onMounted(load)
onMounted(async () => { try { members.value = await api('/v1/developer/users/') } catch (caught) { error.value = caught.message } })
</script>

<template>
  <main class="dev-shell">
    <aside class="dev-sidebar">
      <div class="dev-brand"><BrandMark /><div><strong>BK</strong><span>DEV CONSOLE</span></div></div>
      <nav aria-label="Developer console">
        <button v-for="item in sections" :key="item.id" type="button" :aria-current="section === item.id ? 'page' : undefined" :title="item.label" :class="{ active: section === item.id }" @click="section = item.id">
          <component :is="item.icon" :size="21" />
          <span><strong>{{ item.label }}</strong><small>{{ item.note }}</small></span><i v-if="item.id === 'commission'"></i>
        </button>
      </nav>
      <footer>
        <div class="developer-identity"><b>{{ auth.user?.full_name?.charAt(0) || 'D' }}</b><span><strong>{{ auth.user?.full_name || 'BK Developer' }}</strong><small>Developer</small></span></div>
        <button type="button" @click="auth.logout"><PhSignOut :size="18" /> Sign out</button>
      </footer>
    </aside>

    <section class="dev-main">
      <header class="dev-header">
        <div><p>Developer analytics</p><h1>{{ activeMeta.label }}</h1><span>{{ activeMeta.note }}</span></div>
        <div class="header-actions"><time>{{ new Date().toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</time><b>DEV MODE</b><button type="button" aria-label="Open Security" title="Security" @click="section = 'security'"><PhShieldCheck :size="20" /></button><button type="button" aria-label="Sign out" title="Sign out" @click="auth.logout"><PhSignOut :size="20" /></button><button type="button" aria-label="Refresh analytics" title="Refresh" :disabled="loading" @click="load"><PhArrowClockwise :size="20" /></button></div>
        <label class="mobile-section"><span>Dashboard section</span><select v-model="section"><option v-for="item in sections" :key="item.id" :value="item.id">{{ item.label }}</option></select></label>
      </header>

      <div v-if="loading" class="page-state"><PhArrowClockwise class="spin" :size="30" /><p>Loading developer analytics…</p></div>
      <div v-else-if="error" class="page-state error"><PhWarningCircle :size="30" /><p>{{ error }}</p><button type="button" @click="load">Retry</button></div>

      <div v-else-if="analytics" class="dev-content">
        <SecurityPanel v-if="section === 'security'" />
        <OperationsPanel v-if="section === 'insights'" />
        <template v-if="section === 'overview'">
          <div class="metric-grid overview-grid">
            <article class="metric success"><span>Total revenue</span><strong>{{ money(finance.total_revenue) }}</strong><small>All confirmed payments</small></article>
            <article class="metric blue"><span>This month</span><strong>{{ money(finance.revenue_this_month) }}</strong><small>{{ money(finance.revenue_this_week) }} this week</small></article>
            <article class="metric gold"><span>Available commission</span><strong>{{ money(commission.available) }}</strong><small>{{ money(commission.total_withdrawn) }} withdrawn</small></article>
            <article class="metric teal"><span>Recorded commission</span><strong>{{ money(commission.total_earned) }}</strong><small>{{ money(commission.wallet_credited) }} credited to wallet</small></article>
            <article class="metric"><span>Today's revenue</span><strong>{{ money(finance.revenue_today) }}</strong><small>{{ number(finance.today?.confirmed_count) }} confirmed</small></article>
            <article class="metric"><span>Total users</span><strong>{{ number(users.total) }}</strong><small>+{{ number(users.new_this_month) }} this month</small></article>
            <article class="metric"><span>Active packages</span><strong>{{ number(packages.active_total) }}</strong><small>{{ number(packages.paid_purchase_count) }} paid purchases</small></article>
            <article class="metric warn"><span>Pending payments</span><strong>{{ number(finance.pending_count) }}</strong><small>Awaiting confirmation</small></article>
          </div>
          <div class="audit-strip" :class="{ healthy: finance.audit?.healthy }"><span>Today: <strong>{{ number(finance.today?.attempted_count) }} attempts</strong></span><span>Failed today: <strong>{{ number(finance.today?.failed_count) }}</strong></span><span>Ledger rows: <strong>{{ number(finance.audit?.ledger_count) }}</strong></span><span>Audit: <strong>{{ finance.audit?.healthy ? 'Reconciled' : 'Needs review' }}</strong></span><span>As of: <strong>{{ date(analytics.generated_at) }}</strong></span></div>
          <div class="chart-grid">
            <article class="chart-card"><span>Revenue — last 30 days</span><strong>{{ money(finance.total_revenue) }} total</strong><div class="bars"><i v-for="point in revenueChart" :key="point.date" :style="{ height: barHeight(point.amount, maxRevenue) }" :title="`${shortDate(point.date)}: ${money(point.amount)}`"></i></div></article>
            <article class="chart-card blue-chart"><span>New users — last 30 days</span><strong>{{ number(users.new_this_month) }} this month</strong><div class="bars"><i v-for="point in signupChart" :key="point.date" :style="{ height: barHeight(point.count, maxSignups) }" :title="`${shortDate(point.date)}: ${number(point.count)}`"></i></div></article>
          </div>
        </template>

        <template v-else-if="section === 'finance'">
          <div class="metric-grid"><article class="metric success"><span>Confirmed revenue</span><strong>{{ money(finance.total_revenue) }}</strong><small>{{ number(finance.by_status?.paid?.count) }} payments</small></article><article class="metric"><span>Pending amount</span><strong>{{ money(finance.pending_amount) }}</strong><small>{{ number(finance.pending_count) }} payments</small></article><article class="metric danger"><span>Failed payments</span><strong>{{ number(finance.failed_count) }}</strong><small>{{ money(finance.failed_amount) }} attempted</small></article><article class="metric blue"><span>All attempts</span><strong>{{ money(finance.attempted_amount) }}</strong><small>{{ number(finance.attempted_count) }} · {{ percent(finance.confirmation_rate) }} confirmed</small></article></div>
          <div class="detail-grid"><article class="panel"><h2>Revenue by package</h2><div class="hbars"><div v-for="(value, label) in finance.by_package" :key="label"><span>{{ label }}</span><i><b :style="{ width: barWidth(value, maxPackageRevenue) }"></b></i><strong>{{ money(value) }}</strong></div><p v-if="!Object.keys(finance.by_package || {}).length">No confirmed revenue yet.</p></div></article><article class="panel"><h2>Failure categories</h2><div class="fact-list"><div v-for="(row, label) in finance.failures_by_category" :key="label"><span>{{ titleCase(label) }}</span><strong>{{ number(row.count) }} · {{ money(row.amount) }}</strong></div><p v-if="!Object.keys(finance.failures_by_category || {}).length">No failed transactions recorded.</p></div></article></div>
          <article class="panel table-panel"><h2>Recent payment ledger</h2><p>Phone numbers are masked. This developer view is read-only.</p><div class="table-scroll"><table><thead><tr><th>Attempted</th><th>Status</th><th>Package</th><th>Amount</th><th>Gateway</th><th>Phone</th><th>Reference</th></tr></thead><tbody><tr v-for="row in finance.recent_payments" :key="row.id"><td>{{ date(row.created_at) }}</td><td><span :class="['status', row.status]">{{ titleCase(row.status) }}</span></td><td>{{ row.package }}</td><td>{{ money(row.amount) }}</td><td>{{ titleCase(row.provider) }}</td><td>{{ row.phone }}</td><td><code>{{ row.reference }}</code></td></tr></tbody></table></div></article>
        </template>

        <template v-else-if="section === 'commission'">
          <article class="commission-banner"><strong>{{ percent(Number(commission.ratio) * 100) }}</strong><div><h2>Platform commission <span>{{ commission.enabled ? '● LIVE' : '○ DISABLED' }}</span></h2><p>Commission credits are recorded from confirmed Relworx payments and paid through the developer wallet.</p></div><dl><div><dt>Available</dt><dd>{{ money(commission.available) }}</dd></div><div><dt>Recorded</dt><dd>{{ money(commission.total_earned) }}</dd></div></dl></article>
          <div class="metric-grid"><article class="metric gold"><span>Recorded total</span><strong>{{ money(commission.total_earned) }}</strong><small>All tracked commission</small></article><article class="metric success"><span>Available now</span><strong>{{ money(commission.available) }}</strong><small>Ready for payout</small></article><article class="metric blue"><span>Reserved</span><strong>{{ money(commission.reserved) }}</strong><small>Pending or processing</small></article><article class="metric"><span>Withdrawn</span><strong>{{ money(commission.total_withdrawn) }}</strong><small>Completed payouts</small></article></div>
          <article class="panel table-panel"><h2>Recent commission credits</h2><div class="table-scroll"><table><thead><tr><th>Confirmed</th><th>Payment</th><th>Package</th><th>Customer charge</th><th>Commission</th></tr></thead><tbody><tr v-for="row in commission.recent" :key="row.id"><td>{{ date(row.confirmed_at) }}</td><td><code>{{ row.payment_reference }}</code></td><td>{{ row.package }}</td><td>{{ money(row.amount) }}</td><td class="positive">{{ money(row.commission) }}</td></tr></tbody></table></div></article>
        </template>

        <WalletPanel v-else-if="section === 'wallet'" endpoint="/v1/developer" title="Developer commission wallet" />

        <template v-else-if="section === 'users'">
          <article class="panel table-panel"><h2>All users</h2><div class="table-scroll"><table><thead><tr><th>Name</th><th>Phone</th><th>Roles</th><th>Account</th></tr></thead><tbody><tr v-for="member in members" :key="member.id"><td>{{ member.full_name }}</td><td>{{ member.phone }}</td><td>{{ member.roles?.join(', ') }}</td><td><button v-if="!member.is_owner && !member.is_developer && member.id !== auth.user?.id" type="button" @click="toggleMember(member)">{{ member.is_blocked ? 'Restore' : 'Block' }}</button><span v-else>Protected</span></td></tr></tbody></table></div></article>
          <div class="metric-grid"><article class="metric blue"><span>Total members</span><strong>{{ number(users.total) }}</strong><small>Registered customer accounts</small></article><article class="metric"><span>New today</span><strong>{{ number(users.new_today) }}</strong></article><article class="metric"><span>New this week</span><strong>{{ number(users.new_this_week) }}</strong></article><article class="metric teal"><span>New this month</span><strong>{{ number(users.new_this_month) }}</strong></article></div>
          <article class="chart-card user-chart"><span>Daily signups — last 30 days</span><strong>{{ number(users.new_this_month) }} new this month</strong><div class="bars"><i v-for="point in signupChart" :key="point.date" :style="{ height: barHeight(point.count, maxSignups) }" :title="`${shortDate(point.date)}: ${number(point.count)}`"></i></div></article>
        </template>

        <template v-else-if="section === 'packages'">
          <div class="metric-grid"><article class="metric gold"><span>Total packages</span><strong>{{ number(packages.total) }}</strong></article><article class="metric success"><span>Active packages</span><strong>{{ number(packages.active_total) }}</strong></article><article class="metric blue"><span>Purchase requests</span><strong>{{ number(packages.purchase_count) }}</strong></article><article class="metric teal"><span>Paid purchases</span><strong>{{ number(packages.paid_purchase_count) }}</strong></article></div>
          <article class="panel table-panel"><h2>Package activity</h2><p>Configuration stays owner-only; developers can inspect demand and status.</p><div class="table-scroll"><table><thead><tr><th>Package</th><th>Type</th><th>Price</th><th>Closes</th><th>Status</th><th>Requests</th><th>Paid</th></tr></thead><tbody><tr v-for="item in packages.items" :key="item.id"><td>{{ item.name }}</td><td>{{ item.package_type }}</td><td>{{ money(item.price) }}</td><td>{{ date(item.closes_at) }}</td><td><span :class="['status', item.is_active ? 'paid' : 'failed']">{{ item.is_active ? 'Active' : 'Inactive' }}</span></td><td>{{ number(item.purchase_count) }}</td><td>{{ number(item.paid_count) }}</td></tr></tbody></table></div></article>
        </template>

        <template v-else-if="section === 'gateway'">
          <article class="panel"><h2>Owner payout controls</h2><p>{{ gateway?.owner_payouts_frozen ? 'Owner wallet payouts are frozen.' : 'Owner wallet payouts are available.' }}</p><button type="button" @click="freezeOwner">{{ gateway?.owner_payouts_frozen ? 'Unfreeze owner payouts' : 'Freeze owner payouts' }}</button></article>
          <article class="gateway-callout"><div><span>LIVE PAYMENT CONNECTION</span><h2>Relworx handles all BK payments</h2><p>BK uses one provider. This console can verify authentication and wallet connectivity, but it cannot switch payment routing.</p></div><b><i></i> ACTIVE</b></article>
          <p v-if="gatewayError" class="inline-message error">{{ gatewayError }}</p><p v-if="gatewayNotice" class="inline-message success">{{ gatewayNotice }}</p>
          <article class="gateway-card"><header><div><span>RELWORX</span><h2>Relworx</h2></div><b>{{ gateway?.provider?.configured ? 'IN USE' : 'NOT CONFIGURED' }}</b></header><p>{{ gateway?.provider?.message }}</p><div class="capabilities"><span :class="{ on: gateway?.provider?.capabilities?.collections }">Collections enabled</span><span :class="{ on: gateway?.provider?.capabilities?.payouts }">API payouts enabled</span><span :class="{ on: gateway?.provider?.capabilities?.signed_webhooks }">Signed webhooks</span><span :class="{ on: gateway?.provider?.capabilities?.scheduled_reconciliation }">Scheduled reconciliation</span></div><button type="button" :disabled="gatewayTesting || !gateway?.provider?.configured" @click="testConnection">{{ gatewayTesting ? 'Testing connection…' : 'Test connection' }}</button></article>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
.panel>button,.table-scroll td>button{min-height:2.75rem;padding:.65rem 1rem;border:1px solid #111;border-radius:.45rem;background:#111;color:#fff;font-weight:700;cursor:pointer}.panel>button:active,.table-scroll td>button:active{transform:translateY(1px)}
</style>

<style scoped>
.dev-shell{--ink:#080d17;--panel:#111827;--line:#263248;--muted:#7f8da5;--gold:#f5a400;min-height:100dvh;background:var(--ink);color:#eef2f7;font-family:'Outfit',sans-serif}.dev-sidebar{position:fixed;inset:0 auto 0 0;width:21.5rem;display:flex;flex-direction:column;border-right:1px solid var(--line);background:#0d1523;z-index:3}.dev-brand{height:8rem;display:flex;align-items:center;gap:1rem;padding:1.5rem 2rem;border-bottom:1px solid var(--line)}.dev-brand strong{display:block;font-size:1.35rem;letter-spacing:.14em}.dev-brand span{display:block;margin-top:.2rem;color:var(--gold);font-size:.68rem;font-weight:800;letter-spacing:.18em}.dev-sidebar nav{display:grid;gap:.2rem;padding:1rem}.dev-sidebar nav button{position:relative;display:grid;grid-template-columns:2rem 1fr auto;align-items:center;gap:.6rem;padding:.75rem 1rem;border:1px solid transparent;border-radius:.55rem;background:transparent;color:#7e8899;text-align:left;cursor:pointer;transition:.2s}.dev-sidebar nav button:hover{background:#131e2e;color:#d9e1ec}.dev-sidebar nav button.active{border-color:#5b471a;background:#27261f;color:var(--gold)}.dev-sidebar nav button span{display:grid}.dev-sidebar nav button strong{font-size:1rem}.dev-sidebar nav button small{margin-top:.1rem;color:#566175}.dev-sidebar nav button i{width:.45rem;height:.45rem;border-radius:50%;background:var(--gold);box-shadow:0 0 12px var(--gold)}.dev-sidebar footer{margin-top:auto;border-top:1px solid var(--line)}.developer-identity{display:flex;align-items:center;gap:.8rem;padding:1.2rem}.developer-identity>b{width:3rem;height:3rem;display:grid;place-items:center;border-radius:50%;background:var(--gold);color:#0b1019}.developer-identity span{display:grid}.developer-identity small{color:var(--muted)}.dev-sidebar footer>button{width:100%;display:flex;align-items:center;gap:.5rem;padding:1rem 1.5rem;border:0;border-top:1px solid var(--line);background:transparent;color:#7f8a9d;cursor:pointer}.dev-main{min-height:100dvh;margin-left:21.5rem}.dev-header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;min-height:8rem;padding:1.4rem 3rem;border-bottom:1px solid var(--line);background:rgba(8,13,23,.94);backdrop-filter:blur(14px)}.dev-header p{margin:0;color:var(--gold);font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.dev-header h1{margin:.35rem 0 .15rem;font-size:2rem;line-height:1;letter-spacing:-.04em}.dev-header>div>span{color:var(--muted)}.header-actions{display:flex;align-items:center;gap:1rem}.header-actions time{color:#59677e}.header-actions>b{padding:.45rem .8rem;border:1px solid #6b4a0c;border-radius:.35rem;background:#241b0c;color:var(--gold);font-size:.7rem;letter-spacing:.12em}.header-actions button{width:2.8rem;height:2.8rem;display:grid;place-items:center;border:1px solid var(--line);border-radius:.55rem;background:#172137;color:#8090a9;cursor:pointer}.mobile-section{display:none}.dev-content{width:min(100%,100rem);display:grid;gap:1.5rem;margin:0 auto;padding:2.6rem 3rem 4rem}.page-state{min-height:60vh;display:grid;place-items:center;align-content:center;gap:.7rem;color:var(--muted)}.page-state button{padding:.7rem 1.1rem;border:1px solid var(--line);background:var(--panel);color:#fff}.page-state.error{color:#fda4af}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.metric{position:relative;min-height:9.2rem;padding:1.55rem;border:1px solid var(--line);border-radius:.7rem;background:var(--panel);overflow:hidden}.metric:before{content:'';position:absolute;inset:0 auto 0 0;width:.22rem;background:#4b5b73}.metric.success:before{background:#20c997}.metric.blue:before{background:#3b82f6}.metric.gold:before{background:var(--gold)}.metric.teal:before{background:#2dd4bf}.metric.warn:before{background:#f97316}.metric.danger:before{background:#fb4d5e}.metric>span,.chart-card>span{color:#7f8da5;font-size:.72rem;font-weight:750;letter-spacing:.11em;text-transform:uppercase}.metric>strong{display:block;margin:1rem 0 .25rem;font-size:clamp(1.35rem,2vw,2rem);font-variant-numeric:tabular-nums;letter-spacing:-.035em}.metric>small{color:#647188}.audit-strip{display:flex;flex-wrap:wrap;gap:1rem 2.3rem;padding:1rem 1.5rem;border:1px solid #5b471a;border-left:3px solid var(--gold);border-radius:.7rem;background:#0d1525;color:#77869d}.audit-strip.healthy{border-left-color:#20c997}.audit-strip strong{color:#d9e1ec}.chart-grid,.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.chart-card,.panel,.gateway-card,.gateway-callout,.commission-banner{padding:1.6rem;border:1px solid var(--line);border-radius:.7rem;background:var(--panel)}.chart-card>strong{display:block;margin:.5rem 0 1rem;font-size:1.15rem}.bars{height:15rem;display:flex;align-items:flex-end;gap:.34rem;padding-top:1rem}.bars i{flex:1;min-width:.25rem;background:var(--gold);border-radius:.16rem .16rem 0 0;transition:.25s}.blue-chart .bars i,.user-chart .bars i{background:#3b82f6}.panel h2{margin:0;font-size:1rem}.panel>p{color:var(--muted)}.hbars,.fact-list{display:grid;gap:1rem;margin-top:1.5rem}.hbars>div{display:grid;grid-template-columns:8rem 1fr 8rem;align-items:center;gap:.8rem}.hbars i{height:.55rem;border-radius:1rem;background:#202d47;overflow:hidden}.hbars i b{display:block;height:100%;border-radius:inherit;background:var(--gold)}.hbars>div>strong{text-align:right;font-size:.75rem}.fact-list>div{display:flex;justify-content:space-between;padding-bottom:.8rem;border-bottom:1px solid var(--line)}.table-panel{padding:0;overflow:hidden}.table-panel h2,.table-panel>p{padding:0 1.5rem}.table-panel h2{padding-top:1.4rem}.table-scroll{overflow:auto}.table-scroll table{width:100%;border-collapse:collapse;font-size:.76rem}.table-scroll th,.table-scroll td{padding:.9rem 1rem;border-top:1px solid var(--line);text-align:left;white-space:nowrap}.table-scroll th{color:#718097;font-size:.65rem;text-transform:uppercase}.table-scroll code{color:#9fb0c9}.status{display:inline-block;padding:.25rem .45rem;border-radius:.3rem;background:#273245;color:#a8b3c5;font-size:.62rem;font-weight:800;text-transform:uppercase}.status.paid,.status.completed{background:#0e3a31;color:#5ee0ba}.status.failed,.status.expired,.status.cancelled{background:#431d2a;color:#fda4af}.status.pending,.status.created,.status.submitted,.status.needs_review{background:#3a3018;color:#f8cd67}.positive{color:#5ee0ba;font-weight:800}.commission-banner{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.5rem;border-color:#0c684f;background:linear-gradient(100deg,#071e1d,#171416)}.commission-banner>strong{color:var(--gold);font-size:3rem}.commission-banner h2{margin:0}.commission-banner h2 span{margin-left:.6rem;color:#35d5a3;font-size:.65rem}.commission-banner p{margin:.45rem 0 0;color:#7e8da4}.commission-banner dl{display:flex;gap:2.2rem}.commission-banner dt{color:#718097;font-size:.62rem;text-transform:uppercase}.commission-banner dd{margin:.35rem 0 0;font-weight:800}.user-chart{min-height:28rem}.user-chart .bars{height:20rem}.gateway-callout{display:flex;justify-content:space-between;gap:2rem}.gateway-callout span{color:#60a5fa;font-size:.68rem;font-weight:900;letter-spacing:.15em}.gateway-callout h2{margin:.8rem 0 .5rem;font-size:1.7rem}.gateway-callout p{max-width:48rem;color:#8390a5}.gateway-callout>b{align-self:flex-start;color:#34d399;font-size:.72rem}.gateway-callout>b i{display:inline-block;width:.55rem;height:.55rem;margin-right:.45rem;border-radius:50%;background:#34d399;box-shadow:0 0 0 .4rem rgba(52,211,153,.08)}.gateway-card{max-width:48rem}.gateway-card header{display:flex;justify-content:space-between}.gateway-card header span{color:#59677e;font-size:.66rem;font-weight:900;letter-spacing:.16em}.gateway-card h2{margin:.35rem 0}.gateway-card header>b{height:max-content;padding:.35rem .55rem;border:1px solid #1c765d;color:#4adeb3;font-size:.62rem}.gateway-card>p{color:#7f8da5}.capabilities{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.5rem 0}.capabilities span{padding:.45rem .65rem;background:#172136;color:#6e7a8f;font-size:.7rem}.capabilities span.on{color:#6ee7bf}.gateway-card>button{width:100%;padding:.85rem;border:1px solid #33435f;border-radius:.4rem;background:transparent;color:#e9eef5;font-weight:750;cursor:pointer}.gateway-card>button:hover{border-color:var(--gold);color:var(--gold)}.gateway-card>button:disabled{opacity:.45}.inline-message{max-width:48rem;margin:0;padding:.8rem 1rem;border-left:3px solid}.inline-message.success{border-color:#20c997;background:#0c2c27;color:#79e5c6}.inline-message.error{border-color:#fb7185;background:#381925;color:#fda4af}button:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:1100px){.dev-sidebar{width:17rem}.dev-main{margin-left:17rem}.metric-grid{grid-template-columns:repeat(2,1fr)}.commission-banner{grid-template-columns:auto 1fr}.commission-banner dl{grid-column:1/-1}.chart-grid,.detail-grid{grid-template-columns:1fr}}@media(max-width:760px){.dev-sidebar{position:static;width:auto}.dev-sidebar nav,.dev-sidebar footer{display:none}.dev-brand{height:auto;padding:1rem}.dev-main{margin-left:0}.dev-header{position:static;display:block;padding:1.2rem}.header-actions{display:none}.mobile-section{display:grid;gap:.35rem;margin-top:1rem;color:var(--muted);font-size:.7rem}.mobile-section select{padding:.7rem;border:1px solid var(--line);border-radius:.4rem;background:var(--panel);color:#fff}.dev-content{padding:1.2rem}.metric-grid{grid-template-columns:1fr}.metric{min-height:auto}.commission-banner{grid-template-columns:1fr}.commission-banner dl{display:grid;gap:1rem}.hbars>div{grid-template-columns:6rem 1fr}.hbars>div>strong{grid-column:2}.gateway-callout{display:grid}.bars{height:11rem}}
</style>

<style scoped>
/* BK visual system override: Almax is a logic benchmark, not a UI source. */
.dev-shell{--ink:#f4f4f1;--panel:#fff;--line:#dededb;--muted:#687078;--gold:#c7ff45;background:#f4f4f1;color:#111;font-family:"Plus Jakarta Sans Variable","Plus Jakarta Sans",Arial,sans-serif}
.dev-sidebar{width:16.25rem;padding:1.5rem 1rem;border-right:1px solid #262626;background:#0b0b0b;color:#fff}
.dev-brand{height:auto;justify-content:space-between;padding:.1rem .4rem 1.35rem;border-color:#2b2b2b}
.dev-brand strong{font-size:1rem;letter-spacing:.08em}.dev-brand span{color:#c7ff45;font-size:.61rem}
.dev-sidebar nav{min-height:0;gap:.35rem;padding:1.75rem 0 1rem;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#444 transparent}
.dev-sidebar nav button{display:flex;min-height:3.35rem;gap:.8rem;padding:.65rem .75rem;border-radius:.65rem;color:#aaa}
.dev-sidebar nav button:hover{border-color:#333;background:#181818;color:#fff}.dev-sidebar nav button.active{border-color:#fff;background:#fff;color:#0b0b0b}
.dev-sidebar nav button strong{font-size:.8rem}.dev-sidebar nav button small{color:#777;font-size:.66rem}.dev-sidebar nav button.active small{color:#5d5d5d}.dev-sidebar nav button i{margin-left:auto;background:#111;box-shadow:none}
.dev-sidebar footer{flex:0 0 auto;border-color:#2b2b2b}.developer-identity{padding:1.15rem .35rem}.developer-identity>b{width:2.35rem;height:2.35rem;border-radius:.55rem;background:#fff;color:#111}.developer-identity strong{font-size:.75rem}.developer-identity small{color:#777;font-size:.65rem}
.dev-sidebar footer>button{justify-content:center;margin-top:.2rem;padding:.75rem;border:1px solid #333;border-radius:.55rem;background:#171717;color:#fff;font-size:.75rem;font-weight:800}
.dev-main{margin-left:16.25rem;background:#f4f4f1}.dev-header{min-height:6.4rem;padding:1.25rem clamp(1.5rem,4vw,3.25rem);border-color:#dededb;background:rgb(255 255 255 / .94)}
.dev-header p{color:#6b6f73;font-size:.67rem}.dev-header h1{font-size:clamp(1.65rem,2.6vw,2.35rem)}.dev-header>div>span{color:#687078;font-size:.78rem}
.header-actions time{color:#73787d}.header-actions>b{border-color:#d7d7d2;background:#f3f3ef;color:#111}.header-actions button{border-color:#dededb;background:#fff;color:#111}.header-actions button:hover{background:#111;color:#fff}
.dev-content{padding:2rem clamp(1.5rem,4vw,3.25rem) 5rem}.page-state{color:#687078}.page-state button{border-color:#dededb;background:#fff;color:#111}
.metric{min-height:9.5rem;border-color:#dededb;border-radius:.8rem;background:#fff}.metric:before{display:none}.metric>span,.chart-card>span{color:#687078}.metric>strong{color:#111}.metric>small{color:#73787d}.metric.success,.metric.blue,.metric.gold,.metric.teal,.metric.warn,.metric.danger{border-top-color:#111}.metric.gold{border-top:3px solid #111}.metric.success{border-top:3px solid #87ad30}.metric.blue,.metric.teal{border-top:3px solid #777}.metric.warn,.metric.danger{border-top:3px solid #a12c26}
.audit-strip{border-color:#dededb;border-left-color:#111;background:#fff;color:#687078}.audit-strip.healthy{border-left-color:#87ad30}.audit-strip strong{color:#111}
.chart-card,.panel,.gateway-card,.gateway-callout,.commission-banner{border-color:#dededb;background:#fff;color:#111}.bars{border-bottom:1px solid #dededb}.bars i{background:#111}.blue-chart .bars i,.user-chart .bars i{background:#a5cf3c}.panel>p,.gateway-card>p,.gateway-callout p,.commission-banner p{color:#687078}
.hbars i{background:#e8e8e4}.hbars i b{background:#111}.fact-list>div,.table-scroll th,.table-scroll td{border-color:#e6e6e2}.table-scroll th{background:#f4f4f1;color:#555b60}.table-scroll code{color:#111}.table-scroll tbody tr:hover{background:#fafaf8}
.status{background:#ececea;color:#555}.status.paid,.status.completed{background:#e2f1da;color:#285726}.status.failed,.status.expired,.status.cancelled{background:#f8dfdc;color:#7f2922}.status.pending,.status.created,.status.submitted,.status.needs_review{background:#fff0c7;color:#705400}.positive{color:#285726}
.commission-banner{border-color:#cfd6c5;background:#f8faF4}.commission-banner>strong{color:#111}.commission-banner h2 span{color:#4d7a25}.commission-banner dt{color:#687078}
.gateway-callout span{color:#555}.gateway-callout>b{color:#3d6b23}.gateway-callout>b i{background:#86ad30;box-shadow:0 0 0 .4rem rgb(134 173 48 / .12)}.gateway-card header span{color:#687078}.gateway-card header>b{border-color:#94b55e;color:#3d6b23}.capabilities span{background:#f0f0ed;color:#73787d}.capabilities span.on{color:#31581c}.gateway-card>button{border-color:#111;background:#111;color:#fff}.gateway-card>button:hover{background:#c7ff45;color:#111}.inline-message.success{border-color:#87ad30;background:#eef6e5;color:#31581c}.inline-message.error{border-color:#a12c26;background:#fff2f0;color:#7f2922}
button:focus-visible,select:focus-visible{outline-color:#111}

@media(max-width:1100px){.dev-sidebar{width:5.4rem;padding-inline:.7rem}.dev-main{margin-left:5.4rem}.dev-brand>div,.dev-sidebar nav button span,.developer-identity span,.dev-sidebar footer>button{display:none}.dev-brand{justify-content:center}.dev-sidebar nav button{justify-content:center;padding-inline:.5rem}.developer-identity{justify-content:center}}

@media(max-width:760px){
  .dev-shell{padding-bottom:calc(5.9rem + env(safe-area-inset-bottom))}
  .dev-sidebar{position:fixed;inset:auto .75rem calc(.75rem + env(safe-area-inset-bottom));z-index:30;width:auto;height:4.85rem;display:block;padding:.42rem;overflow:hidden;border:1px solid #2f2f2f;border-radius:1.05rem;box-shadow:0 18px 42px rgb(0 0 0 / .3)}
  .dev-brand,.dev-sidebar footer{display:none}.dev-sidebar nav{display:flex;gap:.22rem;padding:0;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none}.dev-sidebar nav::-webkit-scrollbar{display:none}
  .dev-sidebar nav button{display:flex;flex:0 0 4.75rem;min-width:0;min-height:3.95rem;flex-direction:column;justify-content:center;gap:.2rem;padding:.3rem .12rem;border-radius:.75rem;scroll-snap-align:center}
  .dev-sidebar nav button span{display:block;width:100%}.dev-sidebar nav button strong{display:block;overflow:hidden;font-size:.54rem;text-align:center;text-overflow:ellipsis;white-space:nowrap}.dev-sidebar nav button small,.dev-sidebar nav button i{display:none}.dev-sidebar nav button svg{transition:transform .2s ease}.dev-sidebar nav button.active svg{transform:translateY(-1px) scale(1.12)}
  .dev-main{margin-left:0}.dev-header{position:sticky;display:flex;min-height:5.4rem;padding:1rem}.dev-header p,.dev-header>div>span{display:none}.dev-header h1{font-size:1.55rem}.header-actions{display:flex}.header-actions time,.header-actions>b{display:none}.mobile-section{display:none}
  .dev-content{max-width:100%;overflow:hidden;padding:1rem 1rem 2rem}.metric-grid{display:flex;gap:.65rem;margin-inline:-1rem;padding:0 1rem .75rem;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none}.metric-grid::-webkit-scrollbar{display:none}.metric{flex:0 0 min(78vw,18rem);min-height:8.75rem;padding:1rem;scroll-snap-align:start}.metric>strong{font-size:1.8rem}
  .chart-grid,.detail-grid{grid-template-columns:1fr}.chart-card,.panel,.gateway-card,.gateway-callout,.commission-banner{padding:1rem}.bars{height:12rem;gap:.22rem}.audit-strip{display:grid;gap:.55rem;padding:1rem}.commission-banner{grid-template-columns:1fr}.commission-banner>strong{font-size:2.35rem}.commission-banner dl{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.table-panel{margin-inline:-1rem;border-radius:0}.table-panel h2,.table-panel>p{padding-inline:1rem}.table-scroll{overscroll-behavior-x:contain}.hbars>div{grid-template-columns:6rem 1fr}.hbars>div>strong{grid-column:2;text-align:left}.gateway-callout{display:grid}.gateway-card{max-width:none}.capabilities{display:grid;grid-template-columns:1fr 1fr}.inline-message{max-width:none}.page-state{min-height:50dvh}
}

@media(prefers-reduced-motion:reduce){.dev-shell *,.dev-shell *::before,.dev-shell *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
</style>
