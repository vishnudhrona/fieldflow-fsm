import { Op } from 'sequelize';
import { Customer, Asset, WorkOrder } from '../models';
import type { CustomerAttributes } from '../models/customer';

export const findCustomerByEmail = async (email: string) => {
  return await Customer.findOne({
    where: { email },
  });
};

export const createNewCustomer = async (data: CustomerAttributes) => {
  return await Customer.create(data);
};

export const findAllCustomers = async (search?: string) => {
  const whereClause: any = {};

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    whereClause[Op.or] = [
      { name: { [Op.iLike]: term } },
      { contactPerson: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { address: { [Op.iLike]: term } },
    ];
  }

  return await Customer.findAll({
    where: whereClause,
    include: [
      {
        model: Asset,
        as: 'assets',
        attributes: ['id'],
      },
      {
        model: WorkOrder,
        as: 'workOrders',
        attributes: ['id', 'status'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const findCustomerById = async (id: string) => {
  return await Customer.findByPk(id, {
    include: [
      {
        model: Asset,
        as: 'assets',
      },
      {
        model: WorkOrder,
        as: 'workOrders',
      },
    ],
    order: [[{ model: Asset, as: 'assets' }, 'created_at', 'DESC']],
  });
};

export const updateCustomerById = async (id: string, updates: Partial<CustomerAttributes>) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;
  return await customer.update(updates);
};
