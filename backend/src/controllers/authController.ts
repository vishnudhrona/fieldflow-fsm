import { Request, Response } from 'express';
import { findUserByEmail, findTechnicians } from '../helpers/userQueries';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ status: false, message: 'Internal server error: auth secret missing' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      status: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const getTechnicians = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const technicians = await findTechnicians();
    return res.status(200).json({ technicians, total: technicians.length});
  } catch (error: any) {
    return res.status(500).json({status: false, message: 'Internal server error while fetching technicians', error: error?.message,});
  }
};
