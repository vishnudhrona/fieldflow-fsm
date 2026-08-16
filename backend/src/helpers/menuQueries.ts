import { Menu, type MenuAttributes } from '../models/menu';

export const findAllActiveMenus = async (): Promise<MenuAttributes[]> => {
  return (await Menu.findAll({
    where: { isActive: true },
    order: [['sort_order', 'ASC']],
    raw: true,
  })) as any;
};
