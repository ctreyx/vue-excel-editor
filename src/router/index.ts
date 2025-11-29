import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/ExcelEditor.vue')
  },
  {
    path: '/person-extract',
    name: '人员提取',
    component: () => import('../views/PersonExtract.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
