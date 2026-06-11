import { Request, Response } from 'express';
import Zona from '../models/Zona';
import TipoOrganizacion from '../models/TipoOrganizacion';

export const getZonas = async (req: Request, res: Response) => {
  try {
    const zonas = await Zona.findAll({ where: { activo: true } });
    res.json(zonas);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener zonas' });
  }
};

export const getTiposOrganizacion = async (req: Request, res: Response) => {
  try {
    const tipos = await TipoOrganizacion.findAll({ where: { activo: true } });
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener tipos' });
  }
};