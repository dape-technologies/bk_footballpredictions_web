<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight, PhCalendar, PhCheckCircle, PhClock, PhLockKey, PhSignOut, PhSoccerBall, PhUserCircle, PhX } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ mode: { type: String, required: true } })
const emit = defineEmits(['close', 'switch'])
const auth = useAuthStore()
const router = useRouter()
const form = reactive({ display_name: '', phone: '', password: '' })
const loading = ref(false)
const error = ref('')
const subscriptions = ref([])
const freeTip = ref(null)
const registering = computed(() => props.mode === 'register')
const isAccount = computed(() => props.mode === 'account')
const isFreeTip = computed(() => props.mode === 'free-tip')

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

async function loadDialogData() {
  error.value = ''
  if (isAccount.value) {
    if (!auth.isAuthenticated) return emit('switch', 'login')
    loading.value = true
    try { subscriptions.value = await api('/v1/me/subscriptions/') }
    catch (err) { error.value = err.message }
    finally { loading.value = false }
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

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const user = registering.value ? await auth.register(form) : await auth.login(form)
    if (user.is_owner) {
      emit('close')
      router.push('/owner')
    } else emit('switch', 'account')
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}

async function cancelAccess(id) {
  error.value = ''
  try {
    await api(`/v1/me/subscriptions/${id}/cancel/`, { method: 'POST' })
    await loadDialogData()
  } catch (err) { error.value = err.message }
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
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 backdrop-blur-md sm:p-6" role="presentation" @mousedown.self="emit('close')">
      <section class="dialog-panel relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] border border-white/12 bg-[#101713] p-5 text-[#f2f7f3] shadow-[0_32px_100px_rgba(0,0,0,.65)] sm:p-8" role="dialog" aria-modal="true" :aria-label="isFreeTip ? 'Free match insight' : isAccount ? 'Member access' : registering ? 'Create account' : 'Sign in'">
        <button type="button" class="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-white/10 text-white/55 hover:border-white/25 hover:text-white" aria-label="Close" @click="emit('close')"><PhX :size="19" /></button>

        <template v-if="isFreeTip">
          <span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhSoccerBall :size="27" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Open match insight</p>
          <h2 class="mt-2 text-4xl font-black tracking-[-.055em]">A free read from the BK desk.</h2>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <p v-else-if="error" class="mt-7 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <article v-else-if="freeTip" class="mt-7 rounded-2xl border border-white/10 bg-[#0a0f0c] p-5">
            <div class="flex items-center justify-between gap-4 text-xs font-bold text-white/45"><span>{{ freeTip.competition }}</span><span class="inline-flex items-center gap-1.5 text-[var(--app-accent)]"><PhCheckCircle :size="15" /> Open</span></div>
            <h3 class="mt-5 text-2xl font-extrabold tracking-[-.04em]">{{ freeTip.home_team }} <span class="text-white/35">vs</span> {{ freeTip.away_team }}</h3>
            <p class="mt-4 text-sm text-white/45">{{ freeTip.market }}</p>
            <div class="mt-1 flex items-end justify-between gap-4"><strong class="text-xl">{{ freeTip.selection }}</strong><b class="text-3xl numbers">{{ freeTip.odds }}</b></div>
            <p v-if="freeTip.analysis" class="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-white/60">{{ freeTip.analysis }}</p>
          </article>
          <p v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-white/50">The next open insight is being prepared.</p>
          <button type="button" class="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)] active:scale-[.98]" @click="emit('close')">Continue to VIP access <PhArrowRight :size="18" /></button>
        </template>

        <template v-else-if="isAccount">
          <div class="flex items-center gap-3 pr-12"><span class="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhUserCircle :size="28" /></span><div><p class="text-xs font-bold uppercase tracking-[.16em] text-[var(--app-accent)]">Member access</p><h2 class="text-2xl font-black">{{ auth.user?.display_name }}</h2></div></div>
          <p class="mt-2 text-sm text-white/45">{{ auth.user?.phone }}</p>
          <p v-if="error" class="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ error }}</p>
          <div v-if="loading" class="mt-7 h-52 animate-pulse rounded-2xl bg-white/5"></div>
          <div v-else-if="subscriptions.length" class="mt-7 grid gap-3">
            <article v-for="sub in subscriptions" :key="sub.id" class="rounded-2xl border border-white/10 bg-[#0a0f0c] p-4">
              <div class="flex items-center justify-between gap-4"><h3 class="font-bold">{{ sub.package.name }}</h3><span :class="['rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider', sub.status === 'active' ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)]' : 'bg-white/7 text-white/55']">{{ sub.status }}</span></div>
              <dl class="mt-4 grid grid-cols-2 gap-4 text-xs"><div><dt class="flex items-center gap-1.5 text-white/40"><PhCalendar :size="14" /> Requested</dt><dd class="mt-1 font-semibold">{{ new Date(sub.requested_at).toLocaleDateString('en-UG') }}</dd></div><div><dt class="flex items-center gap-1.5 text-white/40"><PhClock :size="14" /> Expires</dt><dd class="mt-1 font-semibold">{{ sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-UG') : 'Not set' }}</dd></div></dl>
              <button v-if="['pending', 'active'].includes(sub.status)" type="button" class="mt-4 text-xs font-bold text-red-300 underline underline-offset-4" @click="cancelAccess(sub.id)">Cancel access</button>
            </article>
          </div>
          <div v-else class="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-center"><PhLockKey :size="28" class="mx-auto text-[var(--app-accent)]" /><p class="mt-3 font-bold">No access requests yet</p><p class="mt-1 text-sm text-white/45">Choose a VIP pass from the page to send your first request.</p></div>
          <button type="button" class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/55 hover:text-white" @click="signOut"><PhSignOut :size="17" /> Sign out</button>
        </template>

        <template v-else>
          <p class="pr-12 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">BK member prompt</p>
          <h2 class="mt-3 text-4xl font-black tracking-[-.055em]">{{ registering ? 'Create your account' : 'Welcome back' }}</h2>
          <p class="mt-3 text-white/50">{{ registering ? 'Use your name and active phone number.' : 'Enter the details linked to your BK membership.' }}</p>
          <form class="mt-7 grid gap-4" @submit.prevent="submit">
            <label v-if="registering" class="grid gap-2 text-sm font-semibold">Display name<input v-model.trim="form.display_name" required autocomplete="name" placeholder="Your name" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <label class="grid gap-2 text-sm font-semibold">Phone number<input v-model.trim="form.phone" required autocomplete="tel" inputmode="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <label class="grid gap-2 text-sm font-semibold">Password<input v-model="form.password" required minlength="8" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" placeholder="Minimum 8 characters" class="rounded-xl border border-white/12 bg-[#080d0a] px-4 py-3.5 text-white outline-none placeholder:text-white/25 focus:border-[var(--app-accent)]"></label>
            <p v-if="error" class="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{{ error }}</p>
            <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:opacity-50" :disabled="loading">{{ loading ? 'Please wait...' : registering ? 'Create account' : 'Sign in' }} <PhArrowRight :size="18" /></button>
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
