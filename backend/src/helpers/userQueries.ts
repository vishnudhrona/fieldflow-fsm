import { User } from '../models';

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ where: { email }, raw: true });
};
