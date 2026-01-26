import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../pages/LoginPage.vue')
        },
        {
            path: '/apply',
            name: 'Apply',
            component: () => import('../pages/ApplyPage.vue')
        },
        {
            path: '/pending',
            name: 'Pending',
            component: () => import('../pages/PendingPage.vue')
        },
        {
            path: '/admin',
            redirect: '/admin/dashboard',
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/dashboard',
            name: 'AdminDashboard',
            component: () => import('../pages/admin/DashboardPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/members/list',
            name: 'MembersList',
            component: () => import('../pages/admin/MembersListPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/members/applications',
            name: 'MembersApplications',
            component: () => import('../pages/admin/ApplicationsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/ledger',
            name: 'FinanceLedger',
            component: () => import('../pages/admin/FinanceLedgerPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/kas',
            name: 'FinanceKas',
            component: () => import('../pages/admin/KasPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/attendance-events',
            name: 'AttendanceEvents',
            component: () => import('../pages/admin/AttendanceEventsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/user',
            redirect: '/user/home',
            meta: { requiresAuth: true }
        },
        {
            path: '/user/home',
            name: 'UserHome',
            component: () => import('../pages/user/HomePage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/user/kas',
            name: 'UserKas',
            component: () => import('../pages/user/KasPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/user/attendance',
            name: 'UserAttendance',
            component: () => import('../pages/user/AttendancePage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/user/attendance-checkin',
            name: 'UserAttendanceCheckin',
            component: () => import('../pages/user/AttendanceCheckinPage.vue'),
            meta: { requiresAuth: true }
        }
    ]
});

// Navigation guards
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/user/home');
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next(authStore.isAdmin ? '/admin/dashboard' : '/user/home');
    } else {
        next();
    }
});

export default router;
