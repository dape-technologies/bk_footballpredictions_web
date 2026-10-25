<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  PhArrowClockwise,
  PhChartLineUp,
  PhCheck,
  PhCreditCard,
  PhCopy,
  PhDownloadSimple,
  PhEye,
  PhHouse,
  PhHourglassMedium,
  PhMoneyWavy,
  PhPackage,
  PhPencilSimple,
  PhPlus,
  PhReceipt,
  PhSignOut,
  PhTrash,
  PhTrophy,
  PhUsersThree,
  PhWallet,
  PhWarningCircle,
  PhX,
} from '@phosphor-icons/vue'
import '@fontsource-variable/plus-jakarta-sans'
import AdminMediaUploader from '../components/AdminMediaUploader.vue'
import WalletPanel from '../components/WalletPanel.vue'
import SecurityPanel from '../components/SecurityPanel.vue'
import OperationsPanel from '../components/OperationsPanel.vue'
import BrandMark from '../components/BrandMark.vue'
import { API_ROOT, api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const section = ref('overview')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const metrics = ref({})
const packages = ref([])
const payments = ref([])
const paymentReport = ref({ summary: {}, by_status: [], by_provider: [], by_package: [], failure_categories: [] })
const performance = ref({ summary: {}, by_package: [], unsettled: 0 })
const selectedPayment = ref(null)
const paymentFilters = reactive({ search: '', status: '', failure_category: '', from: '', to: '' })
const wins = ref([])
const customers = ref([])
const packageFile = ref(null)
const paidPackageFile = ref(null)
const packageEditor = ref(null)
const packageNameInput = ref(null)
const cloneSourceName = ref('')
const packageSlugSeed = ref('')
const editingPackageId = ref(null)
const existingCoverUrl = ref('')
const existingPaidImageUrl = ref('')
const winFile = ref(null)
const confirmation = ref(null)
const backgroundRefreshing = ref(false)
let liveRefreshTimer

const sections = [
  { id: 'overview', label: 'Overview', note: 'Operating pulse', icon: PhHouse },
  { id: 'packages', label: 'Packages', note: 'Betslip catalogue', icon: PhPackage },
  { id: 'recent-wins', label: 'Recent wins', note: 'Photos and captions', icon: PhTrophy },
  { id: 'payments', label: 'Payments', note: 'Track transactions', icon: PhCreditCard },
  { id: 'wallet', label: 'Wallet', note: 'Balances and payouts', icon: PhWallet },
  { id: 'members', label: 'Members', note: 'Audience controls', icon: PhUsersThree },
  { id: 'insights', label: 'Insights', note: 'Conversion and speed', icon: PhChartLineUp },
  { id: 'security', label: 'Security', note: 'Sessions and verification', icon: PhCheck },
]

const activeMeta = computed(() => sections.find((item) => item.id === section.value))
const overviewTiles = computed(() => [
  { label: 'Members', value: metrics.value.customers, note: 'Registered users', icon: PhUsersThree },
  { label: 'Active packages', value: metrics.value.active_packages, note: 'Visible for purchase', icon: PhPackage },
  { label: 'Pending payments', value: metrics.value.pending_payments, note: 'Need confirmation', icon: PhHourglassMedium },
  { label: 'Paid', value: metrics.value.paid_payments, note: 'Completed payments', icon: PhCreditCard },
  { label: 'Wallet balance', value: `UGX ${money(metrics.value.wallet?.available)}`, note: 'Available for payout', icon: PhWallet, money: true },
])
const emptyPackage = () => ({
  name: '',
  package_type: '',
  price: '',
  currency: 'UGX',
  win_probability: 70,
  closes_at: '',
  betslip_link: '',
  code: '',
  is_active: true,
})
const packageForm = reactive(emptyPackage())
const isEditingPackage = computed(() => editingPackageId.value !== null)
const winForm = reactive({ caption: '' })
const money = (value) => new Intl.NumberFormat('en-UG').format(value || 0)
const percent = (value) => `${Number(value || 0).toFixed(1)}%`
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'Not set'
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const toDatetimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60_000))
  return localDate.toISOString().slice(0, 16)
}
function paymentQuery() {
  const query = new URLSearchParams()
  Object.entries(paymentFilters).forEach(([key, value]) => { if (value) query.set(key, value) })
  return query.toString()
}

