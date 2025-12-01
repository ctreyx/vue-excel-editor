import { createRouter, createWebHistory } from 'vue-router';
import DashboardLayout from '../layouts/DashboardLayout.vue';

const routes = [
  {
    path: '/',
    component: DashboardLayout,
    redirect: '/person-extract',
    children: [
      {
        path: 'person-extract',
        name: 'PersonExtract',
        component: () => import('../views/PersonExtract.vue')
      }
    ]
  }
];

const router = createRouter({
  // use Vite's base (imported at build time) so history works when site is served under a sub-path
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
