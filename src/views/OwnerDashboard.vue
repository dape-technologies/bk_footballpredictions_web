<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  PhArrowClockwise,
  PhChartLineUp,
  PhCheck,
  PhCreditCard,
  PhHouse,
  PhHourglassMedium,
  PhMoneyWavy,
  PhPackage,
  PhPlus,
  PhSignOut,
  PhTrash,
  PhTrophy,
  PhUsersThree,
  PhX,
} from '@phosphor-icons/vue'
import '@fontsource-variable/plus-jakarta-sans'
import AdminMediaUploader from '../components/AdminMediaUploader.vue'
import BrandMark from '../components/BrandMark.vue'
import { api } from '../api/client'
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
const wins = ref([])
const customers = ref([])
const packageFile = ref(null)
const winFile = ref(null)
const confirmation = ref(null)

const sections = [
  { id: 'overview', label: 'Overview', note: 'Operating pulse', icon: PhHouse },
  { id: 'packages', label: 'Packages', note: 'Betslip catalogue', icon: PhPackage },
  { id: 'recent-wins', label: 'Recent wins', note: 'Photos and captions', icon: PhTrophy },
  { id: 'payments', label: 'Payments', note: 'Track transactions', icon: PhCreditCard },
  { id: 'members', label: 'Members', note: 'Audience controls', icon: PhUsersThree },
]

const activeMeta = computed(() => sections.find((item) => item.id === section.value))
const overviewTiles = computed(() => [
  { label: 'Members', value: metrics.value.customers, note: 'Registered users', icon: PhUsersThree },
  { label: 'Active packages', value: metrics.value.active_packages, note: 'Visible for purchase', icon: PhPackage },
  { label: 'Pending payments', value: metrics.value.pending_payments, note: 'Need confirmation', icon: PhHourglassMedium },
  { label: 'Paid', value: metrics.value.paid_payments, note: 'Completed payments', icon: PhCreditCard },
])
const emptyPackage = () => ({
  name: '',
  package_type: '',
  price: '',
  currency: 'UGX',
  win_probability: 70,
  commences_at: '',
  betslip_link: '',
  code: '',
  is_active: true,
})
const packageForm = reactive(emptyPackage())
const winForm = reactive({ caption: '' })
const money = (value) => new Intl.NumberFormat('en-UG').format(value || 0)
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'Not set'
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
    ])
    ;[metrics.value, packages.value, payments.value, wins.value, customers.value] = data
  } catch (caught) {
    error.value = caught.message
  } finally {
    loading.value = false
  }
}

function flash(text) {
  notice.value = text
  setTimeout(() => { notice.value = '' }, 3500)
}

