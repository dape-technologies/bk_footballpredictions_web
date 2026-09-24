<script setup>
import { inject, onMounted, ref } from 'vue'
import { PhArrowRight, PhClock, PhLightning, PhMoneyWavy, PhReceipt, PhShieldCheck, PhTrendUp, PhTrophy, PhWallet } from '@phosphor-icons/vue'
import { api } from '../api/client'
import HeroWordmark from '../components/HeroWordmark.vue'

const predictions = ref([])
const packages = ref([])
const wins = ref([])
const testimonials = ref([])
const loading = ref(true)
const errors = ref({})
const openDialog = inject('openAppDialog')
const startCheckout = inject('startPackageCheckout')
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const formatStart = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'To be announced'

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function requestAccess(plan) { startCheckout?.(plan) }

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
      <div class="hero-ledger pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] opacity-55" aria-hidden="true"></div>
      <img src="/illustrations/income-hero-visual.png" alt="" class="hero-income-art pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-55 mix-blend-screen" aria-hidden="true" />

      <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8 lg:pb-28">
        <button type="button" class="group inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-black/30 px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[.16em] text-white/75 backdrop-blur-sm transition hover:border-[var(--app-accent)]/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)]" @click="openDialog?.('free-tip')">
          <span class="grid size-7 place-items-center rounded-full bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhLightning :size="14" weight="fill" /></span>
          <span><span class="block text-[9px] text-white/45">Today's earning angle</span>Reveal the free pick</span>
          <PhArrowRight class="ml-1 text-[var(--app-accent)] transition group-hover:translate-x-1" :size="15" />
        </button>

        <div class="mx-auto flex min-w-0 w-full max-w-5xl flex-col items-center py-9 text-center sm:py-12">
          <div class="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-[var(--app-accent)] sm:text-xs">
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
            Betting intelligence built for return
            <span class="h-px w-8 bg-[var(--app-accent)]/60 sm:w-14"></span>
          </div>

          <HeroWordmark />
          <p class="mt-6 text-balance text-2xl font-black tracking-[-.04em] text-[#f2f4ea] sm:text-3xl">Life Must Change</p>
          <p class="mt-3 max-w-2xl text-pretty text-base font-medium leading-7 text-white/65 sm:text-lg">You either win with us or see us winning</p>

          <div class="mt-7 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            <button type="button" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-6 font-extrabold text-[var(--app-accent-ink)] transition hover:-translate-y-0.5 hover:bg-[var(--app-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)] active:scale-[.98]" @click="scrollTo('packages')">View earning packages <PhArrowRight :size="18" /></button>
            <button type="button" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--app-accent)]/65 bg-black/20 px-6 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--app-accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)] active:scale-[.98]" @click="openDialog?.('free-tip')">Reveal the free pick <PhLightning :size="18" /></button>
          </div>

          <div class="mt-9 grid w-full max-w-2xl grid-cols-3 border-y border-white/10 py-5 text-left sm:border-0 sm:py-0">
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhWallet class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Income focus</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Packages built to earn</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 border-x border-white/10 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhTrendUp class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Value bets</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Selections with purpose</span></div>
            </div>
            <div class="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
              <PhReceipt class="text-[var(--app-accent)]" :size="25" weight="duotone" />
              <div><strong class="block text-xs font-extrabold uppercase tracking-wider sm:text-sm">Proof</strong><span class="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">Wins made public</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="packages" class="package-stage relative isolate scroll-mt-16 border-y border-white/10 bg-[#090b09] text-[#f2f4ea]">
      <div class="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between gap-5">
          <div><p class="text-xs font-bold uppercase tracking-[.2em] text-[var(--app-accent)]">Active packages</p><h2 class="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-5xl">Choose your earning package.</h2></div>
          <span class="hidden text-sm font-semibold text-white/40 sm:block">{{ packages.filter((plan) => plan.is_open).length }} open</span>
        </div>

        <div v-if="errors.packages" class="mt-9 break-words rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Packages are temporarily unavailable. {{ errors.packages }}</div>
        <div v-if="loading" class="mobile-card-rail mt-9 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start animate-pulse bg-white/5 md:w-auto"></div></div>
        <div v-else-if="packages.length" class="mobile-card-rail mt-9 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
          <article v-for="plan in packages" :key="plan.id" class="group flex min-h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start flex-col overflow-hidden border border-white/12 bg-[#101310] transition duration-300 hover:-translate-y-1 hover:border-[var(--app-accent)]/55 md:w-auto">
            <div class="relative h-48 overflow-hidden bg-[#171d18]">
              <img v-if="plan.image_url" :src="plan.image_url" :alt="`${plan.name} package`" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div v-else class="grid h-full place-items-center text-[var(--app-accent)]/45"><PhMoneyWavy :size="64" weight="duotone" /></div>
              <span class="absolute left-4 top-4 bg-[#090b09]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--app-accent)] backdrop-blur">{{ plan.package_type }}</span>
              <span v-if="!plan.is_open" class="absolute right-4 top-4 bg-red-950/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-red-200 backdrop-blur">Closed</span>
            </div>
            <div class="flex flex-1 flex-col p-6">
              <div class="flex items-start justify-between gap-4"><h3 class="text-2xl font-extrabold tracking-[-.04em]">{{ plan.name }}</h3><strong class="text-xl font-black numbers"><small class="mr-1 text-[9px] text-white/35">{{ plan.currency }}</small>{{ money(plan.price) }}</strong></div>
              <dl class="mt-6 grid grid-cols-2 border-y border-white/10 py-4">
                <div><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Win probability</dt><dd class="mt-1 text-xl font-black text-[var(--app-accent)] numbers">{{ plan.win_probability }}%</dd></div>
                <div class="border-l border-white/10 pl-4"><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">{{ plan.is_open ? 'Closes' : 'Closed' }}</dt><dd class="mt-1 flex items-center gap-1.5 text-sm font-bold"><PhClock :size="15" />{{ formatStart(plan.closes_at) }}</dd></div>
              </dl>
              <button type="button" :disabled="!plan.is_open" class="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] transition hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/35" @click="requestAccess(plan)">{{ plan.is_open ? 'Buy package' : 'Closed' }} <PhArrowRight v-if="plan.is_open" :size="17" /></button>
            </div>
          </article>
        </div>
        <div v-else class="mt-9 grid min-h-48 place-items-center border border-dashed border-white/15 px-6 text-center text-white/45">No active packages.</div>
      </div>
    </section>

    <section id="results" class="scroll-mt-16 border-y border-[var(--app-line)] bg-[var(--app-surface)]">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="mb-9 flex items-end justify-between gap-5"><div><p class="text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]">Results</p><h2 class="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Recent wins.</h2></div><span class="hidden text-sm font-semibold text-[var(--app-muted)] sm:block">{{ wins.length }} published</span></div>
        <div v-if="errors.wins" class="break-words border border-red-400/30 bg-red-500/10 p-5 text-red-200">Recent wins are unavailable. {{ errors.wins }}</div>
        <div v-else-if="loading" class="mobile-card-rail flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"><div v-for="n in 3" :key="n" class="h-80 w-[min(84vw,22rem)] shrink-0 snap-start animate-pulse bg-[var(--app-surface-2)] md:w-auto"></div></div>
        <div v-else-if="wins.length" class="mobile-card-rail flex gap-4 overflow-x-auto pb-3 md:grid md:auto-rows-[20rem] md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3">
          <article v-for="(win,index) in wins" :key="win.id" :class="['group relative h-80 w-[min(84vw,22rem)] shrink-0 snap-start overflow-hidden bg-[#0b100d] md:w-auto', index===0 && wins.length>1 ? 'md:row-span-2 md:h-auto lg:col-span-2' : '']">
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

