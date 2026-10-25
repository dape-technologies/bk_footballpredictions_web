<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const data = ref(null)
const password = ref('')
const otp = ref('')
const newPassword = ref('')
const notice = ref('')
const error = ref('')
const busy = ref(false)
async function load() { data.value = await api('/v1/auth/security/') }
async function submit(requestOtp = false) {
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const result = await api('/v1/auth/security/', { method: 'POST', body: JSON.stringify({ action: 'password', request_otp: requestOtp, password: password.value, otp: otp.value, new_password: newPassword.value }) })
    notice.value = result.message
    if (!requestOtp) { password.value = ''; otp.value = ''; newPassword.value = '' }
    await load()
  } catch (caught) { error.value = caught.message }
  finally { busy.value = false }
}
async function revoke(id) {
  try { await api('/v1/auth/security/', { method: 'POST', body: JSON.stringify({ action: 'revoke_session', session_id: id }) }); await load() }
  catch (caught) { error.value = caught.message }
}
onMounted(async () => { try { await load() } catch (caught) { error.value = caught.message } })
</script>
<template>
  <section class="security-panel">
    <header><p>Account protection</p><h2>Security and devices</h2></header>
    <button type="button" @click="auth.logout">Sign out of this device</button>
    <p v-if="error" role="alert" class="error">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p>
    <article v-if="data"><h3>Change password</h3><p>Password-change codes are sent to {{ data.notification_emails.join(' and ') }}. Payout numbers are server-managed and cannot be changed from either dashboard. Sessions expire after 20 minutes of inactivity or eight hours.</p>
      <form @submit.prevent="submit(false)">
        <label>New password<input v-model="newPassword" type="password" autocomplete="new-password" minlength="12" required></label>
        <label>Current password<input v-model="password" type="password" autocomplete="current-password"></label>
        <button type="button" :disabled="busy || !password" @click="submit(true)">Email verification code</button>
        <label>Verification code<input v-model="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label>
        <button type="submit" :disabled="busy || !otp">{{ busy ? 'Please wait…' : 'Verify and save' }}</button>
      </form>
    </article>
    <article v-if="data && auth.isDeveloper"><h3>Current owner OTPs</h3><p>Use this only if the owner's email delivery fails. Codes remain valid until the displayed expiry time and disappear after use.</p><button type="button" :disabled="busy" @click="load">Refresh current OTPs</button><div v-if="data.current_owner_otps?.length" class="otp-list"><div v-for="item in data.current_owner_otps" :key="item.id"><code>{{ item.code }}</code><span>{{ item.purpose.replaceAll('_', ' ') }} · created {{ new Date(item.created_at).toLocaleString('en-UG') }} · expires {{ new Date(item.expires_at).toLocaleString('en-UG') }}</span></div></div><p v-else>No active owner OTPs right now.</p></article>
    <article v-if="data"><h3>Sessions and device history</h3><div v-for="session in data.sessions" :key="session.id" class="session-row"><div><strong>{{ session.current ? 'This device' : session.active ? 'Active session' : 'Previous session' }}</strong><p>{{ session.device || 'Unknown device' }}</p><small>Last seen {{ new Date(session.last_seen_at).toLocaleString('en-UG') }} · {{ session.ip_address }}</small></div><button v-if="session.active && !session.current" type="button" @click="revoke(session.id)">Revoke</button></div></article>
  </section>
</template>
<style scoped>
.security-panel{display:grid;gap:1rem;color:#111}.security-panel header p{color:#687078;text-transform:uppercase;font-size:.7rem;letter-spacing:.1em}.security-panel h2{margin:.4rem 0;font-size:1.7rem}.security-panel h3{margin:0 0 .7rem}.security-panel article{padding:1.4rem;border:1px solid #dededb;border-radius:.8rem;background:#fff}.security-panel p{font-size:.8rem;line-height:1.6;color:#687078}.security-panel form{display:grid;gap:.9rem;max-width:35rem}.security-panel label{display:grid;gap:.4rem;font-size:.8rem;font-weight:700}.security-panel input,.security-panel select{width:100%;min-height:2.9rem;padding:.7rem;border:1px solid #d4d4ce;border-radius:.4rem;font:inherit;font-size:16px}.security-panel button{min-height:2.8rem;padding:.7rem 1rem;border:1px solid #111;border-radius:.4rem;background:#111;color:#fff;cursor:pointer}.security-panel button:disabled{opacity:.5;cursor:not-allowed}.security-panel button:focus-visible,.security-panel input:focus-visible{outline:3px solid #9abf43;outline-offset:2px}.session-row{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #dededb;overflow-wrap:anywhere}.session-row p{margin:.4rem 0}.session-row small{color:#687078}.error{padding:1rem;background:#fff2f0;color:#8b3029!important}@media(max-width:680px){.security-panel article{padding:1rem}.session-row{align-items:stretch;flex-direction:column}}
</style>
<style scoped>
.security-panel input,.security-panel select,.security-panel option{color:#111;background:#fff}.security-panel button:active{transform:translateY(1px)}
.otp-list{display:grid;gap:.65rem;margin-top:1rem}.otp-list>div{display:grid;gap:.3rem;padding:.85rem;background:#f3f6ec}.otp-list code{font-size:1.2rem;font-weight:800;letter-spacing:.12em}.otp-list span{color:#687078;font-size:.75rem}
</style>
