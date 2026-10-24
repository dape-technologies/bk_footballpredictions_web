<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhLockKey, PhShieldCheck } from '@phosphor-icons/vue'
import BrandMark from '../components/BrandMark.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ phone: '', password: '', otp: '' })
const loading = ref(false)
const error = ref('')
const notice = ref('')
const challengeToken = ref('')

function restart() {
  challengeToken.value = ''
  form.otp = ''
  notice.value = ''
  error.value = ''
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const payload = challengeToken.value
      ? { challenge_token: challengeToken.value, otp: form.otp }
      : { phone: form.phone, password: form.password }
    const result = await auth.adminLogin(payload)
    if (result.otp_required) {
      challengeToken.value = result.challenge_token
      notice.value = result.message
      form.otp = ''
      return
    }
    if (!result.is_owner) {
      await auth.endSession()
      throw new Error('Product Owner access is required.')
    }
    const next = String(route.query.next || '')
    if (next.startsWith('/django-admin/')) window.location.assign(next)
    else await router.replace('/owner/dashboard')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-dvh bg-[#070b09] text-[#f2f7f3]">
    <div class="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]">
      <section class="relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div class="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:56px_56px]"></div>
        <div class="relative"><BrandMark /></div>
        <div class="relative max-w-2xl">
          <span class="grid size-14 place-items-center border border-[#c7ff45]/30 bg-[#c7ff45]/10 text-[#c7ff45]"><PhShieldCheck :size="30" weight="duotone" /></span>
          <p class="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#c7ff45]">Restricted operations</p>
          <h1 class="mt-4 max-w-[9ch] text-6xl font-black leading-[.92] tracking-[-.07em] xl:text-8xl">The owner control room.</h1>
          <p class="mt-6 max-w-lg text-base leading-7 text-white/50">Manage predictions, access requests, members, packages, results, and activity from one protected workspace.</p>
        </div>
        <p class="relative text-xs uppercase tracking-[.16em] text-white/30">BK Football Predictions / Administration</p>
      </section>

      <section class="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <header class="flex items-center justify-between">
          <div class="lg:hidden"><BrandMark compact /></div>
          <RouterLink to="/" class="ml-auto inline-flex items-center gap-2 text-sm font-bold text-white/45 transition hover:text-white" aria-label="Return to website"><PhArrowLeft :size="17" /> Back to website</RouterLink>
        </header>

        <div class="my-auto w-full max-w-md self-center py-16">
          <span class="grid size-12 place-items-center rounded-2xl bg-[#c7ff45] text-[#07110d]"><PhLockKey :size="25" weight="duotone" /></span>
          <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[#c7ff45]">Owner sign in</p>
          <h2 class="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Welcome back.</h2>
          <p class="mt-4 leading-7 text-white/45">{{ challengeToken ? 'Enter the six-digit code sent to the owner security contacts.' : 'Use the private phone number and password assigned to your Product Owner account.' }}</p>

          <form class="mt-9 grid gap-5" @submit.prevent="submit">
            <label v-if="!challengeToken" class="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-white/60">Owner phone number
              <input v-model.trim="form.phone" required autocomplete="username" inputmode="tel" placeholder="07XXXXXXXX" class="min-h-13 rounded-none border border-white/15 bg-white/[.04] px-4 text-base font-medium normal-case tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#c7ff45]" />
            </label>
            <label v-if="!challengeToken" class="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-white/60">Password
              <input v-model="form.password" required minlength="4" type="password" autocomplete="current-password" placeholder="Enter your password" class="min-h-13 rounded-none border border-white/15 bg-white/[.04] px-4 text-base font-medium normal-case tracking-normal text-white outline-none placeholder:text-white/20 focus:border-[#c7ff45]" />
            </label>
            <label v-else class="grid gap-2 text-xs font-bold uppercase tracking-[.1em] text-white/60">Login verification code
              <input v-model.trim="form.otp" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" class="min-h-13 rounded-none border border-white/15 bg-white/[.04] px-4 text-center font-mono text-xl font-bold tracking-[.25em] text-white outline-none placeholder:text-white/20 focus:border-[#c7ff45]" />
            </label>
            <p v-if="notice" role="status" class="border border-[#c7ff45]/20 bg-[#c7ff45]/10 p-3.5 text-sm leading-6 text-white/70">{{ notice }}</p>
            <p v-if="error" role="alert" class="border border-red-400/25 bg-red-500/10 p-3.5 text-sm text-red-200">{{ error }}</p>
            <button type="submit" class="mt-1 flex min-h-13 items-center justify-center gap-2 bg-[#c7ff45] px-5 font-extrabold text-[#07110d] transition hover:bg-[#d6ff77] active:scale-[.99] disabled:cursor-wait disabled:opacity-60" :disabled="loading">
              {{ loading ? 'Verifying access…' : challengeToken ? 'Verify and enter' : 'Continue securely' }} <PhArrowRight v-if="!loading" :size="18" />
            </button>
            <button v-if="challengeToken" type="button" class="min-h-11 border border-white/15 bg-transparent text-sm font-bold text-white/60 hover:text-white" @click="restart">Use password again</button>
          </form>

          <p class="mt-7 border-t border-white/10 pt-6 text-sm leading-6 text-white/35">Customer and ordinary staff accounts cannot access this area. Contact the system owner if your credentials need to be reset.</p>
        </div>
      </section>
    </div>
  </main>
</template>
