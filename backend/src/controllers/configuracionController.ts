import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Configuracion from '../models/Configuracion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';

// Helper para convertir parámetros de ruta a número
const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

// ========== OBTENER TODAS LAS CONFIGURACIONES ==========
export const listarConfiguraciones = async (req: AuthRequest, res: Response) => {
  try {
    const configs = await Configuracion.findAll({
      order: [['clave', 'ASC']]
    });
    res.json(configs);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al listar configuraciones', error: err.message });
  }
};

// ========== OBTENER UNA CONFIGURACIÓN POR ID ==========
export const obtenerConfiguracion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const config = await Configuracion.findByPk(id);
    if (!config) {
      return res.status(404).json({ msg: 'Configuración no encontrada' });
    }
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al obtener configuración', error: err.message });
  }
};

// ========== OBTENER UNA CONFIGURACIÓN POR CLAVE ==========
export const obtenerConfiguracionPorClave = async (req: AuthRequest, res: Response) => {
  try {
    const { clave } = req.params;
    const config = await Configuracion.findOne({ where: { clave } });
    if (!config) {
      return res.status(404).json({ msg: 'Configuración no encontrada' });
    }
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al obtener configuración', error: err.message });
  }
};

// ========== CREAR NUEVA CONFIGURACIÓN ==========
export const crearConfiguracion = async (req: AuthRequest, res: Response) => {
  try {
    const { clave, valor, descripcion } = req.body;

    if (!clave || !valor) {
      return res.status(400).json({ msg: 'Clave y valor son obligatorios' });
    }

    // Verificar si la clave ya existe
    const existe = await Configuracion.findOne({ where: { clave } });
    if (existe) {
      return res.status(400).json({ msg: `La clave '${clave}' ya existe` });
    }

    const config = await Configuracion.create({
      clave,
      valor,
      descripcion: descripcion || null
    });

    await registrarBitacora(
      req.usuario!.id,
      'configuracion',
      'CREAR',
      config.id,
      `Configuración creada: ${clave} = ${valor}`,
      obtenerIp(req)
    );

    res.status(201).json(config);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al crear configuración', error: err.message });
  }
};

// ========== ACTUALIZAR CONFIGURACIÓN ==========
export const actualizarConfiguracion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const { valor, descripcion } = req.body;

    const config = await Configuracion.findByPk(id);
    if (!config) {
      return res.status(404).json({ msg: 'Configuración no encontrada' });
    }

    const updates: any = {};
    if (valor !== undefined) updates.valor = valor;
    if (descripcion !== undefined) updates.descripcion = descripcion;

    await config.update(updates);

    await registrarBitacora(
      req.usuario!.id,
      'configuracion',
      'EDITAR',
      config.id,
      `Configuración actualizada: ${config.clave} = ${config.valor}`,
      obtenerIp(req)
    );

    res.json(config);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al actualizar configuración', error: err.message });
  }
};

// ========== ELIMINAR CONFIGURACIÓN ==========
export const eliminarConfiguracion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const config = await Configuracion.findByPk(id);
    if (!config) {
      return res.status(404).json({ msg: 'Configuración no encontrada' });
    }

    const clave = config.clave;
    await config.destroy();

    await registrarBitacora(
      req.usuario!.id,
      'configuracion',
      'ELIMINAR',
      id,
      `Configuración eliminada: ${clave}`,
      obtenerIp(req)
    );

    res.json({ msg: 'Configuración eliminada correctamente' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al eliminar configuración', error: err.message });
  }
};