<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhArrowRight, PhCheckCircle, PhClock, PhShieldCheck, PhTrendUp } from '@phosphor-icons/vue'
import { api } from '../api/client'
import PredictionCard from '../components/PredictionCard.vue'

const predictions = ref([]), packages = ref([]), wins = ref([]), testimonials = ref([])
const loading = ref(true), error = ref('')
const leadPrediction = computed(() => predictions.value[0])
const money = (value) => new Intl.NumberFormat('en-UG').format(value)

onMounted(async () => {
  try {
    const [picks, plans, recent, voices] = await Promise.all([
      api('/v1/predictions/'), api('/v1/packages/'), api('/v1/recent-wins/'), api('/v1/testimonials/'),
    ])
    predictions.value = picks; packages.value = plans; wins.value = recent; testimonials.value = voices
  } catch (err) { error.value = err.message } finally { loading.value = false }
})
</script>

<template>
  <div class="public-page home-page">
    <section class="hero-section section-wrap">
      <div class="hero-copy reveal">
        <p class="kicker"><span></span> Independent match intelligence</p>
        <h1>Read the match.<br><em>Own the decision.</em></h1>
        <p class="hero-lede">BK turns a crowded football calendar into a disciplined shortlist—clear markets, measured confidence and no noise.</p>
        <div class="hero-actions"><RouterLink to="/predictions" class="button primary">View today’s board <PhArrowRight :size="18" /></RouterLink><RouterLink to="/about" class="text-link">How BK works</RouterLink></div>
        <div class="trust-row"><span><PhShieldCheck :size="18" /> Owner reviewed</span><span><PhClock :size="18" /> Kampala time</span><span><PhTrendUp :size="18" /> Results tracked</span></div>
      </div>
      <div class="hero-board reveal delay-1">
        <div class="board-top"><span>Match desk / today</span><i>Live board</i></div>
        <div v-if="leadPrediction" class="board-fixture">
          <p>{{ leadPrediction.competition }}</p><h2>{{ leadPrediction.home_team }}</h2><span>against</span><h2>{{ leadPrediction.away_team }}</h2>
          <div class="board-line"><span>{{ new Date(leadPrediction.kickoff_at).toLocaleString('en-UG', { weekday:'short', hour:'2-digit', minute:'2-digit' }) }}</span><b>{{ leadPrediction.locked ? 'Member analysis' : leadPrediction.selection }}</b></div>
        </div>
        <div v-else class="board-empty">The next match board is being prepared.</div>
        <div class="board-footer"><span>BK / 01</span><span>Analysis before impulse</span></div>
      </div>
    </section>

    <section class="signal-strip"><div><strong>One board.</strong><span>Every selection earns its place.</span></div><div><strong>Clear access.</strong><span>Free insight and member analysis stay distinct.</span></div><div><strong>Visible record.</strong><span>Wins and losses remain part of the story.</span></div></section>

    <section class="section-wrap content-section">
      <div class="section-heading"><div><p class="kicker">Today’s intelligence</p><h2>A shorter route through the fixture list.</h2></div><RouterLink to="/predictions" class="text-link">Open the full board <PhArrowRight :size="16" /></RouterLink></div>
      <div v-if="loading" class="prediction-grid skeleton-grid"><div v-for="n in 3" :key="n" class="skeleton"></div></div>
      <div v-else-if="error" class="state-panel state-error"><strong>Match desk unavailable</strong><p>{{ error }}</p></div>
      <div v-else class="prediction-grid"><PredictionCard v-for="(pick, index) in predictions.slice(0,3)" :key="pick.id" :prediction="pick" :featured="index === 0" /></div>
    </section>

    <section class="manifesto-section"><div class="section-wrap manifesto-grid"><p class="index-label">BK / METHOD</p><h2>Confidence is a process,<br>not a promise.</h2><div><p>We publish the market, timing and reasoning behind each position. Members see what matters and what remains uncertain.</p><RouterLink to="/about" class="button secondary">Read our approach</RouterLink></div></div></section>

    <section class="section-wrap content-section">
      <div class="section-heading"><div><p class="kicker">Access plans</p><h2>Choose your working rhythm.</h2></div><p>Request access now. The owner reviews every membership manually during the MVP.</p></div>
      <div class="package-grid compact-packages">
        <article v-for="plan in packages" :key="plan.id" class="package-card" :class="{ featured: plan.is_featured }">
          <span class="plan-index">0{{ plan.display_order + 1 }}</span><div><p>{{ plan.duration_days }} day<span v-if="plan.duration_days !== 1">s</span></p><h3>{{ plan.name }}</h3><p>{{ plan.description }}</p></div><strong><small>{{ plan.currency }}</small>{{ money(plan.price) }}</strong><RouterLink to="/packages" aria-label="View package"><PhArrowRight :size="20" /></RouterLink>
        </article>
      </div>
    </section>

    <section v-if="wins.length" class="results-band"><div class="section-wrap"><p class="kicker">Recent record</p><div class="result-feature"><span>{{ new Date(wins[0].settled_at).toLocaleDateString('en-UG', { day:'2-digit', month:'short' }) }}</span><div><h2>{{ wins[0].title }}</h2><p>{{ wins[0].summary }}</p></div><strong>{{ wins[0].odds || '—' }}<small>combined odds</small></strong></div></div></section>

    <section v-if="testimonials.length" class="section-wrap quote-section"><p class="quote-mark">“</p><blockquote>{{ testimonials[0].quote }}</blockquote><p>{{ testimonials[0].member_name }} <span>{{ testimonials[0].member_since }}</span></p></section>
  </div>
</template>
