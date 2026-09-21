<script setup>
import { inject, onMounted, ref } from 'vue'
import { PhArrowRight, PhChartLineUp, PhCheck, PhCheckCircle, PhClock, PhLightning, PhShieldCheck, PhSoccerBall, PhTarget, PhTrophy } from '@phosphor-icons/vue'
import { api } from '../api/client'
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
const matchday = new Intl.DateTimeFormat('en-UG', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())
const packagePickCount = (plan) => predictions.value.filter((pick) => pick.package === plan.id).length

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
    notice.value = `${plan.name} access request received. Track it from My access.`
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

        <div class="mx-auto flex w-full max-w-5xl flex-col items-center py-9 text-center sm:py-12">
          <div class="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-[var(--app-accent)] sm:text-xs">
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
            Football intelligence, clearly called
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
          </div>

          <h1 class="hero-brand-title mt-7 text-[clamp(2.7rem,6.4vw,6.2rem)] uppercase leading-[.88]" aria-label="BK Football Predictions">
            <span class="brand-line brand-line--white">BK FOOTBALL</span>
            <span class="brand-line brand-line--green">PREDICTIONS</span>
          </h1>
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
      <div class="matchday-strip border-b border-[var(--app-accent)]/15">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full border border-white/15 bg-black/15"><PhSoccerBall :size="22" weight="duotone" /></span><div><p class="text-[10px] font-bold uppercase tracking-[.22em] text-white/45">Matchday access</p><p class="text-sm font-semibold text-white/90">Choose your viewing window</p></div></div>
          <time class="hidden rounded-full border border-[var(--app-accent)]/30 bg-black/20 px-4 py-2 text-xs font-bold text-[var(--app-accent)] sm:block">{{ matchday }}</time>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div class="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[.2em] text-[var(--app-accent)]">BK access passes</p>
            <h2 class="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-5xl">Choose how deep you want to read.</h2>
            <p class="mt-4 max-w-xl text-pretty leading-7 text-white/55">Select a window that fits your matchday. Each pass opens its assigned calls, prices and analyst notes.</p>
          </div>
          <button type="button" class="inline-flex items-center gap-2 text-sm font-bold text-[var(--app-accent)]" @click="openDialog?.('free-tip')">Reveal the open insight <PhArrowRight :size="17" /></button>
        </div>

        <p v-if="notice" class="mt-7 rounded-2xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 p-4 text-sm text-white">{{ notice }}</p>
        <p v-if="errors.subscription" class="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ errors.subscription }}</p>

        <div v-if="errors.packages" class="mt-9 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Packages are temporarily unavailable. {{ errors.packages }}</div>
        <div v-if="loading" class="mt-9 flex gap-4 overflow-hidden"><div v-for="n in 3" :key="n" class="h-[27rem] min-w-[82vw] animate-pulse rounded-3xl bg-white/5 sm:min-w-[22rem]"></div></div>
        <div v-else-if="packages.length" class="package-rail mt-9 flex snap-x gap-4 overflow-x-auto pb-5 lg:grid lg:grid-cols-3 lg:overflow-visible">
          <article v-for="(plan, index) in packages" :key="plan.id" :class="['group relative flex min-h-[27rem] min-w-[82vw] snap-start flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 sm:min-w-[22rem] lg:min-w-0', plan.is_featured ? 'border-[var(--app-accent)]/75 bg-[#151a11] shadow-[0_24px_70px_rgba(86,110,34,.16)]' : 'border-white/12 bg-[#101310] hover:border-white/25']">
            <div v-if="plan.is_featured" class="absolute right-0 top-0 rounded-bl-2xl bg-[var(--app-accent)] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--app-accent-ink)]">Crowd favourite</div>
            <header class="flex items-start justify-between gap-4 pr-16">
              <div><p class="text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Package {{ String(index + 1).padStart(2, '0') }}</p><h3 class="mt-2 text-2xl font-extrabold tracking-[-.04em]">{{ plan.name }}</h3></div>
            </header>

            <div class="mt-7 rounded-2xl bg-[#f1f2ed] p-4 text-[#161916]">
              <div class="flex items-center justify-between gap-3 border-b border-black/10 pb-3"><span class="text-xs font-bold">{{ plan.access_label }}</span><span class="rounded-md bg-black/7 px-2 py-1 text-[10px] font-bold">{{ plan.is_open ? 'OPEN' : 'CLOSED' }}</span></div>
              <div class="mt-4 grid grid-cols-2 gap-4">
                <div><span class="block text-[9px] font-bold uppercase tracking-wider text-black/45">Access</span><strong class="mt-1 flex items-center gap-1.5 text-sm"><PhClock :size="15" />{{ plan.duration_days }} {{ plan.duration_days === 1 ? 'day' : 'days' }}</strong></div>
                <div><span class="block text-[9px] font-bold uppercase tracking-wider text-black/45">Active picks</span><strong class="mt-1 flex items-center gap-1.5 text-sm"><PhTarget :size="15" />{{ packagePickCount(plan) }}</strong></div>
              </div>
              <p class="mt-4 min-h-10 text-xs leading-5 text-black/55">{{ plan.description }}</p>
            </div>

            <ul class="mt-5 grid gap-2 text-xs text-white/60"><li v-for="benefit in plan.benefits.slice(0, 3)" :key="benefit" class="flex items-center gap-2"><PhCheck :size="15" weight="bold" class="shrink-0 text-[var(--app-accent)]" />{{ benefit }}</li></ul>

            <div class="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
              <div><span class="block text-[9px] font-bold uppercase tracking-[.16em] text-white/35">Package price</span><strong class="mt-1 block text-2xl font-black tracking-[-.04em] numbers"><small class="mr-1 text-[10px] text-white/45">{{ plan.currency }}</small>{{ money(plan.price) }}</strong></div>
              <button type="button" :disabled="submitting === plan.id || !plan.is_open" :class="['inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45', plan.is_featured ? 'bg-[var(--app-accent)] text-[var(--app-accent-ink)] hover:bg-[var(--app-accent-hover)]' : 'border border-[var(--app-accent)]/55 text-[var(--app-accent)] hover:bg-[var(--app-accent)]/10']" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Sending...' : plan.is_open ? 'Request pass' : 'Closed' }} <PhArrowRight :size="16" /></button>
            </div>
          </article>
        </div>
        <div v-else class="mt-9 grid min-h-56 place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[.025] px-6 text-center text-white/45">The next match packages are being prepared.</div>
      </div>
    </section>

    <section id="results" class="scroll-mt-16 border-y border-[var(--app-line)] bg-[var(--app-surface)]">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="mb-9 max-w-2xl"><p class="text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">The public record</p><h2 class="mt-3 text-balance text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Calls are measured after the whistle.</h2><p class="mt-4 text-[var(--app-muted)]">Settled outcomes remain visible so every member can judge the record.</p></div>
        <div v-if="errors.wins" class="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Results are temporarily unavailable. {{ errors.wins }}</div>
        <div v-else-if="loading" class="h-72 animate-pulse rounded-3xl bg-[var(--app-surface-2)]"></div>
        <div v-else-if="wins.length" class="grid gap-8 md:grid-cols-[.8fr_1.2fr]">
          <div v-if="wins[0].image_url" class="min-h-72 overflow-hidden rounded-3xl"><img :src="wins[0].image_url" :alt="wins[0].title" class="h-full w-full object-cover" /></div>
          <div v-else class="grid min-h-72 place-items-center rounded-3xl bg-[var(--app-surface-2)] text-[var(--app-accent)]"><PhSoccerBall :size="80" weight="duotone" /></div>
          <div class="self-center"><p class="text-sm font-semibold text-[var(--app-accent)]">Latest settled call</p><h3 class="mt-3 text-4xl font-extrabold tracking-[-.05em]">{{ wins[0].title }}</h3><p class="mt-4 max-w-xl leading-7 text-[var(--app-muted)]">{{ wins[0].summary }}</p><div class="mt-7 flex items-center gap-3"><PhCheckCircle :size="23" class="text-[var(--app-accent)]" /><span class="font-semibold">Published {{ new Date(wins[0].settled_at).toLocaleDateString('en-UG') }}</span></div></div>
        </div>
        <div v-else class="grid min-h-56 place-items-center rounded-3xl border border-dashed border-[var(--app-line)] bg-[#0b100d] px-6 text-center text-[var(--app-muted)]">The first settled record will appear here after full time.</div>
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