const paymentExportUrl = computed(() => `${API_ROOT}/v1/owner/payments/export.csv/${paymentQuery() ? `?${paymentQuery()}` : ''}`)

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const data = await Promise.all([
      api('/v1/owner/dashboard/'),
      api('/v1/owner/packages/'),
      api('/v1/owner/payments/'),
      api('/v1/owner/recent-wins/'),
      api('/v1/owner/customers/'),
      api('/v1/owner/payments/report/'),
      api('/v1/owner/performance/'),
    ])
    ;[metrics.value, packages.value, payments.value, wins.value, customers.value, paymentReport.value, performance.value] = data
  } catch (caught) {
    error.value = caught.message
  } finally {
    loading.value = false
  }
}

async function refreshLiveData() {
  if (document.hidden || loading.value || saving.value || backgroundRefreshing.value) return
  backgroundRefreshing.value = true
  try {
    metrics.value = await api('/v1/owner/dashboard/')
    if (section.value === 'packages') packages.value = await api('/v1/owner/packages/')
    if (section.value === 'recent-wins') wins.value = await api('/v1/owner/recent-wins/')
    if (section.value === 'members') customers.value = await api('/v1/owner/customers/')
    if (section.value === 'payments') {
      const query = paymentQuery()
      const suffix = query ? `?${query}` : ''
      ;[payments.value, paymentReport.value] = await Promise.all([
        api(`/v1/owner/payments/${suffix}`),
        api(`/v1/owner/payments/report/${suffix}`),
      ])
    }
  } catch {
    // Keep the last usable data during a transient background connection error.
    // The manual refresh button still reports errors when attention is needed.
  } finally {
    backgroundRefreshing.value = false
  }
}

function refreshWhenVisible() {
  if (!document.hidden) refreshLiveData()
}

async function loadPaymentOperations() {
  loading.value = true
  error.value = ''
  try {
    const query = paymentQuery()
    const suffix = query ? `?${query}` : ''
    ;[payments.value, paymentReport.value] = await Promise.all([
      api(`/v1/owner/payments/${suffix}`),
      api(`/v1/owner/payments/report/${suffix}`),
    ])
  } catch (caught) {
    error.value = caught.message
  } finally {
    loading.value = false
  }
}

async function openPayment(payment) {
  try { selectedPayment.value = await api(`/v1/owner/payments/${payment.id}/`) }
  catch (caught) { error.value = caught.message }
}

function flash(text) {
  notice.value = text
  setTimeout(() => { notice.value = '' }, 3500)
}

function resetPackageForm() {
  Object.assign(packageForm, emptyPackage())
  packageFile.value = null
  paidPackageFile.value = null
  cloneSourceName.value = ''
  packageSlugSeed.value = ''
  editingPackageId.value = null
  existingCoverUrl.value = ''
  existingPaidImageUrl.value = ''
}

async function editPackage(plan) {
  Object.assign(packageForm, {
    name: plan.name,
    package_type: plan.package_type,
    price: plan.price,
    currency: plan.currency || 'UGX',
    win_probability: plan.win_probability,
    closes_at: toDatetimeLocal(plan.closes_at),
    betslip_link: plan.betslip_link,
    code: plan.code,
    is_active: plan.is_active,
  })
  editingPackageId.value = plan.id
  cloneSourceName.value = ''
  packageSlugSeed.value = plan.slug
  packageFile.value = null
  paidPackageFile.value = null
  existingCoverUrl.value = plan.image_url || ''
  existingPaidImageUrl.value = plan.paid_image_url || ''
  error.value = ''
  await nextTick()
  packageEditor.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  packageNameInput.value?.focus({ preventScroll: true })
}

