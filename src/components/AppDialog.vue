<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight, PhCalendar, PhCheckCircle, PhClock, PhLockKey, PhMoneyWavy, PhReceipt, PhSignOut, PhUserCircle, PhX } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  mode: { type: String, required: true },
  plan: { type: Object, default: null },
  purchase: { type: Object, default: null },
})
const emit = defineEmits(['close', 'switch'])
const auth = useAuthStore()
const router = useRouter()
const form = reactive({ first_name: '', surname: '', date_of_birth: '', phone: '', password: '', password_confirm: '' })
const loading = ref(false)
const error = ref('')
const purchases = ref([])
const freeTip = ref(null)
const payment = ref(null)
const paidPurchase = ref(null)
const preferences = ref({ product_updates: false, closing_reminders: false, performance_measurement: true })
const accountTab = ref('active')
const accountNotices = ref([])
const clock = ref(Date.now())
const visiblePurchases = computed(() => purchases.value.filter((item) => accountTab.value === 'history' || (item.is_paid && new Date(item.package.closes_at).getTime() > clock.value)))
let clockTimer
function countdown(value) {
  const remaining = Math.max(0, new Date(value).getTime() - clock.value)
  if (!remaining) return 'Closed for new purchases'
  const minutes = Math.floor(remaining / 60000)
  return `Closes in ${Math.floor(minutes / 1440)}d ${Math.floor(minutes / 60) % 24}h ${minutes % 60}m`
}
async function savePreferences() {
  try {
    const response = await api('/v1/me/preferences/', { method: 'PATCH', body: JSON.stringify(preferences.value) })
    accountNotices.value = response.notices || []
    localStorage.setItem('bk-performance-measurement', String(preferences.value.performance_measurement))
  } catch (caught) { error.value = caught.message }
}
async function openBetslip(item) {
  const opened = window.open('about:blank', '_blank')
  if (opened) opened.opener = null
  try {
    const response = await api(`/v1/me/purchases/${item.id}/access/`, { method: 'POST', body: '{}' })
    if (opened) opened.location.replace(response.url)
    else location.assign(response.url)
    item.access_history = [new Date().toISOString(), ...(item.access_history || [])]
  } catch (caught) { opened?.close(); error.value = caught.message }
}
let pollTimer = null
const registering = computed(() => props.mode === 'register')
const isAccount = computed(() => props.mode === 'account')
const isFreeTip = computed(() => props.mode === 'free-tip')
const isPayment = computed(() => props.mode === 'payment')
const paymentPending = computed(() => payment.value?.status === 'pending')
const maximumBirthDate = (() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
})()

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

async function loadDialogData() {
  error.value = ''
  if (isAccount.value) {
    if (!auth.isAuthenticated) return emit('switch', 'login')
    loading.value = true
    try {
      purchases.value = await api('/v1/me/purchases/')
      const response = await api('/v1/me/preferences/')
      preferences.value = { ...preferences.value, ...response.preferences }
      accountNotices.value = response.notices || []
    }
    catch (err) { error.value = err.message }
    finally { loading.value = false }
  }
  if (isPayment.value) {
    if (!auth.isAuthenticated) return emit('switch', 'login')
    form.phone = auth.user?.phone || ''
    payment.value = props.purchase?.latest_payment || null
    if (props.purchase?.is_paid) paidPurchase.value = props.purchase
    else if (paymentPending.value) schedulePaymentCheck(1500)
  }
  if (isFreeTip.value) {
    loading.value = true
    try {
      const picks = await api('/v1/predictions/')
      freeTip.value = picks.find((pick) => !pick.locked) || null
    } catch (err) { error.value = err.message }
    finally { loading.value = false }
  }
}

function schedulePaymentCheck(delay = 5000) {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(refreshPayment, delay)
}

async function loadPaidPurchase() {
  paidPurchase.value = await api(`/v1/me/purchases/${props.purchase.id}/`)
}

async function refreshPayment() {
  if (!paymentPending.value) return
  try {
    const result = await api(`/v1/me/payments/${payment.value.id}/refresh/`, { method: 'POST' })
    if (result?.id) payment.value = result
    if (payment.value?.status === 'paid') await loadPaidPurchase()
    else if (payment.value?.status === 'pending') schedulePaymentCheck()
  } catch (err) {
    error.value = err.message
    if (paymentPending.value) schedulePaymentCheck(8000)
  }
}

