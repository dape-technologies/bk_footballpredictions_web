<script setup>
import { inject, onMounted, ref } from 'vue'
import { PhArrowRight, PhChartLineUp, PhClock, PhLightning, PhShieldCheck, PhSoccerBall, PhTarget, PhTrophy } from '@phosphor-icons/vue'
import { api } from '../api/client'
import HeroWordmark from '../components/HeroWordmark.vue'
import { useAuthStore } from '../stores/auth'

const predictions = ref([])
const packages = ref([])
const wins = ref([])
const testimonials = ref([])
const loading = ref(true)
const errors = ref({})
const notice = ref('')
const submitting = ref(null)
const auth = useAuthStore()
const openDialog = inject('openAppDialog')
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const formatStart = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'To be announced'

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function requestAccess(plan) {
  if (!auth.isAuthenticated) {
    openDialog?.('login')
    return
  }
  submitting.value = plan.id
  notice.value = ''
  errors.value.subscription = ''
  try {
    await api('/v1/me/subscriptions/', { method: 'POST', body: JSON.stringify({ package_id: plan.id }) })
    notice.value = `${plan.name} purchase request sent.`
  } catch (error) { errors.value.subscription = error.message }
  finally { submitting.value = null }
}

onMounted(async () => {
  const resources = [
    ['predictions', predictions, '/v1/predictions/'],
    ['packages', packages, '/v1/packages/'],
    ['wins', wins, '/v1/recent-wins/'],
    ['testimonials', testimonials, '/v1/testimonials/'],
  ]
  const results = await Promise.allSettled(resources.map(([, , path]) => api(path)))

  results.forEach((result, index) => {
    const [name, target] = resources[index]
    if (result.status === 'fulfilled') target.value = result.value
    else errors.value[name] = result.reason?.message || 'This section could not be loaded.'
  })
  loading.value = false
})
</script>

