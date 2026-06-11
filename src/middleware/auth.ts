import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    correo: string;
    id_rol: number;
  };
}

export default function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'Acceso denegado' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido' });
  }
}