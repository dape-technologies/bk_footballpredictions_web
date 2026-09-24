                                                                                                                                                                                                                        <script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { PhArrowRight, PhCheck, PhCheckCircle, PhClock, PhCopy, PhLockKey, PhMoneyWavy, PhPhoneCall, PhSignOut, PhUserCircle, PhX } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  mode: { type: String, required: true },
  package: { type: Object, default: null },
})
const emit = defineEmits(['close', 'switch', 'authenticated', 'purchase-complete'])
const auth = useAuthStore()
const form = reactive({ first_name: '', surname: '', date_of_birth: '', phone: '', password: '', password_confirm: '' })
const checkoutPhone = ref('')
const loading = ref(false)
const error = ref('')
const purchases = ref([])
const freeTip = ref(null)
const purchase = ref(null)
const checkoutStep = ref('form')
const pollingStopped = ref(false)
const copied = ref(false)
let pollTimer = null
let pollCount = 0

const registering = computed(() => props.mode === 'register')
const isAccount = computed(() => props.mode === 'account')
const isFreeTip = computed(() => props.mode === 'free-tip')
const isCheckout = computed(() => props.mode === 'checkout')
const money = (value) => new Intl.NumberFormat('en-UG').format(value || 0)
const formatDate = (value) => value ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Not set'
const maximumBirthDate = (() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})()

function stopPolling() {
  if (pollTimer) window.clearTimeout(pollTimer)
  pollTimer = null
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

async function loadDialogData() {
  stopPolling()
  error.value = ''
  copied.value = false
  if (isAccount.value) {
    if (!auth.isAuthenticated) return emit('switch', 'login')
    loading.value = true
    try { purchases.value = await api('/v1/me/purchases/') }
    catch (caught) { error.value = caught.message }
    finally { loading.value = false }
  } else if (isFreeTip.value) {
    loading.value = true
    try {
      const picks = await api('/v1/predictions/')
      freeTip.value = picks.find((pick) => !pick.locked) || null
    } catch (caught) { error.value = caught.message }
    finally { loading.value = false }
  } else if (isCheckout.value) {
    if (!auth.isAuthenticated) return emit('switch', 'login')
    checkoutPhone.value = auth.user?.phone || ''
    purchase.value = null
    checkoutStep.value = 'form'
    pollingStopped.value = false
  }
}

async function submitAuth() {
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
    const user = registering.value ? await auth.register(payload) : await auth.login(payload)
    emit('authenticated', user)
  } catch (caught) { error.value = caught.message }
  finally { loading.value = false }
}

async function beginCheckout() {
  if (!props.package) {
    error.value = 'Choose a package before starting payment.'
    return
  }
  loading.value = true
  error.value = ''
  pollingStopped.value = false
  try {
    purchase.value = await api('/v1/me/purchases/', {
      method: 'POST',
      body: JSON.stringify({ package_id: props.package.id }),
    })
    if (purchase.value.is_paid) {
      checkoutStep.value = 'paid'
      emit('purchase-complete', purchase.value)
      return
    }
    await api(`/v1/me/purchases/${purchase.value.id}/payment-attempts/`, {
      method: 'POST',
      body: JSON.stringify({ phone: checkoutPhone.value }),
    })
    checkoutStep.value = 'pending'
    pollCount = 0
    schedulePoll()
  } catch (caught) {
    if (purchase.value && caught.status === 409 && caught.message.includes('already pending')) {
      checkoutStep.value = 'pending'
      pollCount = 0
      schedulePoll()
      return
    }
    error.value = caught.message
    checkoutStep.value = 'failed'
  } finally { loading.value = false }
}

function schedulePoll() {
  stopPolling()
  if (pollCount >= 40) {
    pollingStopped.value = true
    return
  }
  pollTimer = window.setTimeout(pollPurchase, 3000)
}

