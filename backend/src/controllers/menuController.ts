import { Response } from 'express';
import { type AuthenticatedRequest } from '../middlewares/authMiddleware';
import { findAllActiveMenus } from '../helpers/menuQueries';

export const getMenus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const allMenus = await findAllActiveMenus();

    const menus = userRole
      ? allMenus.filter((menu) => {
          const roles = Array.isArray(menu.allowedRoles)
            ? menu.allowedRoles
            : [];
          return roles.includes(userRole);
        })
      : allMenus;

    res.status(200).json({
      menus,
      total: menus.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while fetching menus',
      error: error?.message,
    });
  }
};
