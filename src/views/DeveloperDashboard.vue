<script setup>
import { PhSignOut, PhTerminalWindow } from '@phosphor-icons/vue'
import BrandMark from '../components/BrandMark.vue'
import WalletPanel from '../components/WalletPanel.vue'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
<template><main class="developer-shell"><aside><BrandMark /><div><PhTerminalWindow :size="28" /><p>Developer console</p><h1>Commission wallet</h1></div><div><strong>{{ auth.user?.full_name }}</strong><small>Developer access</small><button type="button" @click="auth.logout"><PhSignOut :size="17" /> Sign out</button></div></aside><section><WalletPanel endpoint="/v1/developer" title="Developer commission wallet" /></section></main></template>
<style scoped>
.developer-shell{min-height:100dvh;display:grid;grid-template-columns:18rem 1fr;background:#f3f3ef;color:#111;font-family:'Plus Jakarta Sans',sans-serif}.developer-shell aside{min-height:100dvh;display:flex;flex-direction:column;justify-content:space-between;padding:2rem;background:#0b0e0c;color:#fff}.developer-shell aside p{margin:1rem 0 .35rem;color:#c7ff45;font-size:.7rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.developer-shell aside h1{margin:0;font-size:2rem;letter-spacing:-.05em}.developer-shell aside>div:last-child{display:grid;gap:.35rem}.developer-shell aside small{color:#8b928e}.developer-shell aside button{min-height:2.8rem;display:flex;align-items:center;justify-content:center;gap:.5rem;margin-top:1rem;border:1px solid #333;background:transparent;color:#fff;cursor:pointer}.developer-shell>section{width:min(100%,1200px);margin:0 auto;padding:3rem}@media(max-width:800px){.developer-shell{grid-template-columns:1fr}.developer-shell aside{min-height:auto;gap:2rem}.developer-shell>section{padding:1rem}}
</style>