async function pollPurchase() {
  if (!purchase.value) return
  pollCount += 1
  try {
    purchase.value = await api(`/v1/me/purchases/${purchase.value.id}/`)
    if (purchase.value.is_paid) {
      checkoutStep.value = 'paid'
      emit('purchase-complete', purchase.value)
      stopPolling()
      return
    }
    if (purchase.value.latest_payment?.status === 'failed') {
      checkoutStep.value = 'failed'
      error.value = purchase.value.latest_payment.provider_message || 'The payment was not completed.'
      stopPolling()
      return
    }
  } catch (caught) {
    error.value = caught.message
  }
  schedulePoll()
}

async function refreshPayment() {
  pollingStopped.value = false
  pollCount = 0
  await pollPurchase()
}

function retryPayment() {
  error.value = ''
  checkoutStep.value = 'form'
}

async function copyCode(code) {
  await navigator.clipboard.writeText(code)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}

async function signOut() {
  await auth.logout()
  emit('close')
}

watch(() => props.mode, loadDialogData)

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  loadDialogData()
})

onBeforeUnmount(() => {
  stopPolling()
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 grid place-items-center overflow-x-hidden overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-6" role="presentation" @mousedown.self="emit('close')">
      <section class="dialog-panel relative max-h-[calc(100dvh-1.5rem)] min-w-0 w-full max-w-xl overflow-x-hidden overflow-y-auto break-words rounded-[1.5rem] border border-white/12 bg-[#101713] p-5 text-[#f2f7f3] shadow-[0_32px_100px_rgba(0,0,0,.65)] sm:max-h-[92dvh] sm:rounded-[1.75rem] sm:p-8" role="dialog" aria-modal="true">
        <button type="button" class="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-white/10 text-white/55 hover:border-white/25 hover:text-white" aria-label="Close" @click="emit('close')"><PhX :size="19" /></button>

        <template v-if="isFreeTip">
          <span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhMoneyWavy :size="27" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Open earning insight</p>
          <h2 class="mt-2 pr-10 text-3xl font-black tracking-[-.055em] sm:text-4xl">A free earning angle from the BK desk.</h2>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <p v-else-if="error" class="mt-7 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <article v-else-if="freeTip" class="mt-7 rounded-2xl border border-white/10 bg-[#0a0f0c] p-5">
            <div class="flex items-center justify-between gap-3 text-xs font-bold text-white/45"><span>{{ freeTip.competition }}</span><span class="inline-flex items-center gap-1.5 text-[var(--app-accent)]"><PhCheckCircle :size="15" /> Open</span></div>
            <h3 class="mt-5 text-xl font-extrabold tracking-[-.04em] sm:text-2xl">{{ freeTip.home_team }} <span class="text-white/35">vs</span> {{ freeTip.away_team }}</h3>
            <p class="mt-4 text-sm text-white/45">{{ freeTip.market }}</p>
            <div class="mt-1 flex flex-wrap items-end justify-between gap-3"><strong class="text-lg sm:text-xl">{{ freeTip.selection }}</strong><b class="text-3xl numbers">{{ freeTip.odds }}</b></div>
            <p v-if="freeTip.analysis" class="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-white/60">{{ freeTip.analysis }}</p>
          </article>
          <p v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-white/50">The next open insight is being prepared.</p>
        </template>

        <template v-else-if="isCheckout">
          <span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhPhoneCall :size="27" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Secure mobile-money checkout</p>
          <h2 class="mt-2 pr-10 text-3xl font-black tracking-[-.055em] sm:text-4xl">{{ package?.name || 'Package payment' }}</h2>
          <div class="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-[#0a0f0c] p-4 text-sm">
            <div><span class="text-white/40">Amount</span><strong class="mt-1 block text-xl">{{ package?.currency }} {{ money(package?.price) }}</strong></div>
            <div><span class="text-white/40">Closes</span><strong class="mt-1 block">{{ formatDate(package?.closes_at) }}</strong></div>
          </div>
          <p v-if="error" class="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>

          <form v-if="checkoutStep === 'form'" class="mt-6 grid gap-4" @submit.prevent="beginCheckout">
            <label class="grid gap-2 text-sm font-semibold">Mobile-money number<input v-model.trim="checkoutPhone" required inputmode="tel" autocomplete="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"><small class="font-normal text-white/40">Use the MTN or Airtel number that should receive the payment prompt.</small></label>
            <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] disabled:opacity-50" :disabled="loading">{{ loading ? 'Starting payment…' : `Pay ${package?.currency || ''} ${money(package?.price)}` }} <PhArrowRight :size="18" /></button>
          </form>

          <div v-else-if="checkoutStep === 'pending'" class="mt-7 text-center">
            <span class="mx-auto grid size-16 place-items-center rounded-full border border-[var(--app-accent)]/35 bg-[var(--app-accent)]/10 text-[var(--app-accent)]"><PhClock :size="30" /></span>
            <h3 class="mt-5 text-2xl font-black">Approve the request on your phone</h3>
            <p class="mt-2 text-sm leading-6 text-white/50">We will reveal the package automatically after Relworx confirms payment.</p>
            <p v-if="purchase?.latest_payment?.reference" class="mt-4 font-mono text-xs text-white/35">{{ purchase.latest_payment.reference }}</p>
            <button v-if="pollingStopped" type="button" class="mt-5 min-h-11 rounded-xl border border-white/15 px-5 font-bold" @click="refreshPayment">Check payment status</button>
            <p v-else class="mt-5 animate-pulse text-xs font-bold uppercase tracking-wider text-[var(--app-accent)]">Waiting for confirmation…</p>
          </div>

          <div v-else-if="checkoutStep === 'paid' && purchase" class="mt-7">
            <div class="rounded-2xl border border-[var(--app-accent)]/35 bg-[var(--app-accent)]/10 p-5"><div class="flex items-center gap-2 font-bold text-[var(--app-accent)]"><PhCheckCircle :size="21" weight="fill" /> Payment confirmed</div><p class="mt-2 text-sm text-white/55">This package is permanently available in My purchases.</p></div>
            <div class="mt-4 rounded-2xl border border-white/10 bg-[#0a0f0c] p-5"><span class="text-[10px] font-bold uppercase tracking-wider text-white/35">Betslip code</span><div class="mt-2 flex items-center justify-between gap-3"><code class="break-all text-xl font-black tracking-wider text-[var(--app-accent)]">{{ purchase.code }}</code><button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10" :aria-label="copied ? 'Code copied' : 'Copy code'" @click="copyCode(purchase.code)"><PhCheck v-if="copied" :size="18" /><PhCopy v-else :size="18" /></button></div><a :href="purchase.betslip_link" target="_blank" rel="noopener" class="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)]">Open betslip <PhArrowRight :size="18" /></a></div>
          </div>

          <div v-else class="mt-7 text-center"><PhX :size="34" class="mx-auto text-red-300" /><h3 class="mt-4 text-2xl font-black">Payment not completed</h3><p class="mt-2 text-sm text-white/50">You can try again without creating another purchase.</p><button type="button" class="mt-5 min-h-12 w-full rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)]" @click="retryPayment">Retry payment</button></div>
        </template>

        <template v-else-if="isAccount">
          <div class="flex items-center gap-3 pr-12"><span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhUserCircle :size="28" /></span><div><p class="text-xs font-bold uppercase tracking-[.16em] text-[var(--app-accent)]">My purchases</p><h2 class="text-xl font-black sm:text-2xl">{{ auth.user?.full_name }}</h2></div></div>
          <p v-if="error" class="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <div v-else-if="purchases.length" class="mt-7 grid gap-3">
            <article v-for="item in purchases" :key="item.id" class="rounded-2xl border border-white/10 bg-[#0a0f0c] p-4">
              <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="font-bold">{{ item.package.name }}</h3><span :class="['rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider', item.is_paid ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'bg-white/7 text-white/55']">{{ item.status }}</span></div>
              <p class="mt-2 text-xs text-white/40">{{ item.is_paid ? `Purchased ${formatDate(item.paid_at)}` : item.latest_payment?.provider_message || 'Payment not completed' }}</p>
              <div v-if="item.is_paid" class="mt-4 grid gap-3 border-t border-white/10 pt-4"><div><span class="text-[10px] font-bold uppercase tracking-wider text-white/35">Betslip code</span><div class="mt-1 flex items-center justify-between gap-3"><code class="break-all text-base font-black tracking-wider text-[var(--app-accent)]">{{ item.code }}</code><button type="button" class="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10" aria-label="Copy code" @click="copyCode(item.code)"><PhCopy :size="16" /></button></div></div><a :href="item.betslip_link" target="_blank" rel="noopener" class="flex min-h-10 items-center justify-center gap-2 bg-[var(--app-accent)] px-4 text-sm font-extrabold text-[var(--app-accent-ink)]">Open betslip <PhArrowRight :size="16" /></a></div>
            </article>
          </div>
          <div v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-center"><PhLockKey :size="28" class="mx-auto text-[var(--app-accent)]" /><p class="mt-3 font-bold">No purchases yet</p><p class="mt-1 text-sm text-white/45">Choose an open package to make your first purchase.</p></div>
          <button type="button" class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/55 hover:text-white" @click="signOut"><PhSignOut :size="17" /> Sign out</button>
        </template>

        <template v-else>
          <p class="pr-12 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">BK member prompt</p>
          <h2 class="mt-3 text-3xl font-black tracking-[-.055em] sm:text-4xl">{{ registering ? 'Create your account' : 'Welcome back' }}</h2>
          <p class="mt-3 text-white/50">{{ registering ? 'Create an account to continue to payment.' : 'Sign in to continue to your selected package.' }}</p>
          <form class="mt-7 grid gap-4" @submit.prevent="submitAuth">
            <div v-if="registering" class="grid gap-4 sm:grid-cols-2"><label class="grid gap-2 text-sm font-semibold">First name<input v-model.trim="form.first_name" required autocomplete="given-name" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none"></label><label class="grid gap-2 text-sm font-semibold">Surname<input v-model.trim="form.surname" required autocomplete="family-name" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none"></label></div>
            <label v-if="registering" class="grid gap-2 text-sm font-semibold">Date of birth<input v-model="form.date_of_birth" required type="date" :max="maximumBirthDate" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none"><small class="font-normal text-white/40">You must be 18 or older.</small></label>
            <label class="grid gap-2 text-sm font-semibold">Phone number<input v-model.trim="form.phone" required autocomplete="tel" inputmode="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none placeholder:text-white/25"></label>
            <label class="grid gap-2 text-sm font-semibold">Password<input v-model="form.password" required minlength="4" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none"></label>
            <label v-if="registering" class="grid gap-2 text-sm font-semibold">Confirm password<input v-model="form.password_confirm" required minlength="4" type="password" autocomplete="new-password" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 outline-none"></label>
            <p v-if="error" class="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{{ error }}</p>
            <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] disabled:opacity-50" :disabled="loading">{{ loading ? 'Please wait…' : registering ? 'Create account and continue' : 'Sign in and continue' }} <PhArrowRight :size="18" /></button>
          </form>
          <p class="mt-6 text-sm text-white/45">{{ registering ? 'Already registered?' : 'New to BK?' }} <button type="button" class="font-bold text-white underline decoration-[var(--app-accent)] underline-offset-4" @click="emit('switch', registering ? 'login' : 'register')">{{ registering ? 'Sign in' : 'Create account' }}</button></p>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-panel { scrollbar-color: rgb(168 201 87 / .6) transparent; scrollbar-width: thin; }
</style>
