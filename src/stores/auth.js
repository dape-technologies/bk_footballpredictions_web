import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  const isAuthenticated = computed(() => Boolean(user.value))
  const isOwner = computed(() => Boolean(user.value?.is_owner))
  async function initialize(force = false) {
    if (ready.value && !force) return user.value
    try { user.value = await api('/v1/auth/me/') }
    catch (error) { if (error.status !== 401 && error.status !== 403) console.error(error); user.value = null }
    finally { ready.value = true }
    return user.value
  }
  async function login(credentials) { user.value = await api('/v1/auth/login/', { method: 'POST', body: JSON.stringify(credentials) }); ready.value = true; return user.value }
  async function register(details) { user.value = await api('/v1/auth/register/', { method: 'POST', body: JSON.stringify(details) }); ready.value = true; return user.value }
  async function logout() { try { await api('/v1/auth/logout/', { method: 'POST' }) } finally { user.value = null; ready.value = true; router.push('/') } }
  return { user, ready, isAuthenticated, isOwner, initialize, login, register, logout }
})
