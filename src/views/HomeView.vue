<script setup>
import { computed, inject, nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import { PhArrowRight, PhCheckCircle, PhClock, PhLightning, PhMoneyWavy, PhReceipt, PhShieldCheck, PhTrendUp, PhTrophy, PhWallet } from '@phosphor-icons/vue'
import { api } from '../api/client'
import { trackPackageView } from '../telemetry'
import HeroWordmark from '../components/HeroWordmark.vue'
import { useAuthStore } from '../stores/auth'

const freePick = ref(null)
const freePickSeen = ref(false)
const packages = ref([])
const wins = ref([])
const testimonials = ref([])
const loading = ref(true)
const errors = ref({})
const notice = ref('')
const submitting = ref(null)
const auth = useAuthStore()
const openDialog = inject('openAppDialog')
let packageObserver
let contentRefreshTimer
let freePickExpiryTimer
const viewedPackageIds = new Set()
const freePickLive = computed(() => Boolean(freePick.value && new Date(freePick.value.closes_at).getTime() > Date.now()))
const money = (value) => new Intl.NumberFormat('en-UG').format(value)
const formatStart = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : 'To be announced'
const formatResultDate = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Recently settled'

function winDetails(win, index) {
  const caption = String(win.caption || '').replace(/\s+/g, ' ').trim()
  const ticketUrl = caption.match(/https?:\/\/[^\s]+/i)?.[0] || ''
  const title = caption.replace(ticketUrl, '').replace(/[\s—–|-]+$/, '').trim()
  return { title: title || `Winning result ${String(index + 1).padStart(2, '0')}`, ticketUrl }
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scheduleFreePickExpiry() {
  window.clearTimeout(freePickExpiryTimer)
  if (!freePick.value) return
  const remaining = new Date(freePick.value.closes_at).getTime() - Date.now()
  if (remaining <= 0) {
    freePick.value = null
    return
  }
  const seenKey = `bk-free-pick-seen-${freePick.value.id}`
  freePickSeen.value = sessionStorage.getItem(seenKey) === 'true'
  freePickExpiryTimer = window.setTimeout(scheduleFreePickExpiry, Math.min(remaining, 2_147_483_647))
}

function revealFreePick() {
  if (freePickLive.value) {
    freePickSeen.value = true
    sessionStorage.setItem(`bk-free-pick-seen-${freePick.value.id}`, 'true')
  }
  openDialog?.('free-tip')
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
    const purchase = await api('/v1/me/purchases/', { method: 'POST', body: JSON.stringify({ package_id: plan.id }) })
    if (purchase.is_paid) {
      openDialog?.('account')
    } else {
      openDialog?.('payment', { plan, purchase })
    }
  } catch (error) { errors.value.subscription = error.message }
  finally { submitting.value = null }
}

function observePackageCards() {
  document.querySelectorAll('[data-package-id]').forEach((element) => {
    if (!viewedPackageIds.has(Number(element.dataset.packageId))) packageObserver?.observe(element)
  })
}

async function loadPublicContent(initial = false) {
  const resources = [
    ['freePick', freePick, '/v1/free-pick/'],
    ['packages', packages, '/v1/packages/'],
    ['wins', wins, '/v1/recent-wins/'],
    ['testimonials', testimonials, '/v1/testimonials/'],
  ]
  const results = await Promise.allSettled(resources.map(([, , path]) => api(path)))

  results.forEach((result, index) => {
    const [name, target] = resources[index]
    if (result.status === 'fulfilled') {
      target.value = result.value
      errors.value[name] = ''
    } else if (initial) errors.value[name] = result.reason?.message || 'This section could not be loaded.'
  })
  if (initial) loading.value = false
  scheduleFreePickExpiry()
  await nextTick()
  observePackageCards()
}

function refreshPublicContent() {
  if (!document.hidden) loadPublicContent(false)
}

onMounted(async () => {
  packageObserver = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      const packageId = Number(entry.target.dataset.packageId)
      viewedPackageIds.add(packageId)
      trackPackageView(packageId)
      packageObserver.unobserve(entry.target)
    })
  }, { threshold: 0.5 })
  await loadPublicContent(true)
  contentRefreshTimer = window.setInterval(refreshPublicContent, 30_000)
  document.addEventListener('visibilitychange', refreshPublicContent)
})

onBeforeUnmount(() => {
  window.clearInterval(contentRefreshTimer)
  window.clearTimeout(freePickExpiryTimer)
  document.removeEventListener('visibilitychange', refreshPublicContent)
  packageObserver?.disconnect()
})
</script>

