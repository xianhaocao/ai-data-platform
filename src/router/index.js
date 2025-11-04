import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import DataManagement from '../components/DataManagement.vue'
import ComponentLibrary from '../components/ComponentLibrary.vue'
import SystemSettings from '../components/SystemSettings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/data-management', name: 'DataManagement', component: DataManagement },
  { path: '/component-library', name: 'ComponentLibrary', component: ComponentLibrary },
  { path: '/system-settings', name: 'SystemSettings', component: SystemSettings },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router