import api from './api';
import { Home, Users, ClipboardList, User, HelpCircle, type LucideIcon } from 'lucide-react';
import { type BottomNavItem } from '../components/navigation';

export interface MenuDTO {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number | null;
  sortOrder: number;
  allowedRoles: string[];
  isActive: boolean;
}

export const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Users,
  ClipboardList,
  User,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || HelpCircle;
};

export const menuService = {
  async getMenus(): Promise<BottomNavItem[]> {
    const response = await api.get<{ menus: MenuDTO[]; total: number }>('/menus');
    return response.data.menus.map((item) => ({
      id: item.id,
      label: item.label,
      icon: getIconComponent(item.icon),
      path: item.path,
      badge: item.badge ?? undefined,
    }));
  },
};

export default menuService;