<template>
  <div class="overflow-hidden">
    <section id="top" class="hero-stage relative isolate scroll-mt-16 overflow-hidden bg-[#070908] text-[#f2f4ea]">
      <div class="hero-lights pointer-events-none absolute inset-0 -z-20" aria-hidden="true"></div>
      <div class="hero-ledger pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] opacity-55" aria-hidden="true"></div>
      <picture><source media="(max-width: 767px)" srcset="/illustrations/mobile/income-hero-visual.webp"><img src="/illustrations/income-hero-visual.webp" fetchpriority="high" decoding="async" width="1920" height="720" alt="" class="hero-income-art pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-55 mix-blend-screen" aria-hidden="true" /></picture>

      <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8 lg:pb-28">
        <button type="button" :class="['free-pick-cta group inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-black/30 px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[.16em] text-white/75 backdrop-blur-sm transition hover:border-[var(--app-accent)]/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)]', { live: freePickLive, 'free-pick-attention': freePickLive && !freePickSeen }]" @click="revealFreePick">
          <span class="grid size-7 place-items-center rounded-full bg-[var(--app-accent)] text-[var(--app-accent-ink)]"><PhLightning :size="14" weight="fill" /></span>
          <span><span class="block text-[9px]" :class="freePickLive ? 'text-[var(--app-accent)]' : 'text-white/45'">{{ freePickLive ? 'Live now' : "Today's earning angle" }}</span>Reveal the free pick</span>
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
            <button type="button" :class="['free-pick-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--app-accent)]/65 bg-black/20 px-6 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--app-accent)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)] active:scale-[.98]', { live: freePickLive, 'free-pick-attention': freePickLive && !freePickSeen }]" @click="revealFreePick">Reveal the free pick <span v-if="freePickLive" class="free-pick-live-label">Live</span><PhLightning :size="18" /></button>
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
          <span class="hidden text-sm font-semibold text-white/40 sm:block">{{ packages.length }} available</span>
        </div>

        <p v-if="notice" class="mt-7 rounded-2xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 p-4 text-sm text-white">{{ notice }}</p>
        <p v-if="errors.subscription" class="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{{ errors.subscription }}</p>

        <div v-if="errors.packages" class="mt-9 break-words rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">Packages are temporarily unavailable. {{ errors.packages }}</div>
        <div v-if="loading" class="mobile-card-rail mt-9 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3"><div v-for="n in 3" :key="n" class="h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start animate-pulse bg-white/5 md:w-auto"></div></div>
        <div v-else-if="packages.length" class="mobile-card-rail mt-9 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
          <article v-for="plan in packages" :key="plan.id" :data-package-id="plan.id" class="group flex min-h-[28rem] w-[min(84vw,22rem)] shrink-0 snap-start flex-col overflow-hidden border border-white/12 bg-[#101310] transition duration-300 hover:-translate-y-1 hover:border-[var(--app-accent)]/55 md:w-auto">
            <div class="relative h-48 overflow-hidden bg-[#171d18]">
              <img v-if="plan.image_url" :src="plan.image_url" :alt="`${plan.name} package`" loading="lazy" decoding="async" width="640" height="400" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div v-else class="grid h-full place-items-center text-[var(--app-accent)]/45"><PhMoneyWavy :size="64" weight="duotone" /></div>
              <span class="absolute left-4 top-4 bg-[#090b09]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--app-accent)] backdrop-blur">{{ plan.package_type }}</span>
            </div>
            <div class="flex flex-1 flex-col p-6">
              <div class="flex items-start justify-between gap-4"><h3 class="text-2xl font-extrabold tracking-[-.04em]">{{ plan.name }}</h3><strong class="text-xl font-black numbers"><small class="mr-1 text-[9px] text-white/35">{{ plan.currency }}</small>{{ money(plan.price) }}</strong></div>
              <dl class="mt-6 grid grid-cols-2 border-y border-white/10 py-4">
                <div><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Win probability</dt><dd class="mt-1 text-xl font-black text-[var(--app-accent)] numbers">{{ plan.win_probability }}%</dd></div>
                <div class="border-l border-white/10 pl-4"><dt class="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Closes</dt><dd class="mt-1 flex items-center gap-1.5 text-sm font-bold"><PhClock :size="15" />{{ formatStart(plan.closes_at) }}</dd></div>
              </dl>
              <button type="button" :disabled="submitting === plan.id || !plan.is_open" class="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--app-accent)] px-5 font-extrabold text-[var(--app-accent-ink)] transition hover:bg-[var(--app-accent-hover)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45" @click="requestAccess(plan)">{{ submitting === plan.id ? 'Processing…' : plan.is_open ? 'Buy slip' : 'Unavailable' }} <PhArrowRight :size="17" /></button>
            </div>
          </article>
        </div>
        <div v-else class="mt-9 grid min-h-48 place-items-center border border-dashed border-white/15 px-6 text-center text-white/45">No active packages.</div>
      </div>
    </section>

    <section id="results" class="scroll-mt-16 border-y border-[var(--app-line)] bg-[#0a0e0b]">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div class="mb-10 grid gap-6 border-b border-white/10 pb-8 md:grid-cols-[1fr_auto] md:items-end"><div><p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[var(--app-accent)]"><PhCheckCircle :size="16" weight="fill" /> Settled proof</p><h2 class="mt-3 text-balance text-4xl font-extrabold tracking-[-.055em] sm:text-6xl">Recent wins, clearly documented.</h2><p class="mt-4 max-w-2xl text-pretty leading-7 text-white/50">A public record of recently settled tickets from the BK desk. Open shared tickets where available.</p></div><div class="flex items-baseline gap-2 md:block md:text-right"><strong class="numbers text-4xl font-black text-white">{{ wins.length }}</strong><span class="text-xs font-bold uppercase tracking-[.14em] text-white/35 md:block">published results</span></div></div>
        <div v-if="errors.wins" class="break-words border border-red-400/30 bg-red-500/10 p-5 text-red-200">Recent wins are unavailable. {{ errors.wins }}</div>
        <div v-else-if="loading" class="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-12"><div v-for="n in 3" :key="n" :class="['h-96 animate-pulse bg-[var(--app-surface-2)]', n===1 ? 'lg:col-span-7 lg:row-span-2 lg:h-auto' : 'lg:col-span-5 lg:h-72']"></div></div>
        <div v-else-if="wins.length" class="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-12">
          <article v-for="(win,index) in wins" :key="win.id" :class="['group min-w-0 overflow-hidden bg-[#0b100d]', index===0 ? (wins.length > 1 ? 'lg:col-span-7 lg:row-span-2' : 'lg:col-span-12') : 'lg:col-span-5 lg:grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]']">
            <figure :class="['relative overflow-hidden bg-[#060806]', index===0 ? 'aspect-[4/3]' : 'aspect-[4/3] lg:aspect-auto lg:min-h-72']">
              <img v-if="win.image_url" :src="win.image_url" :alt="winDetails(win,index).title" loading="lazy" decoding="async" class="h-full w-full object-contain transition duration-500 group-hover:scale-[1.015]">
              <div v-else class="grid h-full place-items-center text-[var(--app-accent)]"><PhTrophy :size="64" weight="duotone" /></div>
              <span class="absolute left-4 top-4 inline-flex items-center gap-1.5 bg-[#0b100d]/90 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--app-accent)] backdrop-blur"><PhCheckCircle :size="13" weight="fill" /> Settled</span>
            </figure>
            <div :class="['flex min-w-0 flex-col border-t border-white/10 p-5 text-white sm:p-6', index>0 ? 'lg:border-l lg:border-t-0' : '']">
              <div class="flex items-center justify-between gap-4"><span class="numbers text-[10px] font-bold uppercase tracking-[.14em] text-white/35">Result {{ String(index + 1).padStart(2, '0') }}</span><time class="shrink-0 text-[10px] font-semibold text-white/40">{{ formatResultDate(win.settled_at) }}</time></div>
              <h3 :class="['mt-4 break-words font-extrabold leading-tight tracking-[-.035em]', index===0 ? 'text-2xl sm:text-3xl' : 'text-xl']">{{ winDetails(win,index).title }}</h3>
              <a v-if="winDetails(win,index).ticketUrl" :href="winDetails(win,index).ticketUrl" target="_blank" rel="noopener noreferrer" class="mt-7 inline-flex w-fit items-center gap-2 border-b border-[var(--app-accent)] pb-1 text-xs font-extrabold uppercase tracking-[.1em] text-[var(--app-accent)] transition hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--app-accent)]">View shared ticket <PhArrowRight :size="15" /></a>
            </div>
          </article>
        </div>
        <div v-else class="grid min-h-48 place-items-center border border-dashed border-white/15 px-6 text-center text-white/45">No recent wins yet.</div>
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

