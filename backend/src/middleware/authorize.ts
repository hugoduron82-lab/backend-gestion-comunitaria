import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorize = (allowedRoles: number[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ msg: 'No autenticado' });
    }
    if (!allowedRoles.includes(req.usuario.id_rol)) {
      return res.status(403).json({ msg: 'No tiene permisos suficientes' });
    }
    next();
  };
};