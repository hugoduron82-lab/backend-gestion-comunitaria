import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Bitacora from '../models/Bitacora';
import Usuario from '../models/Usuario';
import { Op } from 'sequelize';

export const listarBitacora = async (req: AuthRequest, res: Response) => {
  try {
    const { usuario, tabla, accion, desde, hasta, limite = 100, pagina = 1 } = req.query;
    const where: any = {};
    if (usuario) where.id_usuario = usuario;
    if (tabla) where.tabla_afectada = tabla;
    if (accion) where.accion = accion;
    if (desde || hasta) {
      where.creado_en = {};
      if (desde) where.creado_en[Op.gte] = new Date(desde as string);
      if (hasta) where.creado_en[Op.lte] = new Date(hasta as string);
    }

    const limit = parseInt(limite as string);
    const offset = (parseInt(pagina as string) - 1) * limit;

    const { count, rows } = await Bitacora.findAndCountAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'correo', 'id_empleado'] }],
      order: [['creado_en', 'DESC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      pagina: parseInt(pagina as string),
      totalPaginas: Math.ceil(count / limit),
      registros: rows,
    });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al obtener la bitácora', error: err.message });
  }
};