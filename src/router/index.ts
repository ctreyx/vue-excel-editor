import { createRouter, createWebHashHistory } from 'vue-router';
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
  // Switch to Hash mode for GitHub Pages compatibility
  history: createWebHashHistory(),
  routes
});

export default router;
