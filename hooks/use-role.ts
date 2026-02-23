import { useAuthStore } from '@/store';

export function useRole() {
    const role = useAuthStore((s) => s.role);

    return {
        role,
        isAdmin: role === 'admin',
        isManager: role === 'manager',
        isStaff: role === 'staff',
        canManageProducts: role === 'admin' || role === 'manager',
        canManageSettings: role === 'admin',
        canVoidOrders: role === 'admin' || role === 'manager',
        canViewDashboard: role === 'admin' || role === 'manager',
    };
}
