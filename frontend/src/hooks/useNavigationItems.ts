import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_NAVIGATION_ITEMS, type AppNavItem } from '../constants';

export function useNavigationItems(): {
  navItems: AppNavItem[];
  allNavItems: AppNavItem[];
} {
  const { hasRole } = useAuth();

  const navItems = useMemo<AppNavItem[]>(() => {
    return APP_NAVIGATION_ITEMS.filter((item) => {
      if (item.roles && !hasRole(item.roles)) {
        return false;
      }
      return true;
    });
  }, [hasRole]);

  return {
    navItems,
    allNavItems: APP_NAVIGATION_ITEMS,
  };
}

export default useNavigationItems;
