import { createRouter, createWebHistory } from 'vue-router';

const routes = [
//   {
//     path: '/',
//     name: 'Home',
//     component: () => import('../components/ExcelEditor.vue')
//   },
  {
    path: '/person-extract',
    name: '人员提取',
    component: () => import('../views/PersonExtract.vue')
  }
];

const router = createRouter({
  // use Vite's base (imported at build time) so history works when site is served under a sub-path
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