async function createPackage() {
  error.value = ''
  if (!packageFile.value) {
    error.value = 'Add a package photo before saving.'
    return
  }

  saving.value = true
  try {
    const data = new FormData()
    Object.entries(packageForm).forEach(([key, value]) => {
      data.append(key, key === 'commences_at' ? new Date(value).toISOString() : value)
    })
    data.append('slug', slugify(packageForm.name))
    data.append('image', packageFile.value)
    await api('/v1/owner/packages/', { method: 'POST', body: data })
    Object.assign(packageForm, emptyPackage())
    packageFile.value = null
    flash('Package saved.')
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

async function resolvePayment(payment, decision) {
  saving.value = true
  error.value = ''
  try {
    await api(`/v1/owner/payments/${payment.id}/resolve/`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    })
    flash(decision === 'confirm' ? 'Payment confirmed.' : decision === 'refund' ? 'Payment refunded.' : 'Payment marked failed.')
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

onMounted(loadAll)
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
        <div v-if="notice" class="owner-toast" role="status"><PhCheck :size="18" />{{ notice }}</div>
        <div v-if="error" class="owner-alert" role="alert">
          <div><strong>The control room needs attention</strong><p>{{ error }}</p></div>
          <button type="button" @click="error=''">Dismiss</button>
        </div>

        <div v-if="loading" class="owner-loading"><span></span><p>Syncing the control room…</p></div>

        <template v-else-if="section === 'overview'">
          <section class="owner-kpis" aria-label="Business overview">
            <article v-for="tile in overviewTiles" :key="tile.label">
              <div class="owner-kpi-heading"><span>{{ tile.label }}</span><i><component :is="tile.icon" :size="20" weight="duotone" /></i></div>
              <strong>{{ tile.value ?? 0 }}</strong><small>{{ tile.note }}</small>
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
                  <b>{{ plan.request_count }} requests / {{ plan.active_count }} active</b>
                </div>
              </div>
            </section>

            <section class="owner-panel revenue-panel">
              <div class="panel-heading"><div><p>Revenue</p><h2>Confirmed payments</h2></div><PhMoneyWavy :size="24" weight="duotone" /></div>
              <strong class="money-figure"><small>UGX</small>{{ money(metrics.revenue) }}</strong>
              <button type="button" class="owner-text-button" @click="section='payments'">View payments</button>
            </section>
          </div>
        </template>

        <template v-else-if="section === 'packages'">
          <section class="owner-panel owner-editor-panel">
            <div class="panel-heading"><div><p>New package</p><h2>Add a betslip</h2></div><PhPlus :size="22" /></div>
            <form class="owner-form package-entry-form" @submit.prevent="createPackage">
              <div class="owner-editor-grid">
                <div class="owner-form-fields">
                  <div class="field-pair">
                    <label><span>Package name</span><input v-model.trim="packageForm.name" required placeholder="Weekend accumulator"></label>
                    <label><span>Type</span><input v-model.trim="packageForm.package_type" required placeholder="Accumulator"></label>
                  </div>
                  <div class="field-pair">
                    <label><span>Price (UGX)</span><input v-model="packageForm.price" required min="0" type="number" placeholder="25000"></label>
                    <label><span>Win probability (%)</span><input v-model="packageForm.win_probability" required min="0" max="100" type="number"></label>
                  </div>
                  <div class="field-pair">
                    <label><span>Commences at</span><input v-model="packageForm.commences_at" required type="datetime-local"></label>
                    <label><span>Code</span><input v-model.trim="packageForm.code" required placeholder="BK-WKD-82"></label>
                  </div>
                  <label><span>Betslip link</span><input v-model.trim="packageForm.betslip_link" required type="url" placeholder="https://..."></label>
                </div>

                <AdminMediaUploader
                  id="package-photo"
                  v-model="packageFile"
                  label="Package photo"
                  help="One JPG, PNG or WebP image. This appears on the public package card."
                  :allowed-file-types="['image/jpeg', 'image/png', 'image/webp']"
                />
              </div>

              <div class="package-form-footer">
                <label class="admin-toggle"><input v-model="packageForm.is_active" type="checkbox"><span></span><b>Active and visible</b></label>
                <button type="submit" class="owner-primary-button" :disabled="saving">{{ saving ? 'Saving…' : 'Save package' }}</button>
              </div>
            </form>
          </section>

          <section class="owner-panel">
            <div class="panel-heading"><div><p>Packages</p><h2>{{ packages.length }} total</h2></div></div>
            <div v-if="!packages.length" class="empty-row">No packages have been added.</div>
            <div v-else class="table-wrap">
              <table class="package-admin-table">
                <thead><tr><th>Photo</th><th>Package name</th><th>Type</th><th>Price</th><th>Probability</th><th>Commences</th><th>Status</th><th>Betslip link</th><th>Code</th><th><span class="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  <tr v-for="plan in packages" :key="plan.id">
                    <td><div class="package-table-photo" :style="plan.image_url ? { backgroundImage: `url(${plan.image_url})` } : {}"><PhPackage v-if="!plan.image_url" :size="18" /></div></td>
                    <td><strong>{{ plan.name }}</strong></td><td>{{ plan.package_type }}</td><td><strong>UGX {{ money(plan.price) }}</strong></td><td>{{ plan.win_probability }}%</td><td>{{ formatDate(plan.commences_at) }}</td>
                    <td><label class="admin-toggle compact" :title="plan.is_active ? 'Deactivate package' : 'Activate package'"><input :checked="plan.is_active" type="checkbox" @change="togglePackage(plan, 'is_active')"><span></span><b>{{ plan.is_active ? 'ON' : 'OFF' }}</b></label></td>
                    <td><a :href="plan.betslip_link" target="_blank" rel="noopener">Open link</a></td><td><code>{{ plan.code }}</code></td>
                    <td><button type="button" class="icon-button danger" title="Delete package" @click="requestDelete(plan.name, `/v1/owner/packages/${plan.id}/`)"><PhTrash :size="17" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
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
          <section class="owner-panel">
            <div class="panel-heading"><div><p>Payments</p><h2>{{ payments.length }} transactions</h2></div><span>{{ metrics.pending_payments }} pending</span></div>
            <div v-if="!payments.length" class="empty-row">No payments recorded.</div>
            <div v-else class="table-wrap">
              <table class="payment-table">
                <thead><tr><th>Reference</th><th>User</th><th>Package</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
                <tbody>
                  <tr v-for="payment in payments" :key="payment.id">
                    <td><code>{{ payment.reference }}</code></td><td><strong>{{ payment.user.full_name }}</strong><small>{{ payment.user.phone }}</small></td><td>{{ payment.package.name }}</td><td><strong>{{ payment.currency }} {{ money(payment.amount) }}</strong></td><td><span :class="['status-chip', payment.status]">{{ payment.status }}</span></td><td>{{ formatDate(payment.created_at) }}</td>
                    <td><div v-if="payment.status === 'pending'" class="decision-actions"><button type="button" class="table-action approve" :disabled="saving" @click="resolvePayment(payment, 'confirm')">Confirm paid</button><button type="button" class="table-action reject" :disabled="saving" @click="resolvePayment(payment, 'fail')">Mark failed</button></div><button v-else-if="payment.status === 'paid'" type="button" class="table-action reject" :disabled="saving" @click="resolvePayment(payment, 'refund')">Refund</button><span v-else>—</span></td>
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
  </div>
</template>
