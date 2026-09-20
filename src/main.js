import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/outfit'
import App from './App.vue'
import router from './router'
import './style.css'
import './tailwind.css'

createApp(App).use(createPinia()).use(router).mount('#app')
