import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Usuario from '../models/Usuario';
import Rol from '../models/Rol';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import bcrypt from 'bcrypt';

// Helper para convertir parámetros de ruta (string | string[]) a número
const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

// Listar usuarios (con filtros opcionales)
export const listarUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const { rol, activo, limite = 100, pagina = 1 } = req.query;
    const where: any = {};
    if (rol) where.id_rol = parseInt(rol as string);
    if (activo !== undefined) where.activo = activo === 'true';

    const limit = parseInt(limite as string);
    const offset = (parseInt(pagina as string) - 1) * limit;

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    res.json({
      total: count,
      pagina: parseInt(pagina as string),
      totalPaginas: Math.ceil(count / limit),
      usuarios: rows,
    });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al listar usuarios', error: err.message });
  }
};

// Obtener un usuario por ID
export const obtenerUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }],
    });
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al obtener usuario', error: err.message });
  }
};

// Crear usuario (solo admin o jefe desarrollo)
export const crearUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id_empleado, correo, password, id_rol, activo } = req.body;
    const existe = await Usuario.findOne({ where: { correo } });
    if (existe) return res.status(400).json({ msg: 'El correo ya está registrado' });

    const usuario = await Usuario.create({
      id_empleado,
      correo,
      password_hash: password,
      id_rol,
      activo: activo !== undefined ? activo : true,
    });

    await registrarBitacora(
      req.usuario!.id,
      'usuarios',
      'CREAR',
      usuario.id,
      `Usuario creado: ${correo} (rol ${id_rol})`,
      obtenerIp(req)
    );

    res.status(201).json({ id: usuario.id, correo, id_rol, activo: usuario.activo });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al crear usuario', error: err.message });
  }
};

// Actualizar usuario
export const actualizarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const { correo, id_rol, activo, password } = req.body;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const updates: any = {};
    if (correo) updates.correo = correo;
    if (id_rol) updates.id_rol = id_rol;
    if (activo !== undefined) updates.activo = activo;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    await usuario.update(updates);

    await registrarBitacora(
      req.usuario!.id,
      'usuarios',
      'EDITAR',
      usuario.id,
      `Usuario actualizado: ${usuario.correo}`,
      obtenerIp(req)
    );

    res.json({ msg: 'Usuario actualizado', usuario: { id: usuario.id, correo: usuario.correo, id_rol: usuario.id_rol, activo: usuario.activo } });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al actualizar usuario', error: err.message });
  }
};

// Desactivar usuario
export const desactivarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    if (usuario.id === req.usuario!.id) {
      return res.status(400).json({ msg: 'No puedes desactivarte a ti mismo' });
    }
    await usuario.update({ activo: false });

    await registrarBitacora(
      req.usuario!.id,
      'usuarios',
      'DESACTIVAR',
      usuario.id,
      `Usuario desactivado: ${usuario.correo}`,
      obtenerIp(req)
    );

    res.json({ msg: 'Usuario desactivado' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al desactivar usuario', error: err.message });
  }
};

// Reactivar usuario
export const reactivarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    await usuario.update({ activo: true });

    await registrarBitacora(
      req.usuario!.id,
      'usuarios',
      'REACTIVAR',
      usuario.id,
      `Usuario reactivado: ${usuario.correo}`,
      obtenerIp(req)
    );

    res.json({ msg: 'Usuario reactivado' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al reactivar usuario', error: err.message });
  }
};