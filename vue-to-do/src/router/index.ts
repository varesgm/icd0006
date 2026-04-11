import LoginView from '@/views/LoginView.vue';
import MainView from '@/views/MainView.vue';
import AboutView from '@/views/AboutView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useApiKeyStore } from '@/stores/apikey-store';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Main',
    component: MainView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView
  }, 
    {
    // Catchall — matches any unmatched path
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

router.beforeEach((to, from) => {
  const apiKeyStore = useApiKeyStore();

  // List of routes that require authentication
  const nonProtectedRoutes = ["Login"];

  if (!nonProtectedRoutes.includes(to.name as string) && !apiKeyStore.isLoggedIn()) {
    return { name: "Login" };
  }
});

export default router
