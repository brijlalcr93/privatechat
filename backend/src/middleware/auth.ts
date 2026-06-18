import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Admin } from '../models/Admin';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforprivatechat123!';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'adminsecretjwtkeyforprivatechat987!';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    status: string;
  };
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

export const userAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Invalid token.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact admin.' });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      status: user.status,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const adminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // First try admin JWT secret
    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as { id: string; role: string };
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.admin = {
          id: admin._id.toString(),
          username: admin.username,
          role: admin.role,
        };
        return next();
      }
    } catch (e) {
      // If admin JWT verify fails, check if it's a User with admin role using standard secret
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      const user = await User.findById(decoded.id);
      if (user && user.role === 'admin' && user.status === 'active') {
        req.admin = {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        };
        return next();
      }
    }

    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired administrator token.' });
  }
};
