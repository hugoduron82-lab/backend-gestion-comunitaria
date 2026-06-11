import Bitacora from '../models/Bitacora';
import { Request } from 'express';

export const registrarBitacora = async (
  id_usuario: number,
  tabla_afectada: string,
  accion: string,
  id_registro?: number | null,
  detalle?: string,
  ip_origen?: string
) => {
  try {
    await Bitacora.create({
      id_usuario,
      tabla_afectada,
      id_registro: id_registro || null,
      accion: accion as any,
      detalle,
      ip_origen,
    });
  } catch (err) {
    console.error('Error registrando bitácora:', err);
  }
};

export const obtenerIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
};