<template>
  <div class="overflow-hidden">
    <section id="top" class="hero-stage relative isolate scroll-mt-16 overflow-hidden bg-[#070908] text-[#f2f4ea]">
      <div class="hero-lights pointer-events-none absolute inset-0 -z-20" aria-hidden="true"></div>
      <div class="hero-pitch pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34%] opacity-45" aria-hidden="true"></div>
      <img src="/illustrations/football-hero-characters.png" alt="" class="hero-characters pointer-events-none absolute inset-0 -z-10 hidden h-full w-full object-cover opacity-55 mix-blend-screen md:block" aria-hidden="true" />

      <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8 lg:pb-28">
        <button type="button" class="group inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-black/30 px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[.16em] text-white/75 backdrop-blur-sm transition hover:border-[var(--app-accent)]/65 hover:text-white" @click="openDialog?.('free-tip')">
          <span class="grid size-7 place-items-center rounded-full bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhLightning :size="14" weight="fill" /></span>
          <span><span class="block text-[9px] text-white/45">Open match insight</span>Reveal the free read</span>
          <PhArrowRight class="ml-1 text-[var(--app-accent)] transition group-hover:translate-x-1" :size="15" />
        </button>

        <div class="mx-auto flex min-w-0 w-full max-w-5xl flex-col items-center py-9 text-center sm:py-12">
          <div class="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-[var(--app-accent)] sm:text-xs">
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
            Football intelligence, clearly called
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
          </div>

          <HeroWordmark />
          <p class="mt-6 text-balance text-xl font-semibold tracking-[-.025em] text-[#f2f4ea] sm:text-2xl">Read the match. Own the moment.</p>
          <p class="mt-3 max-w-2xl text-pretty text-sm leading-6 text-white/55 sm:text-base">Sharp match reads, member-only angles and a public record in one focused football desk.</p>

          <div class="mt-7 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            <button type="button" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-6 font-extrabold text-[var(--app-accent-ink)] transition hover:-translate-y-0.5 hover:bg-[var(--app-accent-hover)] active:scale-[.98]" @click="scrollTo('packages')">Explore VIP access <PhArrowRight :size="18" /></button>
            <button type="button" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--app-accent)]/65 bg-black/20 px-6 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--app-accent)]/10 active:scale-[.98]" @click="openDialog?.('free-tip')">Reveal the free read <PhLightning :size="18" /></button>
          </div>

          <div class="mt-9 grid w-full max-w-2xl grid-cols-3 border-y border-white/10 py-5 text-left sm:border-0 sm:py-0">
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhChartLineUp class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Current</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Live match slate</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 border-x border-white/10 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhTarget class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Explained</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Analyst reasoning</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhTrophy class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Accountable</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Public outcomes</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="packages" class="package-stage relative isolate scroll-mt-16 border-y border-white/10 bg-[#090b09] text-[#f2f4ea]">
      <div class="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between gap-5">
          <div><p class="text-xs font-bold uppercase tracking-[.2em] text-[var(--app-accent)]">Active packages</p><h2 class="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Buy a betslip.</h2></div>
          <span class="hidden text-sm font-semibold text-white/40 sm:block">{{ packages.length }} available</span>
        </div>

        <p v-if="notice" class="mt-7 rounded-2xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 p-4 text-sm text-white">{{ notice }}</p>
        <p v-if="errors.subscription" class="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ errors.subscription }}</p>

        <div v-if="errors.packages" class="mt-9 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Packages are temporarily unavailable. {{ errors.packages }}</div>
        <div v-if="loading" class="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[28rem] animate-pulse bg-white/5"></div></div>
        <div v-else-if="packages.length" class="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="plan in packages" :key="plan.id" class="group flex min-h-[28rem] flex-col overflow-hidden border border-white/12 bg-[#101310] transition duration-300 hover:-translate-y-1 hover:border-[var(--app-accent)]/55">
            <div class="relative h-48 overflow-hidden bg-[#171d18]">
              <img v-if="plan.image_url" :src="plan.image_url" :alt="`${plan.name} package`" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div v-else class="grid h-full place-items-center text-[var(--app-accent)]/45"><PhSoccerBall :size="64" weight="duotone" /></div>
              <span class="absolute left-4 top-4 bg-[#090b09]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--app-accent)] backdrop-blur">{{ plan.package_type }}</span>
            </div>
            <div class="flex flex-1 flex-col p-6">
              <div class="flex items-start justify-between gap-4"><h3 class="text-2xl font-extrabold tracking-[-.04em]">{{ plan.name }}</h3><strong class="text-xl font-black numbers"><small class="mr-1 text-[9px] text-white/35">{{ plan.currency }}</small>{{ money(plan.price) }}</strong></div>
              <dl class="mt-6 grid grid-cols-2 border-y border-white/10 py-4">
                <div><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Win probability</dt><dd class="mt-1 text-xl font-black text-[var(--app-accent)] numbers">{{ plan.win_probability }}%</dd></div>
                <div class="border-l border-white/10 pl-4"><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Commences</dt><dd class="mt-1 flex items-center gap-1.5 text-sm font-bold"><PhClock :size="15" />{{ formatStart(plan.commences_at) }}</dd></div>
              </dl>
              <button type="button" :disabled="submitting === plan.id || !plan.is_open" class="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] transition hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Processing…' : plan.is_open ? 'Buy slip' : 'Unavailable' }} <PhArrowRight :size="17" /></button>
            </div>
          </article>
        </div>
        <div v-else class="mt-9 grid min-h-48 place-items-center border border-dashed border-white/15 px-6 text-center text-white/45">No active packages.</div>
      </div>
    </section>

    <section id="results" class="scroll-mt-16 border-y border-[var(--app-line)] bg-[var(--app-surface)]">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="mb-9 flex items-end justify-between gap-5"><div><p class="text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Results</p><h2 class="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Recent wins.</h2></div><span class="hidden text-sm font-semibold text-[var(--app-muted)] sm:block">{{ wins.length }} published</span></div>
        <div v-if="errors.wins" class="border border-red-400/30 bg-red-500/10 p-5 text-red-200">Recent wins are unavailable. {{ errors.wins }}</div>
        <div v-else-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-80 animate-pulse bg-[var(--app-surface-2)]"></div></div>
        <div v-else-if="wins.length" class="grid auto-rows-[20rem] gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article v-for="(win,index) in wins" :key="win.id" :class="['group relative overflow-hidden bg-[#0b100d]', index===0 && wins.length>1 ? 'md:row-span-2 md:h-auto lg:col-span-2' : '']">
            <img v-if="win.image_url" :src="win.image_url" :alt="win.caption" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]">
            <div v-else class="grid h-full place-items-center text-[var(--app-accent)]"><PhTrophy :size="64" weight="duotone" /></div>
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-6 pt-20 text-white"><p class="max-w-2xl text-lg font-bold leading-6">{{ win.caption }}</p><time class="mt-2 block text-[10px] font-bold uppercase tracking-[.14em] text-white/45">{{ new Date(win.settled_at).toLocaleDateString('en-UG') }}</time></div>
          </article>
        </div>
        <div v-else class="grid min-h-48 place-items-center border border-dashed border-[var(--app-line)] px-6 text-center text-[var(--app-muted)]">No recent wins yet.</div>
      </div>
    </section>

    <section v-if="testimonials.length" class="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8"><PhShieldCheck :size="34" class="mx-auto text-[var(--app-accent)]" /><blockquote class="mt-7 text-balance text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">“{{ testimonials[0].quote }}”</blockquote><p class="mt-5 text-sm font-semibold text-[var(--app-muted)]">{{ testimonials[0].member_name }}<span v-if="testimonials[0].member_since" class="block font-normal">{{ testimonials[0].member_since }}</span></p></section>
  </div>
</template>

<style scoped>
.hero-lights {
  background:
    radial-gradient(circle at 6% 38%, rgb(242 244 234 / 0.16), transparent 11%),
    radial-gradient(circle at 94% 38%, rgb(242 244 234 / 0.16), transparent 11%),
    radial-gradient(ellipse at 50% 108%, rgb(102 144 40 / 0.22), transparent 45%);
}

.hero-pitch {
  background:
    linear-gradient(90deg, transparent 49.85%, rgb(242 244 234 / 0.13) 50%, transparent 50.15%),
    linear-gradient(0deg, rgb(168 201 87 / 0.05), transparent 72%);
  border-top: 1px solid rgb(168 201 87 / 0.09);
  transform: perspective(520px) rotateX(63deg) scaleX(1.45);
  transform-origin: bottom center;
}

.hero-pitch::after {
  position: absolute;
  left: 50%;
  bottom: 6%;
  width: min(38rem, 70vw);
  aspect-ratio: 2 / 0.72;
  content: '';
  border: 1px solid rgb(242 244 234 / 0.13);
  border-radius: 50%;
  transform: translateX(-50%);
}

.hero-characters { animation: character-float 7s ease-in-out infinite; }

.package-stage::before {
  position: absolute;
  inset: 5.1rem 0 auto;
  z-index: -1;
  height: 22rem;
  content: '';
  background: radial-gradient(circle at 50% 0, rgb(168 201 87 / 0.08), transparent 60%);
  pointer-events: none;
}

@keyframes character-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1.01); }
  50% { transform: translate3d(0, -8px, 0) scale(1.015); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-characters { animation: none; }
}
</style>