.hero-brand-title {
  width: min(100%, 61rem);
  font-family: "Outfit Variable", "Segoe UI", sans-serif;
  filter: drop-shadow(0 1.25rem 2.5rem rgb(0 0 0 / 0.42));
  font-kerning: normal;
  font-feature-settings: "kern" 1;
}

.brand-line {
  display: block;
  white-space: nowrap;
  font-weight: 900;
  letter-spacing: -.068em;
}

.brand-line--white {
  color: #f4f7f1;
  text-shadow: .025em .025em #aebf79, .055em .06em #33431f, .08em .09em #1d2a10;
}

.brand-line--green {
  color: #a8c957;
  text-shadow: .025em .025em #7f9f35, .055em .06em #304712, .08em .09em #192709;
}

.matchday-strip {
  background:
    linear-gradient(90deg, rgb(168 201 87 / 0.06) 1px, transparent 1px) 0 0 / 8rem 100%,
    linear-gradient(90deg, #142a16, #19351b 48%, #142a16);
}

.package-stage::before {
  position: absolute;
  inset: 5.1rem 0 auto;
  z-index: -1;
  height: 22rem;
  content: '';
  background: radial-gradient(circle at 50% 0, rgb(168 201 87 / 0.08), transparent 60%);
  pointer-events: none;
}

.package-rail {
  scrollbar-color: rgb(168 201 87 / 0.55) rgb(255 255 255 / 0.06);
  scrollbar-width: thin;
}

@keyframes character-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1.01); }
  50% { transform: translate3d(0, -8px, 0) scale(1.015); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-characters { animation: none; }
}
</style>
