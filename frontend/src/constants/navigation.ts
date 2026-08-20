import { Home, Users, ClipboardList, User, type LucideIcon } from 'lucide-react';
import { UserRole } from '../services/authService';
import type { BottomNavItem } from '../components/navigation';

export interface AppNavItem extends BottomNavItem {
  icon: LucideIcon;
  roles?: UserRole[];
  offlineAvailable?: boolean;
}

export const APP_NAVIGATION_ITEMS: AppNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    offlineAvailable: true,
    roles: [UserRole.ADMIN_DISPATCHER, UserRole.TECHNICIAN],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/customers',
    offlineAvailable: false,
    roles: [UserRole.ADMIN_DISPATCHER],
  },
  {
    id: 'work-orders',
    label: 'Work Orders',
    icon: ClipboardList,
    path: '/work-orders',
    offlineAvailable: true,
    roles: [UserRole.ADMIN_DISPATCHER, UserRole.TECHNICIAN],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    offlineAvailable: true,
    roles: [UserRole.ADMIN_DISPATCHER, UserRole.TECHNICIAN],
  },
];
