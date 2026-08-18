import { User } from '../models';
import { ROLES } from '../config/constants';

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ where: { email }, raw: true });
};

export const findTechnicians = async () => {
  return await User.findAll({
    where: { role: ROLES.TECHNICIAN },
    attributes: ['id', 'name', 'email', 'phone', 'role'],
    order: [['name', 'ASC']],
  });
};