async function clonePackage(plan) {
  Object.assign(packageForm, {
    name: `${plan.name} copy`,
    package_type: plan.package_type,
    price: plan.price,
    currency: plan.currency || 'UGX',
    win_probability: plan.win_probability,
    closes_at: '',
    betslip_link: '',
    code: '',
    is_active: false,
  })
  packageFile.value = null
  paidPackageFile.value = null
  editingPackageId.value = null
  existingCoverUrl.value = ''
  existingPaidImageUrl.value = ''
  cloneSourceName.value = plan.name
  packageSlugSeed.value = `${slugify(plan.name)}-${Date.now().toString(36)}`
  error.value = ''
  await nextTick()
  packageEditor.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  packageNameInput.value?.focus({ preventScroll: true })
}

async function savePackage() {
  error.value = ''
  const missingImages = []
  if (!isEditingPackage.value && !packageFile.value) missingImages.push('Cover photo')
  if (!isEditingPackage.value && !paidPackageFile.value) missingImages.push('Paid package image')
  if (missingImages.length) {
    error.value = `${missingImages.join(' and ')}: this field is required.`
    return
  }

  saving.value = true
  try {
    const data = new FormData()
    Object.entries(packageForm).forEach(([key, value]) => {
      data.append(key, key === 'closes_at' ? new Date(value).toISOString() : value)
    })
    data.append('slug', packageSlugSeed.value || slugify(packageForm.name))
    if (packageFile.value) data.append('image', packageFile.value)
    if (paidPackageFile.value) data.append('paid_image', paidPackageFile.value)
    const endpoint = isEditingPackage.value
      ? `/v1/owner/packages/${editingPackageId.value}/`
      : '/v1/owner/packages/'
    await api(endpoint, { method: isEditingPackage.value ? 'PATCH' : 'POST', body: data })
    const message = isEditingPackage.value ? 'Package updated.' : 'Package saved.'
    resetPackageForm()
    flash(message)
    await loadAll()
  } catch (caught) {
    error.value = caught.message
  } finally {
    saving.value = false
  }
}

