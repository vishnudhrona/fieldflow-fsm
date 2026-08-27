import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../config/constants';

export interface DecodedUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Internal server error: Auth setup incomplete' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          message: 'Unauthorized: Invalid or expired token' 
        });
      }
      req.user = decoded as DecodedUser;
      next();
    });
  } else {
    return res.status(401).json({ 
      message: 'Unauthorized: No token provided' 
    });
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Unauthorized: User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }

    next();
  };
};
