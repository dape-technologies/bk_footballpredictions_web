<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { PhArrowRight, PhList, PhSignOut, PhX } from '@phosphor-icons/vue'
import BrandMark from './components/BrandMark.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const auth = useAuthStore()
const menuOpen = ref(false)
const isOwnerArea = computed(() => route.path.startsWith('/owner'))

onMounted(() => auth.initialize())
</script>

<template>
  <div class="app-frame">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header v-if="!isOwnerArea" class="site-header">
      <RouterLink to="/" class="brand-link" aria-label="BK Football Predictions home"><BrandMark /></RouterLink>
      <button class="menu-toggle" type="button" aria-label="Toggle navigation" @click="menuOpen = !menuOpen">
        <PhX v-if="menuOpen" :size="22" /><PhList v-else :size="22" />
      </button>
      <nav :class="['site-nav', { open: menuOpen }]" aria-label="Primary navigation" @click="menuOpen = false">
        <RouterLink to="/predictions">Predictions</RouterLink>
        <RouterLink to="/packages">Access plans</RouterLink>
        <RouterLink to="/results">Results</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/account">My desk</RouterLink>
        <RouterLink v-else to="/login">Sign in</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" to="/register" class="nav-cta">Join BK <PhArrowRight :size="16" weight="bold" /></RouterLink>
        <button v-else class="nav-signout" type="button" @click="auth.logout"><PhSignOut :size="16" /> Sign out</button>
      </nav>
    </header>
    <main id="main-content"><RouterView /></main>
    <footer v-if="!isOwnerArea" class="site-footer">
      <div><BrandMark compact /><p>Measured football intelligence for disciplined decisions.</p></div>
      <div class="footer-links">
        <RouterLink to="/predictions">Predictions</RouterLink><RouterLink to="/packages">Plans</RouterLink><RouterLink to="/about">About</RouterLink><span>For adults 18+. Play responsibly.</span>
      </div>
      <p class="footer-note">Predictions are opinions, not guarantees. © {{ new Date().getFullYear() }} BK Football Predictions.</p>
    </footer>
  </div>
</template>
