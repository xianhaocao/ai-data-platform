import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueGridLayout from 'vue-grid-layout'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueGridLayout)
app.use(router)
app.mount('#app')