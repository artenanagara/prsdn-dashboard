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
            component: () => import('../pages/admin/member/MembersListPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/members/applications',
            name: 'MembersApplications',
            component: () => import('../pages/admin/member/ApplicationsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/ledger',
            name: 'FinanceLedger',
            component: () => import('../pages/admin/finance/FinanceLedgerPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/kas',
            name: 'FinanceKas',
            component: () => import('../pages/admin/finance/KasPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/payments',
            name: 'FinancePayments',
            component: () => import('../pages/admin/finance/PaymentItemsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/payment/:id',
            name: 'PaymentDetail',
            component: () => import('../pages/admin/finance/PaymentDetailPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/finance/create-from-poll/:id',
            name: 'CreatePaymentFromPoll',
            component: () => import('../pages/admin/finance/CreatePaymentFromPollPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/attendance-events',
            name: 'AttendanceEvents',
            component: () => import('../pages/admin/AttendanceEventsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        // Polls Management Routes
        {
            path: '/admin/polls/list',
            name: 'AdminPollsList',
            component: () => import('../pages/admin/polls/PollsListPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/polls/create',
            name: 'AdminPollCreate',
            component: () => import('../pages/admin/polls/PollCreatePage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/polls/:id',
            name: 'AdminPollDetail',
            component: () => import('../pages/admin/polls/PollDetailPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/admin/polls/edit/:id',
            name: 'AdminPollEdit',
            component: () => import('../pages/admin/polls/PollCreatePage.vue'),
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
        },
        {
            path: '/user/settings',
            name: 'UserSettings',
            component: () => import('../pages/user/SettingsPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/user/polls',
            name: 'UserPolls',
            component: () => import('../pages/user/polls/UserPollsPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/user/polls/:id',
            name: 'UserPollDetail',
            component: () => import('../pages/user/polls/UserPollDetailPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/admin/settings',
            name: 'AdminSettings',
            component: () => import('../pages/user/SettingsPage.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/error',
            name: 'Error',
            component: () => import('../pages/ErrorPage.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('../pages/NotFoundPage.vue')
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
