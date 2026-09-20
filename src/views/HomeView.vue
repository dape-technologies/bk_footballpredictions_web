<script setup>
import { onMounted, ref } from 'vue'
import { PhArrowRight, PhChartLineUp, PhCheck, PhCheckCircle, PhClock, PhCrown, PhLightning, PhShieldCheck, PhSoccerBall, PhTarget, PhTrophy } from '@phosphor-icons/vue'
import { api } from '../api/client'
import PredictionCard from '../components/PredictionCard.vue'

const predictions = ref([])
const packages = ref([])
const wins = ref([])
const testimonials = ref([])
const loading = ref(true)
const errors = ref({})
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const matchday = new Intl.DateTimeFormat('en-UG', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())
const packagePickCount = (plan) => predictions.value.filter((pick) => pick.package === plan.id).length

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
    <section class="hero-stage relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#070908] text-[#f2f4ea]">
      <div class="hero-lights pointer-events-none absolute inset-0 -z-20" aria-hidden="true"></div>
      <div class="hero-pitch pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] opacity-60" aria-hidden="true"></div>

      <PhSoccerBall class="hero-orbit left-[7%] top-[32%] hidden text-[#c7ff36]/35 lg:block" :size="34" weight="thin" aria-hidden="true" />
      <PhTarget class="hero-orbit right-[8%] top-[29%] hidden text-[#c7ff36]/45 lg:block" :size="37" weight="thin" aria-hidden="true" />
      <PhTrophy class="hero-orbit right-[14%] bottom-[23%] hidden text-[#f2f4ea]/25 lg:block" :size="31" weight="thin" aria-hidden="true" />

      <div class="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 sm:pb-16 lg:px-8">
        <RouterLink to="/predictions" class="group inline-flex w-fit items-center gap-3 rounded-full border border-white/25 bg-black/20 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[.16em] text-white/75 backdrop-blur-sm transition hover:border-[#c7ff36]/65 hover:text-white">
          <span class="grid size-7 place-items-center rounded-full bg-[#c7ff36] text-[#11150c]"><PhLightning :size="14" weight="fill" /></span>
          <span><span class="block text-[9px] text-white/45">Free daily tip</span>View today’s board</span>
          <PhArrowRight class="ml-1 text-[#c7ff36] transition group-hover:translate-x-1" :size="15" />
        </RouterLink>

        <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-10 text-center sm:py-12">
          <div class="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-[#c7ff36] sm:text-xs">
            <span class="h-px w-8 bg-[#c7ff36]/60 sm:w-14"></span>
            Match analysis for sharper football decisions
            <span class="h-px w-8 bg-[#c7ff36]/60 sm:w-14"></span>
          </div>

          <h1 class="hero-brand-title mt-6 max-w-[12ch] text-balance text-[clamp(3.2rem,8.6vw,8rem)] font-black uppercase leading-[.8] tracking-[-.075em]" aria-label="BK Football Predictions">
            <span class="block">BK Football</span>
            <span class="hero-brand-accent block text-[#c7ff36]">Predictions</span>
          </h1>
          <p class="mt-6 text-balance text-xl font-semibold tracking-[-.025em] text-[#f2f4ea] sm:text-2xl">Join Us or See Us Win</p>
          <p class="mt-3 max-w-2xl text-pretty text-sm leading-6 text-white/55 sm:text-base">Daily picks, clear reasoning and transparent results in one fast football app.</p>

          <div class="mt-7 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            <RouterLink to="/predictions" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c7ff36] px-6 font-extrabold text-[#11150c] transition hover:-translate-y-0.5 hover:bg-[#d3ff63] active:scale-[.98]">View today’s tips <PhArrowRight :size="18" /></RouterLink>
            <RouterLink to="/packages" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#c7ff36]/65 px-6 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#c7ff36]/10 active:scale-[.98]">Unlock VIP <PhCrown :size="18" /></RouterLink>
          </div>

          <div class="mt-10 grid w-full max-w-2xl grid-cols-3 border-y border-white/10 py-5 text-left sm:mt-12 sm:border-0 sm:py-0">
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhChartLineUp class="text-[#c7ff36]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Daily</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Match analysis</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 border-x border-white/10 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhTarget class="text-[#c7ff36]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Clear</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Pick reasoning</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhTrophy class="text-[#c7ff36]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Visible</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Published results</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="packages" class="package-stage relative isolate scroll-mt-16 border-y border-white/10 bg-[#090b09] text-[#f2f4ea]">
      <div class="matchday-strip border-b border-[#c7ff36]/15">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full border border-white/15 bg-black/15"><PhSoccerBall :size="22" weight="duotone" /></span><div><p class="text-[10px] font-bold uppercase tracking-[.22em] text-white/45">Today’s matchday</p><p class="text-sm font-semibold text-white/90">Choose your access package</p></div></div>
          <time class="hidden rounded-full border border-[#c7ff36]/30 bg-black/20 px-4 py-2 text-xs font-bold text-[#c7ff36] sm:block">{{ matchday }}</time>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div class="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[.2em] text-[#c7ff36]">BK match packages</p>
            <h2 class="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-5xl">Choose how you follow the board.</h2>
            <p class="mt-4 max-w-xl text-pretty leading-7 text-white/55">Pick the access window that fits your matchday. Each package unlocks its attached selections, odds and analyst reasoning.</p>
          </div>
          <RouterLink to="/packages" class="inline-flex items-center gap-2 text-sm font-bold text-[#c7ff36]">Compare all package details <PhArrowRight :size="17" /></RouterLink>
        </div>

        <div v-if="errors.packages" class="mt-9 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Packages are temporarily unavailable. {{ errors.packages }}</div>
        <div v-if="loading" class="mt-9 flex gap-4 overflow-hidden"><div v-for="n in 3" :key="n" class="h-[27rem] min-w-[82vw] animate-pulse rounded-3xl bg-white/5 sm:min-w-[22rem]"></div></div>
        <div v-else-if="packages.length" class="package-rail mt-9 flex snap-x gap-4 overflow-x-auto pb-5 lg:grid lg:grid-cols-3 lg:overflow-visible">
          <article v-for="(plan, index) in packages" :key="plan.id" :class="['group relative flex min-h-[27rem] min-w-[82vw] snap-start flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 sm:min-w-[22rem] lg:min-w-0', plan.is_featured ? 'border-[#c7ff36]/75 bg-[#151a11] shadow-[0_24px_70px_rgba(122,160,32,.16)]' : 'border-white/12 bg-[#101310] hover:border-white/25']">
            <div v-if="plan.is_featured" class="absolute right-0 top-0 rounded-bl-2xl bg-[#c7ff36] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#11150c]">Most popular</div>
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

            <ul class="mt-5 grid gap-2 text-xs text-white/60"><li v-for="benefit in plan.benefits.slice(0, 3)" :key="benefit" class="flex items-center gap-2"><PhCheck :size="15" weight="bold" class="shrink-0 text-[#c7ff36]" />{{ benefit }}</li></ul>

            <div class="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
              <div><span class="block text-[9px] font-bold uppercase tracking-[.16em] text-white/35">Package price</span><strong class="mt-1 block text-2xl font-black tracking-[-.04em] numbers"><small class="mr-1 text-[10px] text-white/45">{{ plan.currency }}</small>{{ money(plan.price) }}</strong></div>
              <RouterLink :to="{ path: '/packages', query: { plan: plan.slug } }" :class="['inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition active:scale-[.98]', plan.is_featured ? 'bg-[#c7ff36] text-[#11150c] hover:bg-[#d4ff66]' : 'border border-[#c7ff36]/55 text-[#c7ff36] hover:bg-[#c7ff36]/10']">Choose <PhArrowRight :size="16" /></RouterLink>
            </div>
          </article>
        </div>
        <div v-else class="mt-9 grid min-h-56 place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[.025] px-6 text-center text-white/45">The next match packages are being prepared.</div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="max-w-xl"><h2 class="text-balance text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Today’s picks are ready.</h2><p class="mt-4 text-[var(--app-muted)]">Free selections stay open. VIP analysis unlocks with active package access.</p></div>
      <div v-if="errors.predictions" class="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Predictions are temporarily unavailable. {{ errors.predictions }}</div>
      <div v-if="loading" class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-2xl bg-[var(--app-surface)]"></div></div>
      <div v-else class="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
        <PredictionCard v-for="(pick, index) in predictions.slice(0, 6)" :key="pick.id" :prediction="pick" :featured="index === 0" class="min-w-[84vw] sm:min-w-80 lg:min-w-0" />
      </div>
      <RouterLink to="/predictions" class="mt-5 inline-flex items-center gap-2 font-bold text-[var(--app-accent)]">Open the full board <PhArrowRight :size="17" /></RouterLink>
    </section>

    <section v-if="wins.length" class="border-y border-[var(--app-line)] bg-[var(--app-surface)]">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 md:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div v-if="wins[0].image_url" class="min-h-72 overflow-hidden rounded-3xl"><img :src="wins[0].image_url" :alt="wins[0].title" class="h-full w-full object-cover" /></div>
        <div v-else class="grid min-h-72 place-items-center rounded-3xl bg-[var(--app-surface-2)] text-[var(--app-accent)]"><PhSoccerBall :size="80" weight="duotone" /></div>
        <div class="self-center"><p class="text-sm font-semibold text-[var(--app-accent)]">Recent result</p><h2 class="mt-3 text-4xl font-extrabold tracking-[-.05em]">{{ wins[0].title }}</h2><p class="mt-4 max-w-xl leading-7 text-[var(--app-muted)]">{{ wins[0].summary }}</p><div class="mt-7 flex items-center gap-3"><PhCheckCircle :size="23" class="text-[var(--app-accent)]" /><span class="font-semibold">Result published {{ new Date(wins[0].settled_at).toLocaleDateString('en-UG') }}</span></div></div>
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
    linear-gradient(0deg, rgb(199 255 54 / 0.05), transparent 72%);
  border-top: 1px solid rgb(199 255 54 / 0.09);
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

.hero-orbit {
  position: absolute;
  animation: hero-float 6s ease-in-out infinite;
}

.hero-orbit:nth-of-type(2) { animation-delay: -2s; }
.hero-orbit:nth-of-type(3) { animation-delay: -4s; }

.hero-brand-title {
  animation: brand-breathe 4.8s cubic-bezier(.45, 0, .2, 1) infinite;
  filter: drop-shadow(0 1.5rem 3rem rgb(0 0 0 / 0.36));
  transform-origin: center;
}

.hero-brand-accent {
  animation: brand-glow 2.8s ease-in-out infinite;
}

.matchday-strip {
  background:
    linear-gradient(90deg, rgb(199 255 54 / 0.06) 1px, transparent 1px) 0 0 / 8rem 100%,
    linear-gradient(90deg, #142a16, #19351b 48%, #142a16);
}

.package-stage::before {
  position: absolute;
  inset: 5.1rem 0 auto;
  z-index: -1;
  height: 22rem;
  content: '';
  background: radial-gradient(circle at 50% 0, rgb(199 255 54 / 0.08), transparent 60%);
  pointer-events: none;
}

.package-rail {
  scrollbar-color: rgb(199 255 54 / 0.55) rgb(255 255 255 / 0.06);
  scrollbar-width: thin;
}

@keyframes hero-float {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-12px) rotate(4deg); }
}

@keyframes brand-breathe {
  0%, 100% { transform: scale(1); letter-spacing: -0.075em; }
  50% { transform: scale(1.012); letter-spacing: -0.068em; }
}

@keyframes brand-glow {
  0%, 100% { text-shadow: 0 0 0 rgb(199 255 54 / 0), 0 0 1.2rem rgb(199 255 54 / 0.12); }
  50% { text-shadow: 0 0 1px rgb(242 244 234 / 0.5), 0 0 2.4rem rgb(199 255 54 / 0.32); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orbit,
  .hero-brand-title,
  .hero-brand-accent { animation: none; }
}
</style>