async function startPayment() {
  error.value = ''
  loading.value = true
  clearTimeout(pollTimer)
  try {
    payment.value = await api(`/v1/me/purchases/${props.purchase.id}/payment-attempts/`, {
      method: 'POST',
      body: JSON.stringify({ phone: form.phone }),
    })
    if (paymentPending.value) schedulePaymentCheck(2500)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  if (registering.value && form.password !== form.password_confirm) {
    error.value = 'The passwords do not match.'
    return
  }
  loading.value = true
  try {
    const payload = registering.value
      ? { first_name: form.first_name, surname: form.surname, date_of_birth: form.date_of_birth, phone: form.phone, password: form.password, password_confirm: form.password_confirm }
      : { phone: form.phone, password: form.password }
    const result = registering.value ? await auth.register(payload) : await auth.login(payload)
    if (result.is_owner) {
      emit('close')
      router.push('/owner/dashboard')
    } else if (result.is_developer) {
      emit('close')
      router.push('/developer/dashboard')
    } else {
      emit('close')
      await router.push('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}

async function signOut() {
  await auth.logout()
  emit('close')
}

watch(() => props.mode, () => { loadDialogData() })

onMounted(() => {
  clockTimer = setInterval(() => { clock.value = Date.now() }, 30000)
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  loadDialogData()
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearTimeout(pollTimer)
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 grid place-items-center overflow-x-hidden overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-6" role="presentation" @mousedown.self="emit('close')">
      <section class="dialog-panel relative max-h-[calc(100dvh-1.5rem)] min-w-0 w-full max-w-xl overflow-x-hidden overflow-y-auto break-words rounded-[1.5rem] border border-white/12 bg-[#101713] p-5 text-[#f2f7f3] shadow-[0_32px_100px_rgba(0,0,0,.65)] sm:max-h-[92dvh] sm:rounded-[1.75rem] sm:p-8" role="dialog" aria-modal="true" :aria-label="isFreeTip ? 'Free earning insight' : isPayment ? 'Mobile money checkout' : isAccount ? 'Member access' : registering ? 'Create account' : 'Sign in'">
        <button type="button" class="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-white/10 text-white/55 hover:border-white/25 hover:text-white" aria-label="Close" @click="emit('close')"><PhX :size="19" /></button>

        <template v-if="isFreeTip">
          <span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhMoneyWavy :size="27" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Open earning insight</p>
          <h2 class="mt-2 pr-10 text-3xl font-black tracking-[-.055em] sm:pr-0 sm:text-4xl">A free earning angle from the BK desk.</h2>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <p v-else-if="error" class="mt-7 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <article v-else-if="freeTip" class="mt-7 rounded-2xl border border-white/10 bg-[#0a0f0c] p-5">
            <div class="flex min-w-0 flex-wrap items-center justify-between gap-3 text-xs font-bold text-white/45"><span class="min-w-0 break-words">{{ freeTip.competition }}</span><span class="inline-flex shrink-0 items-center gap-1.5 text-[var(--app-accent)]"><PhCheckCircle :size="15" /> Open</span></div>
            <h3 class="mt-5 break-words text-xl font-extrabold tracking-[-.04em] sm:text-2xl">{{ freeTip.home_team }} <span class="text-white/35">vs</span> {{ freeTip.away_team }}</h3>
            <p class="mt-4 text-sm text-white/45">{{ freeTip.market }}</p>
            <div class="mt-1 flex min-w-0 flex-wrap items-end justify-between gap-3"><strong class="min-w-0 break-words text-lg sm:text-xl">{{ freeTip.selection }}</strong><b class="shrink-0 text-3xl numbers">{{ freeTip.odds }}</b></div>
            <p v-if="freeTip.analysis" class="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-white/60">{{ freeTip.analysis }}</p>
          </article>
          <p v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-white/50">The next open insight is being prepared.</p>
          <button type="button" class="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)] active:scale-[.98]" @click="emit('close')">Continue to VIP access <PhArrowRight :size="18" /></button>
        </template>

        <template v-else-if="isPayment">
          <span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhMoneyWavy :size="27" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Secure mobile money</p>
          <h2 class="mt-2 pr-10 text-3xl font-black tracking-[-.055em] sm:text-4xl">Pay {{ props.plan?.currency }} {{ Number(props.plan?.payment_total || props.plan?.price || 0).toLocaleString('en-UG') }}</h2>
          <p v-if="Number(props.plan?.payment_fee || 0)" class="mt-2 text-sm text-white/45">Package {{ props.plan?.currency }} {{ Number(props.plan?.price || 0).toLocaleString('en-UG') }} plus estimated Relworx fee {{ props.plan?.currency }} {{ Number(props.plan?.payment_fee || 0).toLocaleString('en-UG') }}.</p>
          <p class="mt-3 text-white/50">{{ props.plan?.name }} · MTN MoMo or Airtel Money</p>

          <div v-if="paidPurchase" class="mt-7 rounded-2xl border border-[var(--app-accent)]/35 bg-[var(--app-accent)]/10 p-5">
            <PhCheckCircle :size="34" class="text-[var(--app-accent)]" weight="fill" />
            <h3 class="mt-4 text-xl font-black">Payment confirmed</h3>
            <p class="mt-2 text-sm leading-6 text-white/60">Your package was unlocked automatically.</p>
            <a v-if="paidPurchase.paid_image_url" :href="paidPurchase.paid_image_url" target="_blank" rel="noopener" class="mt-5 block overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img :src="paidPurchase.paid_image_url" :alt="`${paidPurchase.package.name} paid package image`" class="max-h-[26rem] w-full object-contain" decoding="async">
              <span class="block border-t border-white/10 px-4 py-2 text-center text-xs font-bold text-white/55">Open full image</span>
            </a>
            <div class="mt-5 border-t border-white/10 pt-4"><span class="text-[10px] font-bold uppercase tracking-wider text-white/35">Betslip code</span><code class="mt-1 block break-all text-xl font-black tracking-wider text-[var(--app-accent)]">{{ paidPurchase.code }}</code></div>
            <button type="button" @click="openBetslip(paidPurchase)" class="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)]">Open betslip <PhArrowRight :size="18" /></button>
            <a v-if="payment?.receipt_url" :href="payment.receipt_url" target="_blank" rel="noopener" class="mt-3 flex min-h-11 items-center justify-center gap-2 border border-white/15 px-5 text-sm font-bold text-white/70"><PhReceipt :size="17" /> View receipt</a>
          </div>

          <div v-else-if="paymentPending" class="mt-7 rounded-2xl border border-white/10 bg-[#0a0f0c] p-5 text-center">
            <span class="mx-auto grid size-12 place-items-center rounded-full border border-[var(--app-accent)]/40 text-[var(--app-accent)]"><PhClock :size="25" /></span>
            <h3 class="mt-4 text-xl font-black">Approve the prompt on your phone</h3>
            <p class="mt-2 text-sm leading-6 text-white/55">Enter your mobile-money PIN on {{ payment.payer_msisdn }}. This screen checks Relworx automatically.</p>
            <p class="mt-4 text-xs text-white/35">Reference: {{ payment.reference }}</p>
            <button type="button" class="mt-5 text-sm font-bold text-[var(--app-accent)] underline underline-offset-4" @click="refreshPayment">Check payment now</button>
          </div>

          <form v-else class="mt-7 grid gap-4" @submit.prevent="startPayment">
            <label class="grid gap-2 text-sm font-semibold">Mobile-money number<input v-model.trim="form.phone" required autocomplete="tel" inputmode="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"><small class="font-normal text-white/40">Use the MTN or Airtel number that will approve the payment.</small></label>
            <p v-if="payment?.status === 'failed'" class="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">{{ payment.provider_message || 'The payment was not completed. You can try again.' }}</p>
            <p v-if="error" class="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{{ error }}</p>
            <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:opacity-50" :disabled="loading">{{ loading ? 'Sending prompt…' : payment?.status === 'failed' ? 'Try payment again' : 'Pay with mobile money' }} <PhArrowRight :size="18" /></button>
            <p class="text-center text-xs leading-5 text-white/35">Access unlocks only after Relworx confirms the exact amount, currency, and transaction reference.</p>
          </form>
          <p v-if="paymentPending && error" class="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">{{ error }}</p>
        </template>

        <template v-else-if="isAccount">
          <p v-for="(notice, index) in accountNotices" :key="index" class="my-3 rounded-xl bg-white/5 p-3 text-sm text-white/65">{{ notice.message }}</p>
          <div class="my-4 flex gap-3"><button type="button" :aria-pressed="accountTab === 'active'" @click="accountTab='active'">Active packages</button><button type="button" :aria-pressed="accountTab === 'history'" @click="accountTab='history'">All purchases</button></div>
          <div class="flex min-w-0 items-center gap-3 pr-12"><span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhUserCircle :size="28" /></span><div class="min-w-0"><p class="text-xs font-bold uppercase tracking-[.16em] text-[var(--app-accent)]">Member access</p><h2 class="break-words text-xl font-black sm:text-2xl">{{ auth.user?.first_name }} {{ auth.user?.surname }}</h2></div></div>
          <p class="mt-2 text-sm text-white/45">{{ auth.user?.phone }}</p>
          <p v-if="error" class="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <div v-else-if="purchases.length" class="mt-7 grid gap-3">
            <p v-if="!visiblePurchases.length" class="text-sm text-white/60">No active packages. Choose All purchases to see previous payments and access.</p>
            <article v-for="purchaseItem in visiblePurchases" :key="purchaseItem.id" class="rounded-2xl border border-white/10 bg-[#0a0f0c] p-4">
              <div class="flex min-w-0 flex-wrap items-center justify-between gap-3"><h3 class="min-w-0 break-words font-bold">{{ purchaseItem.package.name }}</h3><span :class="['shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider', purchaseItem.is_paid ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'bg-white/7 text-white/55']">{{ purchaseItem.status }}</span></div>
              <dl class="mt-4 grid grid-cols-2 gap-4 text-xs"><div><dt class="flex items-center gap-1.5 text-white/40"><PhCalendar :size="14" /> Amount</dt><dd class="mt-1 font-semibold">{{ purchaseItem.currency_snapshot }} {{ Number(purchaseItem.price_snapshot).toLocaleString('en-UG') }}</dd></div><div><dt class="flex items-center gap-1.5 text-white/40"><PhClock :size="14" /> Purchased</dt><dd class="mt-1 font-semibold">{{ purchaseItem.paid_at ? new Date(purchaseItem.paid_at).toLocaleDateString('en-UG') : 'Awaiting payment' }}</dd></div></dl>
              <div v-if="purchaseItem.is_paid" class="mt-4 grid gap-3 border-t border-white/10 pt-4"><a v-if="purchaseItem.paid_image_url" :href="purchaseItem.paid_image_url" target="_blank" rel="noopener" class="block overflow-hidden rounded-xl border border-white/10 bg-black/20"><img :src="purchaseItem.paid_image_url" :alt="`${purchaseItem.package.name} paid package image`" class="max-h-80 w-full object-contain" loading="lazy" decoding="async"><span class="block border-t border-white/10 px-3 py-2 text-center text-[11px] font-bold text-white/50">Open full image</span></a><div class="min-w-0"><span class="text-[10px] font-bold uppercase tracking-wider text-white/35">Betslip code</span><code class="mt-1 block break-all text-base font-black tracking-wider text-[var(--app-accent)]">{{ purchaseItem.code }}</code></div><button type="button" @click="openBetslip(purchaseItem)" class="flex min-h-10 items-center justify-center gap-2 bg-[var(--app-accent)] px-4 text-sm font-extrabold text-[var(--app-accent-ink)]">Open betslip <PhArrowRight :size="16" /></button></div>
              <p class="mt-3 text-xs text-white/55">{{ countdown(purchaseItem.package.closes_at) }} · {{ new Date(purchaseItem.package.closes_at).toLocaleString('en-UG') }}</p>
              <details v-if="purchaseItem.access_history?.length" class="mt-3 text-xs text-white/60"><summary class="cursor-pointer py-2">Betslip access history</summary><p v-for="(access, index) in purchaseItem.access_history" :key="index">Opened {{ new Date(access).toLocaleString('en-UG') }}</p></details>
              <a v-if="purchaseItem.latest_payment?.receipt_url" :href="purchaseItem.latest_payment.receipt_url" target="_blank" rel="noopener" class="mt-3 block text-sm font-bold text-[var(--app-accent)]">Open receipt / save as PDF</a>
              <details v-if="purchaseItem.payment_timeline?.length" class="mt-3 text-xs text-white/60"><summary class="cursor-pointer py-2">Payment history</summary><ol class="grid gap-3"><li v-for="attempt in purchaseItem.payment_timeline" :key="attempt.reference"><strong>{{ attempt.reference }} · {{ attempt.status }}</strong><p>{{ new Date(attempt.created_at).toLocaleString('en-UG') }}</p><p v-if="attempt.failure_reason">{{ attempt.failure_reason }}</p></li></ol></details>
              <button v-if="!purchaseItem.is_paid && purchaseItem.package.is_open" type="button" class="mt-4 text-xs font-bold text-[var(--app-accent)] underline underline-offset-4" @click="emit('switch', 'payment', { plan: purchaseItem.package, purchase: purchaseItem })">Retry payment</button>
            </article>
          </div>
          <div v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-center"><PhLockKey :size="28" class="mx-auto text-[var(--app-accent)]" /><p class="mt-3 font-bold">No access requests yet</p><p class="mt-1 text-sm text-white/45">Choose a VIP pass from the page to send your first request.</p></div>
          <fieldset class="mt-5 grid gap-3 border-t border-white/15 pt-4"><legend class="text-sm font-bold">Notification preferences</legend><label class="flex gap-3 text-sm"><input v-model="preferences.product_updates" type="checkbox" @change="savePreferences"> Product updates</label><label class="flex gap-3 text-sm"><input v-model="preferences.closing_reminders" type="checkbox" @change="savePreferences"> Package closing reminders</label><label class="flex gap-3 text-sm"><input v-model="preferences.performance_measurement" type="checkbox" @change="savePreferences"> Help measure website performance</label><small class="text-white/45">Service notifications appear in your account. Optional messages follow your preferences.</small></fieldset>
          <button type="button" class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/55 hover:text-white" @click="signOut"><PhSignOut :size="17" /> Sign out</button>
        </template>

        <template v-else>
          <p class="pr-12 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">BK member prompt</p>
          <h2 class="mt-3 text-3xl font-black tracking-[-.055em] sm:text-4xl">{{ registering ? 'Create your account' : 'Welcome back' }}</h2>
          <p class="mt-3 text-white/50">{{ registering ? 'Use your name and active phone number.' : 'Enter the details linked to your BK membership.' }}</p>
          <form class="mt-7 grid gap-4" @submit.prevent="submit">
            <div v-if="registering" class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2 text-sm font-semibold">First name<input v-model.trim="form.first_name" required autocomplete="given-name" placeholder="First name" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
              <label class="grid gap-2 text-sm font-semibold">Surname<input v-model.trim="form.surname" required autocomplete="family-name" placeholder="Surname" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            </div>
            <label v-if="registering" class="grid gap-2 text-sm font-semibold">Date of birth<input v-model="form.date_of_birth" required type="date" autocomplete="bday" :max="maximumBirthDate" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none focus:border-[var(--app-accent)]"><small class="font-normal normal-case tracking-normal text-white/40">You must be 18 or older.</small></label>
            <label class="grid gap-2 text-sm font-semibold">Phone number<input v-model.trim="form.phone" required autocomplete="tel" inputmode="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <label class="grid gap-2 text-sm font-semibold">Password<input v-model="form.password" required minlength="4" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" :placeholder="registering ? 'Minimum 4 characters' : 'Your password'" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <label v-if="registering" class="grid gap-2 text-sm font-semibold">Confirm password<input v-model="form.password_confirm" required minlength="4" type="password" autocomplete="new-password" placeholder="Enter the password again" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <p v-if="error" class="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{{ error }}</p>
            <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:opacity-50" :disabled="loading">{{ loading ? 'Please wait...' : registering ? 'Create account' : 'Continue securely' }} <PhArrowRight :size="18" /></button>
          </form>
          <p class="mt-6 text-sm text-white/45">{{ registering ? 'Already registered?' : 'New to BK?' }} <button type="button" class="font-bold text-white underline decoration-[var(--app-accent)] underline-offset-4" @click="emit('switch', registering ? 'login' : 'register')">{{ registering ? 'Sign in' : 'Create account' }}</button></p>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-panel {
  scrollbar-color: rgb(168 201 87 / .6) transparent;
  scrollbar-width: thin;
}
</style>
