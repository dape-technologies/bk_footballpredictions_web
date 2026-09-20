<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhShieldCheck } from '@phosphor-icons/vue'
import BrandMark from '../components/BrandMark.vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ mode: String })
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ display_name: '', phone: '', password: '' })
const loading = ref(false)
const error = ref('')
const registering = computed(() => props.mode === 'register')

watch(() => props.mode, () => { error.value = '' })

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const user = registering.value ? await auth.register(form) : await auth.login(form)
    router.push(route.query.next || (user.is_owner ? '/owner' : '/account'))
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}
</script>

<template>
  <div class="grid min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)] lg:grid-cols-[.9fr_1.1fr]">
    <section class="relative hidden overflow-hidden border-r border-[var(--app-line)] bg-[var(--app-surface)] p-12 lg:flex lg:flex-col lg:justify-between">
      <BrandMark />
      <div><PhShieldCheck :size="42" class="text-[var(--app-accent)]" weight="duotone" /><h1 class="mt-7 max-w-[9ch] text-6xl font-black leading-[.94] tracking-[-.065em]">Your match desk stays protected.</h1><p class="mt-5 max-w-md leading-7 text-[var(--app-muted)]">Premium selections are enforced by the server and tied to active package access.</p></div>
      <p class="text-sm text-[var(--app-muted)]">BK Football Predictions</p>
    </section>
    <section class="flex flex-col p-4 sm:p-8 lg:p-12">
      <div class="flex items-center justify-between lg:hidden"><BrandMark compact /><RouterLink to="/" class="grid size-10 place-items-center rounded-xl border border-[var(--app-line)]" aria-label="Back home"><PhArrowLeft :size="19" /></RouterLink></div>
      <div class="m-auto w-full max-w-md py-12">
        <p class="text-sm font-semibold text-[var(--app-accent)]">Member access</p>
        <h2 class="mt-3 text-4xl font-black tracking-[-.055em]">{{ registering ? 'Create your account' : 'Welcome back' }}</h2>
        <p class="mt-3 text-[var(--app-muted)]">{{ registering ? 'Use your name and active phone number.' : 'Enter the details linked to your membership.' }}</p>
        <form class="mt-8 grid gap-5" @submit.prevent="submit">
          <label v-if="registering" class="grid gap-2 text-sm font-semibold">Display name<input v-model.trim="form.display_name" required autocomplete="name" placeholder="Your name" class="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-3.5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"></label>
          <label class="grid gap-2 text-sm font-semibold">Phone number<input v-model.trim="form.phone" required autocomplete="tel" inputmode="tel" placeholder="07XXXXXXXX" class="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-3.5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"></label>
          <label class="grid gap-2 text-sm font-semibold">Password<input v-model="form.password" required minlength="8" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" placeholder="Minimum 8 characters" class="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-3.5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"></label>
          <p v-if="error" class="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{{ error }}</p>
          <button class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 font-bold text-[var(--app-accent-ink)] active:scale-[.98] disabled:opacity-50" :disabled="loading">{{ loading ? 'Please wait...' : registering ? 'Create account' : 'Sign in' }} <PhArrowRight :size="18" /></button>
        </form>
        <p class="mt-6 text-sm text-[var(--app-muted)]">{{ registering ? 'Already registered?' : 'New to BK?' }} <RouterLink :to="registering ? '/login' : '/register'" class="font-bold text-[var(--app-text)] underline decoration-[var(--app-accent)] underline-offset-4">{{ registering ? 'Sign in' : 'Create account' }}</RouterLink></p>
      </div>
    </section>
  </div>
</template>