async function togglePackage(plan, field) {
  try {
    await api(`/v1/owner/packages/${plan.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: !plan[field] }),
    })
    flash('Package updated.')
    await loadAll()
  } catch (caught) {
    error.value = caught.message
  }
}

async function createRecentWin() {
  error.value = ''
  if (!winFile.value) {
    error.value = 'Add a result photo before publishing.'
    return
  }

  saving.value = true
  try {
    const data = new FormData()
    data.append('caption', winForm.caption)
    data.append('image', winFile.value)
    data.append('is_published', 'true')
    await api('/v1/owner/recent-wins/', { method: 'POST', body: data })
    winForm.caption = ''
    winFile.value = null
    flash('Recent win published.')
    await loadAll()
  } catch (caught) {
    error.value = caught.message
  } finally {
    saving.value = false
  }
}

async function toggleBlock(customer) {
  try {
    await api(`/v1/owner/customers/${customer.id}/block/`, {
      method: 'POST',
      body: JSON.stringify({ blocked: !customer.is_blocked }),
    })
    await loadAll()
  } catch (caught) {
    error.value = caught.message
  }
}

function requestDelete(label, path) {
  confirmation.value = { label, path }
}

async function confirmDelete() {
  if (!confirmation.value) return
  try {
    await api(confirmation.value.path, { method: 'DELETE' })
    flash(`${confirmation.value.label} removed.`)
    confirmation.value = null
    await loadAll()
  } catch (caught) {
    error.value = caught.message
  }
}

onMounted(async () => {
  await loadAll()
  liveRefreshTimer = window.setInterval(refreshLiveData, 15_000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
})

onBeforeUnmount(() => {
  window.clearInterval(liveRefreshTimer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<template>
  <div class="owner-shell">
    <aside class="owner-sidebar">
      <div class="owner-sidebar-main">
        <div class="owner-brand"><BrandMark /><span>Admin</span></div>
        <p class="owner-label">Owner control room</p>
        <nav aria-label="Owner dashboard sections">
          <button
            v-for="item in sections"
            :key="item.id"
            type="button"
            :class="{ active: section === item.id }"
            :aria-current="section === item.id ? 'page' : undefined"
            @click="section=item.id"
          >
            <component :is="item.icon" :size="20" weight="duotone" />
            <span><strong>{{ item.label }}</strong><small>{{ item.note }}</small></span>
          </button>
        </nav>
      </div>

      <div class="owner-sidebar-footer">
        <div class="owner-identity">
          <span>{{ auth.user?.full_name?.charAt(0) }}</span>
          <div><strong>{{ auth.user?.full_name }}</strong><small>Owner access</small></div>
        </div>
        <button type="button" class="owner-signout" @click="auth.logout">
          <PhSignOut :size="18" /> Sign out
        </button>
      </div>
    </aside>

    <main class="owner-main">
      <header class="owner-header">
        <div><p>BK owner workspace</p><h1>{{ activeMeta.label }}</h1><span>{{ activeMeta.note }}</span></div>
        <button type="button" class="icon-button" title="Refresh data" :disabled="loading" @click="loadAll">
          <PhArrowClockwise :size="20" :class="{ 'is-spinning': loading }" />
        </button>
      </header>

      <div class="owner-content">
        <SecurityPanel v-if="section === 'security'" />
        <OperationsPanel v-if="section === 'insights'" />
        <div v-if="notice" class="owner-toast" role="status"><PhCheck :size="18" />{{ notice }}</div>
        <div v-if="error" class="owner-alert" role="alert">
          <div><strong>The control room needs attention</strong><p>{{ error }}</p></div>
          <button type="button" @click="error=''">Dismiss</button>
        </div>

        <div v-if="loading" class="owner-loading"><span></span><p>Syncing the control room…</p></div>

        <template v-else-if="section === 'overview'">
          <section class="owner-kpis overview-kpis" aria-label="Business overview">
            <article v-for="tile in overviewTiles" :key="tile.label" :class="{ 'wallet-balance-card': tile.money }">
              <div class="owner-kpi-heading"><span>{{ tile.label }}</span><i><component :is="tile.icon" :size="20" weight="duotone" /></i></div>
              <strong :class="{ 'wallet-balance-value': tile.money }">{{ tile.value ?? 0 }}</strong><small>{{ tile.note }}</small>
            </article>
          </section>

          <div class="owner-grid">
            <section class="owner-panel wide">
              <div class="panel-heading"><div><p>Package demand</p><h2>Purchase requests</h2></div><PhChartLineUp :size="24" /></div>
              <div v-if="!metrics.package_demand?.length" class="empty-row">No package requests.</div>
              <div v-else class="demand-list">
                <div v-for="plan in metrics.package_demand" :key="plan.id">
                  <strong>{{ plan.name }}</strong>
                  <span><i :style="{ width: `${Math.min(100, plan.request_count * 12)}%` }"></i></span>
                  <b>{{ plan.request_count }} requests / {{ plan.paid_count }} paid</b>
                </div>
              </div>
            </section>

            <section class="owner-panel revenue-panel">
              <div class="panel-heading"><div><p>Revenue</p><h2>Confirmed payments</h2></div><PhMoneyWavy :size="24" weight="duotone" /></div>
              <strong class="money-figure"><small>UGX</small>{{ money(metrics.revenue) }}</strong>
              <button type="button" class="owner-text-button" @click="section='payments'">View payments</button>
            </section>
          </div>

          <section class="owner-panel performance-panel">
            <div class="panel-heading"><div><p>Measured performance</p><h2>Settled prediction record</h2></div><PhChartLineUp :size="24" /></div>
            <div class="report-kpis">
              <article><span>Hit rate</span><strong>{{ percent(performance.summary?.hit_rate) }}</strong><small>Wins ÷ decided predictions</small></article>
              <article><span>Settled</span><strong>{{ performance.summary?.settled || 0 }}</strong><small>{{ performance.summary?.won || 0 }} won · {{ performance.summary?.lost || 0 }} lost · {{ performance.summary?.void || 0 }} void</small></article>
              <article><span>Average odds</span><strong>{{ performance.summary?.average_odds || 0 }}</strong><small>Across settled predictions</small></article>
              <article><span>Awaiting result</span><strong>{{ performance.unsettled || 0 }}</strong><small>Published and unsettled</small></article>
            </div>
            <div v-if="performance.by_package?.length" class="table-wrap performance-table-wrap">
              <table>
                <thead><tr><th>Package</th><th>Settled</th><th>Won</th><th>Lost</th><th>Void</th><th>Hit rate</th><th>Average odds</th></tr></thead>
                <tbody><tr v-for="row in performance.by_package" :key="row.package_id || 'unassigned'"><td><strong>{{ row.package__name || 'Unassigned/free' }}</strong></td><td>{{ row.settled }}</td><td>{{ row.won }}</td><td>{{ row.lost }}</td><td>{{ row.void }}</td><td><strong>{{ percent(row.hit_rate) }}</strong></td><td>{{ row.average_odds }}</td></tr></tbody>
              </table>
            </div>
            <p class="measurement-note">Performance is calculated from published predictions with recorded results. Voids are excluded from the hit-rate denominator.</p>
          </section>
        </template>

        <template v-else-if="section === 'packages'">
          <section ref="packageEditor" class="owner-panel owner-editor-panel">
            <div class="panel-heading">
              <div><p>{{ isEditingPackage ? 'Editing package' : cloneSourceName ? 'New package from clone' : 'New package' }}</p><h2>{{ isEditingPackage ? `Edit ${packageForm.name}` : cloneSourceName ? `Clone ${cloneSourceName}` : 'Add a betslip' }}</h2></div>
              <PhPencilSimple v-if="isEditingPackage" :size="22" /><PhPlus v-else :size="22" />
            </div>
            <p v-if="isEditingPackage" class="measurement-note">Edit only to correct this same offer. For a new price, closing period or package cycle, use Clone so previous customers and payments remain separate.</p>
            <p v-if="cloneSourceName" class="measurement-note">Reusable details were copied. Review the new closing time, code, betslip link and both images before saving. The clone starts inactive and has no purchases or payment history.</p>
            <form class="owner-form package-entry-form" @submit.prevent="savePackage">
              <div class="owner-editor-grid">
                <div class="owner-form-fields">
                  <div class="field-pair">
                    <label><span>Package name</span><input ref="packageNameInput" v-model.trim="packageForm.name" required placeholder="Weekend accumulator"></label>
                    <label><span>Type</span><input v-model.trim="packageForm.package_type" required placeholder="Accumulator"></label>
                  </div>
                  <div class="field-pair">
                    <label><span>Price (UGX)</span><input v-model="packageForm.price" required min="0" type="number" placeholder="25000"></label>
                    <label><span>Win probability (%)</span><input v-model="packageForm.win_probability" required min="0" max="100" type="number"></label>
                  </div>
                  <div class="field-pair">
                    <label><span>Closes at</span><input v-model="packageForm.closes_at" required type="datetime-local"></label>
                    <label><span>Code</span><input v-model.trim="packageForm.code" required placeholder="BK-WKD-82"></label>
                  </div>
                  <label><span>Betslip link</span><input v-model.trim="packageForm.betslip_link" required type="url" placeholder="https://..."></label>
                </div>

                <div class="owner-media-fields">
                  <AdminMediaUploader
                    id="package-cover-photo"
                    v-model="packageFile"
                    :existing-url="existingCoverUrl"
                    label="Cover photo"
                    :help="isEditingPackage ? 'Current cover retained unless you choose a replacement.' : 'One JPG, PNG or WebP image. This appears publicly on the package card.'"
                    :allowed-file-types="['image/jpeg', 'image/png', 'image/webp']"
                  />
                  <AdminMediaUploader
                    id="package-paid-image"
                    v-model="paidPackageFile"
                    :existing-url="existingPaidImageUrl"
                    label="Paid package image"
                    :help="isEditingPackage ? 'Current paid image retained unless you choose a replacement.' : 'One JPG, PNG or WebP image. Customers see it only after payment is confirmed.'"
                    :allowed-file-types="['image/jpeg', 'image/png', 'image/webp']"
                  />
                </div>
              </div>

              <div class="package-form-footer">
                <label class="admin-toggle"><input v-model="packageForm.is_active" type="checkbox"><span></span><b>Active and visible</b></label>
                <div class="package-form-actions">
                  <button v-if="isEditingPackage || cloneSourceName" type="button" class="owner-secondary-button" :disabled="saving" @click="resetPackageForm">Cancel</button>
                  <button type="submit" class="owner-primary-button" :disabled="saving">{{ saving ? 'Saving…' : isEditingPackage ? 'Update package' : 'Save package' }}</button>
                </div>
              </div>
            </form>
          </section>

          <section class="owner-panel">
            <div class="panel-heading"><div><p>Packages</p><h2>{{ packages.length }} total</h2></div></div>
            <div v-if="!packages.length" class="empty-row">No packages have been added.</div>
            <div v-else class="table-wrap">
              <table class="package-admin-table">
                <thead><tr><th>Photo</th><th>Package name</th><th>Type</th><th>Price</th><th>Probability</th><th>Closes</th><th>Status</th><th>Betslip link</th><th>Code</th><th><span class="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  <tr v-for="plan in packages" :key="plan.id">
                    <td><div class="package-table-photo" :style="plan.image_url ? { backgroundImage: `url(${plan.image_url})` } : {}"><PhPackage v-if="!plan.image_url" :size="18" /></div></td>
                    <td><strong>{{ plan.name }}</strong></td><td>{{ plan.package_type }}</td><td><strong>UGX {{ money(plan.price) }}</strong></td><td>{{ plan.win_probability }}%</td><td>{{ formatDate(plan.closes_at) }}</td>
                    <td><label class="admin-toggle compact" :title="plan.is_active ? 'Deactivate package' : 'Activate package'"><input :checked="plan.is_active" type="checkbox" @change="togglePackage(plan, 'is_active')"><span></span><b>{{ plan.is_active ? 'ON' : 'OFF' }}</b></label></td>
                    <td><a :href="plan.betslip_link" target="_blank" rel="noopener">Open link</a></td><td><code>{{ plan.code }}</code></td>
                    <td>
                      <div class="package-row-actions">
                        <button type="button" class="package-edit-button" :aria-label="`Edit ${plan.name}`" title="Edit this same package" @click="editPackage(plan)"><PhPencilSimple :size="16" /> Edit</button>
                        <button type="button" class="package-clone-button" :aria-label="`Clone ${plan.name}`" title="Clone as a new package" @click="clonePackage(plan)"><PhCopy :size="16" /> Clone</button>
                        <button type="button" class="icon-button danger" :aria-label="`Delete ${plan.name}`" title="Delete package" @click="requestDelete(plan.name, `/v1/owner/packages/${plan.id}/`)"><PhTrash :size="17" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <template v-else-if="section === 'wallet'">
          <WalletPanel endpoint="/v1/owner" title="Owner wallet and payouts" />
        </template>

        <template v-else-if="section === 'recent-wins'">
          <div class="owner-split">
            <section class="owner-panel form-panel">
              <div class="panel-heading"><div><p>New recent win</p><h2>Upload result</h2></div><PhPlus :size="22" /></div>
              <form class="owner-form" @submit.prevent="createRecentWin">
                <label><span>Caption</span><textarea v-model.trim="winForm.caption" required maxlength="500" rows="5" placeholder="Weekend accumulator landed."></textarea><small>{{ winForm.caption.length }}/500</small></label>
                <AdminMediaUploader
                  id="recent-win-photo"
                  v-model="winFile"
                  label="Result photo"
                  help="One JPG, PNG, WebP or GIF image showing the published result."
                  :allowed-file-types="['image/jpeg', 'image/png', 'image/webp', 'image/gif']"
                />
                <button type="submit" class="owner-primary-button full" :disabled="saving">{{ saving ? 'Publishing…' : 'Publish recent win' }}</button>
              </form>
            </section>

            <section class="owner-panel collection-panel">
              <div class="panel-heading"><div><p>Published wins</p><h2>{{ wins.length }} photos</h2></div></div>
              <div v-if="!wins.length" class="empty-row">No recent wins uploaded.</div>
              <div v-else class="win-admin-list">
                <article v-for="win in wins" :key="win.id">
                  <img v-if="win.image_url" :src="win.image_url" :alt="win.caption">
                  <div><p>{{ win.caption }}</p><small>{{ formatDate(win.settled_at) }}</small></div>
                  <button type="button" class="icon-button danger" title="Delete recent win" @click="requestDelete('this recent win', `/v1/owner/recent-wins/${win.id}/`)"><PhTrash :size="17" /></button>
                </article>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="section === 'payments'">
          <section class="owner-kpis payment-report-kpis" aria-label="Filtered payment report">
            <article><div class="owner-kpi-heading"><span>Attempts</span><i><PhCreditCard :size="20" /></i></div><strong>{{ paymentReport.summary?.attempts || 0 }}</strong><small>{{ percent(paymentReport.summary?.success_rate) }} confirmed</small></article>
            <article><div class="owner-kpi-heading"><span>Gross revenue</span><i><PhMoneyWavy :size="20" /></i></div><strong>{{ money(paymentReport.summary?.gross_revenue) }}</strong><small>UGX confirmed</small></article>
            <article><div class="owner-kpi-heading"><span>Needs review</span><i><PhWarningCircle :size="20" /></i></div><strong>{{ paymentReport.summary?.needs_review || 0 }}</strong><small>Transactions requiring investigation</small></article>
          </section>

          <section class="owner-panel">
            <div class="panel-heading"><div><p>Payments</p><h2>{{ payments.length }} transactions</h2></div><a :href="paymentExportUrl" class="owner-secondary-button"><PhDownloadSimple :size="17" /> Export CSV</a></div>
            <form class="payment-filters" @submit.prevent="loadPaymentOperations">
              <label><span>Search</span><input v-model.trim="paymentFilters.search" placeholder="Reference, phone or package"></label>
              <label><span>Status</span><select v-model="paymentFilters.status"><option value="">All statuses</option><option v-for="value in ['created','submitted','pending','paid','failed','expired','cancelled','needs_review']" :key="value" :value="value">{{ value.replace('_', ' ') }}</option></select></label>
              <label><span>Failure</span><select v-model="paymentFilters.failure_category"><option value="">All failures</option><option v-for="value in ['customer','provider','system','validation']" :key="value" :value="value">{{ value }}</option></select></label>
              <label><span>From</span><input v-model="paymentFilters.from" type="date"></label>
              <label><span>To</span><input v-model="paymentFilters.to" type="date"></label>
              <button type="submit" class="owner-primary-button">Apply filters</button>
            </form>
            <div v-if="!payments.length" class="empty-row">No payments recorded.</div>
            <div v-else class="table-wrap">
              <table class="payment-table">
                <thead><tr><th>Reference</th><th>User</th><th>Package</th><th>Amount</th><th>Status</th><th>Created</th><th>Provider reference</th><th><span class="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  <tr v-for="payment in payments" :key="payment.id">
                    <td><code>{{ payment.reference }}</code></td><td><strong>{{ payment.user.full_name }}</strong><small>{{ payment.user.phone }}</small></td><td>{{ payment.package.name }}</td><td><strong>{{ payment.currency }} {{ money(payment.amount) }}</strong></td><td><span :class="['status-chip', payment.status]">{{ payment.status }}</span></td><td>{{ formatDate(payment.created_at) }}</td>
                    <td><code>{{ payment.internal_reference || 'Awaiting Relworx' }}</code></td>
                    <td><button type="button" class="icon-button" title="View transaction" @click="openPayment(payment)"><PhEye :size="17" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <template v-else-if="section === 'members'">
          <section class="owner-panel">
            <div class="panel-heading"><div><p>Audience</p><h2>Registered members</h2></div><span class="panel-count"><PhUsersThree :size="17" weight="duotone" />{{ customers.length }} total</span></div>
            <div v-if="!customers.length" class="empty-row">No registered members.</div>
            <div v-else class="table-wrap">
              <table class="member-table">
                <thead><tr><th>Member</th><th>Phone number</th><th>Joined</th><th>Account status</th><th><span class="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  <tr v-for="customer in customers" :key="customer.id">
                    <td><div class="member-cell"><span>{{ customer.full_name.charAt(0) }}</span><strong>{{ customer.full_name }}</strong></div></td>
                    <td>{{ customer.phone }}</td>
                    <td>{{ new Date(customer.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                    <td><span :class="['status-chip', customer.is_blocked ? 'cancelled' : 'active']">{{ customer.is_blocked ? 'Blocked' : 'Active' }}</span></td>
                    <td><button type="button" :class="['table-action', customer.is_blocked ? 'approve' : 'reject']" @click="toggleBlock(customer)">{{ customer.is_blocked ? 'Restore' : 'Block' }}</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
    </main>

    <div v-if="confirmation" class="confirm-layer" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="confirm-box">
        <button type="button" class="icon-button" aria-label="Close confirmation" @click="confirmation=null"><PhX :size="18" /></button>
        <p>Confirm removal</p><h2 id="confirm-title">Remove {{ confirmation.label }}?</h2><span>It will disappear from the dashboard. Required account and payment history stays protected.</span>
        <div><button type="button" class="owner-secondary-button" @click="confirmation=null">Keep it</button><button type="button" class="owner-danger-button" @click="confirmDelete">Remove</button></div>
      </div>
    </div>

    <div v-if="selectedPayment" class="confirm-layer payment-detail-layer" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title">
      <div class="confirm-box payment-detail-box">
        <button type="button" class="icon-button" aria-label="Close transaction detail" @click="selectedPayment=null"><PhX :size="18" /></button>
        <p>Transaction detail</p><h2 id="payment-detail-title">{{ selectedPayment.reference }}</h2>
        <div class="payment-detail-grid">
          <div><span>Status</span><strong><i :class="['status-chip', selectedPayment.status]">{{ selectedPayment.status }}</i></strong></div>
          <div><span>Customer</span><strong>{{ selectedPayment.user.full_name }}</strong><small>{{ selectedPayment.user.phone }}</small></div>
          <div><span>Package</span><strong>{{ selectedPayment.package.name }}</strong></div>
          <div><span>Amount</span><strong>{{ selectedPayment.currency }} {{ money(selectedPayment.amount) }}</strong></div>
          <div><span>Package price</span><strong>{{ selectedPayment.currency }} {{ money(selectedPayment.base_amount || selectedPayment.amount) }}</strong></div>
          <div><span>Estimated provider fee</span><strong>{{ selectedPayment.currency }} {{ money(selectedPayment.provider_fee_estimate) }}</strong></div>
          <div><span>Provider net</span><strong>{{ selectedPayment.currency }} {{ money(selectedPayment.provider_net_amount) }}</strong></div>
          <div><span>Developer commission</span><strong>{{ selectedPayment.currency }} {{ money(selectedPayment.developer_commission) }}</strong></div>
          <div><span>Relworx reference</span><code>{{ selectedPayment.internal_reference || 'Not assigned' }}</code></div>
          <div><span>Provider transaction</span><code>{{ selectedPayment.provider_transaction_id || 'Not supplied' }}</code></div>
          <div><span>Provider / fee</span><strong>{{ selectedPayment.provider }} · {{ selectedPayment.currency }} {{ money(selectedPayment.provider_charge) }}</strong></div>
          <div><span>Checks</span><strong>{{ selectedPayment.check_attempts }}</strong><small>Last {{ formatDate(selectedPayment.last_checked_at) }}</small></div>
        </div>
        <div v-if="selectedPayment.failure_reason" class="payment-failure-detail"><strong>{{ selectedPayment.failure_category || 'Payment' }} failure</strong><p>{{ selectedPayment.failure_reason }}</p></div>
        <section class="payment-timeline">
          <h3>Transaction timeline</h3>
          <ol><li v-for="event in selectedPayment.events" :key="event.id"><i></i><div><strong>{{ event.event_type.replaceAll('.', ' ') }}</strong><p>{{ event.message || event.status }}</p><small>{{ formatDate(event.created_at) }} · {{ event.source }}</small></div></li></ol>
        </section>
        <div class="payment-detail-actions"><a v-if="selectedPayment.receipt_url" :href="selectedPayment.receipt_url" target="_blank" rel="noopener" class="owner-primary-button"><PhReceipt :size="17" /> Open receipt</a><button type="button" class="owner-secondary-button" @click="selectedPayment=null">Close</button></div>
      </div>
    </div>
  </div>
</template>