.hero-ledger {
  background:
    linear-gradient(155deg, transparent 47.7%, rgb(168 201 87 / 0.22) 48%, transparent 48.3%),
    repeating-linear-gradient(90deg, rgb(242 244 234 / 0.055) 0 1px, transparent 1px 5rem),
    repeating-linear-gradient(0deg, rgb(242 244 234 / 0.045) 0 1px, transparent 1px 3rem),
    linear-gradient(0deg, rgb(168 201 87 / 0.06), transparent 78%);
  border-top: 1px solid rgb(168 201 87 / 0.08);
  transform: perspective(650px) rotateX(58deg) scaleX(1.3);
  transform-origin: bottom center;
}

.hero-ledger::after {
  position: absolute;
  right: 8%;
  bottom: 12%;
  width: min(34rem, 72vw);
  height: 38%;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(168 201 87 / 0.13));
  clip-path: polygon(0 84%, 18% 70%, 36% 76%, 55% 44%, 74% 51%, 100% 5%, 100% 100%, 0 100%);
}

.hero-income-art { animation: income-drift 9s ease-in-out infinite; }

.package-stage::before {
  position: absolute;
  inset: 5.1rem 0 auto;
  z-index: -1;
  height: 22rem;
  content: '';
  background: radial-gradient(circle at 50% 0, rgb(168 201 87 / 0.08), transparent 60%);
  pointer-events: none;
}

.mobile-card-rail {
  overscroll-behavior-x: contain;
  scroll-padding-inline: 1rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-card-rail::-webkit-scrollbar { display: none; }

@keyframes income-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1.01); }
  50% { transform: translate3d(0, -5px, 0) scale(1.015); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-income-art { animation: none; }
}

@media (max-width: 767px) {
  .hero-income-art {
    object-position: 18% center;
    opacity: .32;
  }
}
</style>