.free-pick-cta.live {
  border-color: rgb(199 255 69 / .9);
  background: rgb(35 49 16 / .78);
  box-shadow: 0 0 0 1px rgb(199 255 69 / .12), 0 0 28px rgb(168 201 87 / .2);
}

.free-pick-live-label {
  border-radius: 999px;
  background: var(--app-accent);
  padding: .2rem .45rem;
  color: var(--app-accent-ink);
  font-size: .58rem;
  font-weight: 950;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.free-pick-attention { animation: free-pick-signal 10s ease-in-out infinite; transform-origin: center; }

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

@keyframes free-pick-signal {
  0%, 7%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  1.2% { transform: translate3d(-3px, 0, 0) rotate(-.6deg) scale(1.015); }
  2.4% { transform: translate3d(3px, 0, 0) rotate(.6deg) scale(1.02); }
  3.6% { transform: translate3d(-2px, 0, 0) rotate(-.4deg) scale(1.015); }
  4.8% { transform: translate3d(2px, 0, 0) rotate(.4deg) scale(1.01); }
  6% { transform: translate3d(0, 0, 0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-income-art { animation: none; }
  .free-pick-attention { animation: none; }
}

@media (max-width: 767px) {
  .hero-income-art {
    animation: none;
    object-position: 18% center;
    opacity: .32;
  }
}
</style>
