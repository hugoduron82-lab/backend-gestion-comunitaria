import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AutorizacionReeleccion from '../models/AutorizacionReeleccion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import Organizacion from '../models/Organizacion';
import Usuario from '../models/Usuario';

// Crear una autorización especial de reelección (roles 1 y 2)
export const crearAutorizacion = async (req: AuthRequest, res: Response) => {
  try {
    const { dni, nombre_persona, id_organizacion, periodo_solicitado, justificacion } = req.body;

    const org = await Organizacion.findByPk(id_organizacion);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

    // Verificar que no exista ya una autorización activa para este DNI
    // en esta organización (evitar duplicados)
    const existente = await AutorizacionReeleccion.findOne({
      where: { dni, id_organizacion, activa: true }
    });
    if (existente) {
      return res.status(400).json({
        msg: `Ya existe una autorización activa para ${nombre_persona} en esta organización`
      });
    }

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
      `Autorizado período ${periodo_solicitado} para ${nombre_persona} (DNI: ${dni}) en ${org.nombre}`,
      obtenerIp(req)
    );

    res.status(201).json(autorizacion);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al crear autorización', error: err.message });
  }
};

// Listar TODAS las autorizaciones (activas e históricas)
// con datos del usuario que autorizó
export const listarAutorizaciones = async (req: AuthRequest, res: Response) => {
  try {
    const autorizaciones = await AutorizacionReeleccion.findAll({
      include: [
        {
          model: Usuario,
          as: 'autorizador',
          attributes: ['correo']
        }
      ],
      order: [['fecha_autorizacion', 'DESC']]
    });
    res.json(autorizaciones);
  } catch (err) {
    res.status(500).json({ msg: 'Error al listar autorizaciones' });
  }
};