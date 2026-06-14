import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';


export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario || !usuario.activo) return res.status(400).json({ msg: 'Credenciales incorrectas' });

    const valid = await usuario.validarPassword(password);
    if (!valid) return res.status(400).json({ msg: 'Credenciales incorrectas' });

    const payload = { id: usuario.id, correo: usuario.correo, id_rol: usuario.id_rol };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, usuario: { id: usuario.id, correo, id_rol: usuario.id_rol } });
  } catch (err) {
    res.status(500).json({ msg: 'Error en login' });
  }
};

export const perfil = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario!.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener perfil' });
  }
};