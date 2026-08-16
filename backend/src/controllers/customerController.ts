import { Request, Response } from 'express';
import {
  findCustomerByEmail,
  createNewCustomer,
  findAllCustomers,
  findCustomerById,
  updateCustomerById,
} from '../helpers/customerQueries';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeOptionalString,
  sanitizeBoolean,
} from '../utils';

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = sanitizeString(req.body.name);
    const phone = sanitizeString(req.body.phone);
    const email = sanitizeEmail(req.body.email);
    const address = sanitizeString(req.body.address);
    const contactPerson = sanitizeOptionalString(req.body.contactPerson);
    const notes = sanitizeOptionalString(req.body.notes);
    const status = sanitizeBoolean(req.body.status, true);

    if (!name || !phone || !email || !address) {
      res.status(400).json({
        message: 'Validation error: Name, phone, email, and address are required.',
      });
      return;
    }

    const existingCustomer = await findCustomerByEmail(email);

    if (existingCustomer) {
      res.status(409).json({
        message: 'A customer with this email address already exists.',
      });
      return;
    }

    const newCustomer = await createNewCustomer({
      name,
      contactPerson,
      phone,
      email,
      address,
      notes,
      status,
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer,
    });
  } catch (error: any) {
    if (error?.name === 'SequelizeValidationError' || error?.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({
        message: error.errors?.[0]?.message || 'Validation error',
      });
      return;
    }
    res.status(500).json({
      message: 'Internal server error while creating customer',
      error: error?.message,
    });
  }
};

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const customers = await findAllCustomers(search);

    res.status(200).json({
      customers,
      total: customers.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while fetching customers',
      error: error?.message,
    });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customer = await findCustomerById(id);

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.status(200).json({ customer });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while fetching customer',
      error: error?.message,
    });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, contactPerson, phone, email, address, notes, status } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = sanitizeString(name);
    if (contactPerson !== undefined) updates.contactPerson = sanitizeOptionalString(contactPerson);
    if (phone !== undefined) updates.phone = sanitizeString(phone);
    if (email !== undefined) updates.email = sanitizeEmail(email);
    if (address !== undefined) updates.address = sanitizeString(address);
    if (notes !== undefined) updates.notes = sanitizeOptionalString(notes);
    if (status !== undefined) updates.status = Boolean(status);

    const updated = await updateCustomerById(id, updates);
    if (!updated) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.status(200).json({
      message: 'Customer updated successfully',
      customer: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while updating customer',
      error: error?.message,
    });
  }
};
