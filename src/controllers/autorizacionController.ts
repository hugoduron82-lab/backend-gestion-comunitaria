import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AutorizacionReeleccion from '../models/AutorizacionReeleccion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import Organizacion from '../models/Organizacion';

// Crear una autorización (solo rol 2: Jefe Desarrollo)
export const crearAutorizacion = async (req: AuthRequest, res: Response) => {
  try {
    const { dni, nombre_persona, id_organizacion, periodo_solicitado, justificacion } = req.body;
    const org = await Organizacion.findByPk(id_organizacion);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

    const autorizacion = await AutorizacionReeleccion.create({
      dni,
      nombre_persona,
      id_organizacion,
      nombre_organizacion: org.nombre,
      categoria_org: (org.id_tipo === 1 || org.id_tipo === 2) ? 'patronato' : 'junta_agua',
      periodo_solicitado,
      justificacion,
      autorizado_por: req.usuario!.id,
      activa: true,
    });

    await registrarBitacora(
      req.usuario!.id,
      'autorizaciones_reeleccion',
      'AUTORIZACION_REELECCION',
      autorizacion.id,
      `Autorizado período ${periodo_solicitado} para ${nombre_persona} (DNI: ${dni})`,
      obtenerIp(req)
    );

    res.status(201).json(autorizacion);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al crear autorización', error: err.message });
  }
};

// Listar autorizaciones activas (opcional)
export const listarAutorizaciones = async (req: AuthRequest, res: Response) => {
  try {
    const autorizaciones = await AutorizacionReeleccion.findAll({ where: { activa: true } });
    res.json(autorizaciones);
  } catch (err) {
    res.status(500).json({ msg: 'Error al listar autorizaciones' });
  }
};