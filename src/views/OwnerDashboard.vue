<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  PhArrowClockwise, PhChartLineUp, PhCheck, PhCreditCard,
  PhHouse, PhPackage, PhPlus, PhSignOut, PhTrash, PhTrophy, PhUsersThree, PhX,
} from '@phosphor-icons/vue'
import BrandMark from '../components/BrandMark.vue'
import StatePanel from '../components/StatePanel.vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const section = ref('overview'), loading = ref(true), saving = ref(false), error = ref(''), notice = ref('')
const metrics = ref({}), packages = ref([]), payments = ref([]), wins = ref([]), customers = ref([])
const packageFile = ref(null), winFile = ref(null), confirmation = ref(null)
const sections = [
  { id:'overview', label:'Overview', note:'Operating pulse', icon:PhHouse },
  { id:'packages', label:'Packages', note:'Betslip catalogue', icon:PhPackage },
  { id:'recent-wins', label:'Recent wins', note:'Photos and captions', icon:PhTrophy },
  { id:'payments', label:'Payments', note:'Track transactions', icon:PhCreditCard },
  { id:'members', label:'Members', note:'Audience controls', icon:PhUsersThree },
]
const activeMeta = computed(() => sections.find((item)=>item.id===section.value))
const emptyPackage = () => ({ name:'', package_type:'', price:'', currency:'UGX', win_probability:70, commences_at:'', betslip_link:'', code:'', is_active:true })
const packageForm = reactive(emptyPackage())
const winForm = reactive({ caption:'' })
const money=(value)=>new Intl.NumberFormat('en-UG').format(value||0)
const formatDate=(value)=>value?new Intl.DateTimeFormat('en-UG',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'Not set'
const slugify=(value)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

async function loadAll(){loading.value=true;error.value='';try{const data=await Promise.all([
  api('/v1/owner/dashboard/'),api('/v1/owner/packages/'),api('/v1/owner/payments/'),api('/v1/owner/recent-wins/'),api('/v1/owner/customers/'),
]);[metrics.value,packages.value,payments.value,wins.value,customers.value]=data}catch(e){error.value=e.message}finally{loading.value=false}}
function flash(text){notice.value=text;setTimeout(()=>{notice.value=''},3500)}
async function createPackage(){saving.value=true;error.value='';try{const data=new FormData();Object.entries(packageForm).forEach(([key,value])=>data.append(key,key==='commences_at'?new Date(value).toISOString():value));data.append('slug',slugify(packageForm.name));data.append('image',packageFile.value);await api('/v1/owner/packages/',{method:'POST',body:data});Object.assign(packageForm,emptyPackage());packageFile.value=null;flash('Package saved.');await loadAll()}catch(e){error.value=e.message}finally{saving.value=false}}
async function togglePackage(plan,field){try{await api(`/v1/owner/packages/${plan.id}/`,{method:'PATCH',body:JSON.stringify({[field]:!plan[field]})});flash('Package updated.');await loadAll()}catch(e){error.value=e.message}}
async function createRecentWin(){saving.value=true;error.value='';try{const data=new FormData();data.append('caption',winForm.caption);data.append('image',winFile.value);data.append('is_published','true');await api('/v1/owner/recent-wins/',{method:'POST',body:data});winForm.caption='';winFile.value=null;flash('Recent win published.');await loadAll()}catch(e){error.value=e.message}finally{saving.value=false}}
async function resolvePayment(payment,decision){saving.value=true;error.value='';try{await api(`/v1/owner/payments/${payment.id}/resolve/`,{method:'POST',body:JSON.stringify({decision})});flash(decision==='confirm'?'Payment confirmed.':decision==='refund'?'Payment refunded.':'Payment marked failed.');await loadAll()}catch(e){error.value=e.message}finally{saving.value=false}}
async function toggleBlock(customer){try{await api(`/v1/owner/customers/${customer.id}/block/`,{method:'POST',body:JSON.stringify({blocked:!customer.is_blocked})});await loadAll()}catch(e){error.value=e.message}}
function requestDelete(label,path){confirmation.value={label,path}}
async function confirmDelete(){if(!confirmation.value)return;try{await api(confirmation.value.path,{method:'DELETE'});flash(`${confirmation.value.label} removed.`);confirmation.value=null;await loadAll()}catch(e){error.value=e.message}}
onMounted(loadAll)
</script>

<template>
  <div class="owner-shell">
    <aside class="owner-sidebar">
      <BrandMark />
      <p class="owner-label">Owner control room</p>
      <nav><button v-for="item in sections" :key="item.id" :class="{active:section===item.id}" @click="section=item.id"><component :is="item.icon" :size="20"/><span><strong>{{ item.label }}</strong><small>{{ item.note }}</small></span></button></nav>
      <div class="owner-identity"><span>{{ auth.user?.full_name?.charAt(0) }}</span><div><strong>{{ auth.user?.full_name }}</strong><small>Owner access</small></div></div>
      <button class="owner-signout" @click="auth.logout"><PhSignOut :size="18"/> Sign out</button>
    </aside>

    <main class="owner-main">
      <header class="owner-header"><div><p>BK / OPERATIONS</p><h1>{{ activeMeta.label }}</h1><span>{{ activeMeta.note }}</span></div><button class="icon-button" title="Refresh data" @click="loadAll"><PhArrowClockwise :size="20"/></button></header>
      <div class="owner-content">
        <div v-if="notice" class="toast"><PhCheck :size="18"/>{{ notice }}</div>
        <StatePanel v-if="error" title="The control room needs attention" :message="error" tone="error"><button class="text-button" @click="error=''">Dismiss</button></StatePanel>
        <div v-if="loading" class="owner-loading"><span></span><p>Syncing the control room…</p></div>

        <template v-else-if="section==='overview'">
          <div class="owner-kpis"><article><span>Members</span><strong>{{ metrics.customers }}</strong><small>registered users</small></article><article><span>Active packages</span><strong>{{ metrics.active_packages }}</strong><small>visible for purchase</small></article><article class="attention"><span>Pending payments</span><strong>{{ metrics.pending_payments }}</strong><small>need confirmation</small></article><article><span>Paid</span><strong>{{ metrics.paid_payments }}</strong><small>completed payments</small></article></div>
          <div class="owner-grid"><section class="owner-panel wide"><div class="panel-heading"><div><p>Package demand</p><h2>Purchase requests</h2></div><PhChartLineUp :size="24"/></div><div v-if="!metrics.package_demand?.length" class="empty-row">No package requests.</div><div v-else class="demand-list"><div v-for="plan in metrics.package_demand" :key="plan.id"><strong>{{ plan.name }}</strong><span><i :style="{width:`${Math.min(100,plan.request_count*12)}%`}"></i></span><b>{{ plan.request_count }} requests / {{ plan.active_count }} active</b></div></div></section><section class="owner-panel"><div class="panel-heading"><div><p>Revenue</p><h2>Confirmed payments</h2></div></div><strong class="money-figure"><small>UGX</small>{{ money(metrics.revenue) }}</strong><button class="text-button" @click="section='payments'">View payments</button></section></div>
        </template>

        <template v-else-if="section==='packages'">
          <section class="owner-panel"><div class="panel-heading"><div><p>New package</p><h2>Add a betslip</h2></div><PhPlus :size="22"/></div><form class="owner-form package-entry-form" @submit.prevent="createPackage"><div class="field-pair"><label>Package name<input v-model.trim="packageForm.name" required placeholder="Weekend accumulator"></label><label>Type<input v-model.trim="packageForm.package_type" required placeholder="Accumulator"></label></div><div class="field-pair"><label>Price (UGX)<input v-model="packageForm.price" required min="0" type="number"></label><label>Win probability (%)<input v-model="packageForm.win_probability" required min="0" max="100" type="number"></label></div><div class="field-pair"><label>Commences at<input v-model="packageForm.commences_at" required type="datetime-local"></label><label>Code<input v-model.trim="packageForm.code" required placeholder="BK-WKD-82"></label></div><label>Betslip link<input v-model.trim="packageForm.betslip_link" required type="url" placeholder="https://..."></label><label class="file-field">Photo<input required type="file" accept="image/png,image/jpeg,image/webp" @change="packageFile=$event.target.files[0]"><span>{{ packageFile?.name || 'Choose JPG, PNG or WebP' }}</span></label><div class="package-form-footer"><label class="admin-toggle"><input v-model="packageForm.is_active" type="checkbox"><span></span> Active</label><button class="button primary" :disabled="saving">{{ saving?'Saving…':'Save package' }}</button></div></form></section>
          <section class="owner-panel"><div class="panel-heading"><div><p>Packages</p><h2>{{ packages.length }} total</h2></div></div><div v-if="!packages.length" class="empty-row">No packages have been added.</div><div v-else class="table-wrap"><table class="package-admin-table"><thead><tr><th>Photo</th><th>Package name</th><th>Type</th><th>Price</th><th>Probability</th><th>Commences</th><th>Status</th><th>Betslip link</th><th>Code</th><th></th></tr></thead><tbody><tr v-for="plan in packages" :key="plan.id"><td><div class="package-table-photo" :style="plan.image_url?{backgroundImage:`url(${plan.image_url})`}:{}"><PhPackage v-if="!plan.image_url" :size="18"/></div></td><td><strong>{{ plan.name }}</strong></td><td>{{ plan.package_type }}</td><td><strong>UGX {{ money(plan.price) }}</strong></td><td>{{ plan.win_probability }}%</td><td>{{ formatDate(plan.commences_at) }}</td><td><label class="admin-toggle compact" :title="plan.is_active?'Deactivate package':'Activate package'"><input :checked="plan.is_active" type="checkbox" @change="togglePackage(plan,'is_active')"><span></span><b>{{ plan.is_active?'ON':'OFF' }}</b></label></td><td><a :href="plan.betslip_link" target="_blank" rel="noopener">Open link</a></td><td><code>{{ plan.code }}</code></td><td><button class="icon-button danger" title="Delete package" @click="requestDelete(plan.name,`/v1/owner/packages/${plan.id}/`)"><PhTrash :size="17"/></button></td></tr></tbody></table></div></section>
        </template>

        <template v-else-if="section==='recent-wins'">
          <div class="owner-split"><section class="owner-panel form-panel"><div class="panel-heading"><div><p>New recent win</p><h2>Upload result</h2></div><PhPlus :size="22"/></div><form class="owner-form" @submit.prevent="createRecentWin"><label>Caption<textarea v-model.trim="winForm.caption" required maxlength="500" rows="4" placeholder="Weekend accumulator landed."></textarea></label><label class="file-field">Photo<input required type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="winFile=$event.target.files[0]"><span>{{ winFile?.name || 'Choose a photo' }}</span></label><button class="button primary full" :disabled="saving">{{ saving?'Publishing…':'Publish recent win' }}</button></form></section><section class="owner-panel collection-panel"><div class="panel-heading"><div><p>Published wins</p><h2>{{ wins.length }} photos</h2></div></div><div v-if="!wins.length" class="empty-row">No recent wins uploaded.</div><div v-else class="win-admin-list"><article v-for="win in wins" :key="win.id"><img v-if="win.image_url" :src="win.image_url" :alt="win.caption"><div><p>{{ win.caption }}</p><small>{{ formatDate(win.settled_at) }}</small></div><button class="icon-button danger" title="Delete recent win" @click="requestDelete('this recent win',`/v1/owner/recent-wins/${win.id}/`)"><PhTrash :size="17"/></button></article></div></section></div>
        </template>

        <template v-else-if="section==='payments'">
          <section class="owner-panel"><div class="panel-heading"><div><p>Payments</p><h2>{{ payments.length }} transactions</h2></div><span>{{ metrics.pending_payments }} pending</span></div><div v-if="!payments.length" class="empty-row">No payments recorded.</div><div v-else class="table-wrap"><table class="payment-table"><thead><tr><th>Reference</th><th>User</th><th>Package</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody><tr v-for="payment in payments" :key="payment.id"><td><code>{{ payment.reference }}</code></td><td><strong>{{ payment.user.full_name }}</strong><small>{{ payment.user.phone }}</small></td><td>{{ payment.package.name }}</td><td><strong>{{ payment.currency }} {{ money(payment.amount) }}</strong></td><td><span :class="['status-chip',payment.status]">{{ payment.status }}</span></td><td>{{ formatDate(payment.created_at) }}</td><td><div v-if="payment.status==='pending'" class="decision-actions"><button class="table-action approve" :disabled="saving" @click="resolvePayment(payment,'confirm')">Confirm paid</button><button class="table-action reject" :disabled="saving" @click="resolvePayment(payment,'fail')">Mark failed</button></div><button v-else-if="payment.status==='paid'" class="table-action reject" :disabled="saving" @click="resolvePayment(payment,'refund')">Refund</button><span v-else>—</span></td></tr></tbody></table></div></section>
        </template>

        <template v-else-if="section==='members'">
          <section class="owner-panel"><div class="panel-heading"><div><p>Audience</p><h2>Registered members</h2></div><span>{{ customers.length }} total</span></div><div class="member-grid"><article v-for="customer in customers" :key="customer.id"><span>{{ customer.full_name.charAt(0) }}</span><div><h3>{{ customer.full_name }}</h3><p>{{ customer.phone }}</p><small>Joined {{ new Date(customer.created_at).toLocaleDateString('en-UG') }}</small></div><button :class="['table-action',customer.is_blocked?'approve':'reject']" @click="toggleBlock(customer)">{{ customer.is_blocked?'Restore':'Block' }}</button></article></div></section>
        </template>

      </div>
    </main>

    <div v-if="confirmation" class="confirm-layer" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="confirm-box"><button class="icon-button" @click="confirmation=null"><PhX :size="18"/></button><p>Confirm removal</p><h2 id="confirm-title">Remove {{ confirmation.label }}?</h2><span>This action cannot be undone.</span><div><button class="button secondary" @click="confirmation=null">Keep it</button><button class="button destructive" @click="confirmDelete">Remove permanently</button></div></div></div>
  </div>
</template>
