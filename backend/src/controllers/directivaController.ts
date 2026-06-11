import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DirectivaMiembro from '../models/DirectivaMiembro';
import CargoDirectiva from '../models/CargoDirectiva';
import Organizacion from '../models/Organizacion';
import HistorialPresidente from '../models/HistorialPresidente';
import Configuracion from '../models/Configuracion';
import AutorizacionReeleccion from '../models/AutorizacionReeleccion'; // ← Importante
import { registrarBitacora, obtenerIp } from '../services/loggerService';

// Helper para convertir parámetros de ruta (string | string[]) a número
const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

// Asignar un nuevo miembro a la directiva
export const asignarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, id_cargo, nombre_completo, dni, telefono_personal, fecha_inicio } = req.body;

    const cargo = await CargoDirectiva.findByPk(id_cargo);
    if (!cargo) return res.status(400).json({ msg: 'Cargo no válido' });

    const existe = await DirectivaMiembro.findOne({ where: { id_organizacion, id_cargo, activo: true } });
    if (existe) return res.status(400).json({ msg: 'Ya hay un miembro activo en este cargo' });

    let id_autorizacion = null;

    // Validación de presidente (límite de períodos + autorización especial)
    if (cargo.es_presidente) {
      const configMax = await Configuracion.findOne({ where: { clave: 'max_periodos_presidente' } });
      const maxPeriodos = configMax ? parseInt(configMax.valor) : 2;
      const periodosPrevios = await HistorialPresidente.count({ where: { dni, id_organizacion } });

      if (periodosPrevios >= maxPeriodos) {
        // Buscar autorización activa del Jefe de Desarrollo
        const autorizacion = await AutorizacionReeleccion.findOne({
          where: { dni, id_organizacion, activa: true }
        });
        if (!autorizacion) {
          return res.status(400).json({
            msg: `La persona ya ha sido presidenta ${periodosPrevios} veces. Se requiere autorización especial del Jefe de Desarrollo.`
          });
        }
        id_autorizacion = autorizacion.id;
        // Marcar autorización como usada
        await autorizacion.update({ activa: false });
      }
    }

    const miembro = await DirectivaMiembro.create({
      id_organizacion,
      id_cargo,
      nombre_completo,
      dni,
      telefono_personal,
      fecha_inicio,
      activo: true,
      id_autorizacion_reeleccion: id_autorizacion
    });

    // Registrar en historial de presidentes
    if (cargo.es_presidente) {
      const org = await Organizacion.findByPk(id_organizacion);
      if (org) {
        const periodos = await HistorialPresidente.count({ where: { dni, id_organizacion } });
        await HistorialPresidente.create({
          dni,
          nombre_completo,
          id_organizacion,
          nombre_organizacion: org.nombre,
          categoria_org: (org.id_tipo === 1 || org.id_tipo === 2) ? 'patronato' : 'junta_agua',
          fecha_inicio: new Date(fecha_inicio),
          periodo_numero: periodos + 1,
          registrado_por: req.usuario!.id,
          autorizado_por: id_autorizacion ? req.usuario!.id : undefined
        });
      }
    }

    // Bitácora
    await registrarBitacora(
      req.usuario!.id,
      'directiva_miembros',
      'CREAR',
      miembro.id,
      `Nuevo miembro: ${nombre_completo} (${cargo.nombre}) en organización ${id_organizacion}`,
      obtenerIp(req)
    );

    res.status(201).json(miembro);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al asignar miembro', error: err.message });
  }
};

// Listar directiva activa de una organización
export const listarDirectiva = async (req: AuthRequest, res: Response) => {
  try {
    const idOrgParam = req.params.id_organizacion;
    const id_organizacion = parseIdParam(idOrgParam);
    const miembros = await DirectivaMiembro.findAll({
      where: { id_organizacion, activo: true },
      include: [{ model: CargoDirectiva, as: 'cargo' }],
      order: [[{ model: CargoDirectiva, as: 'cargo' }, 'orden', 'ASC']]
    });
    res.json(miembros);
  } catch (err) {
    res.status(500).json({ msg: 'Error al listar directiva' });
  }
};

// Renovar toda la directiva
export const renovarDirectiva = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, miembros } = req.body;
    if (!id_organizacion || !miembros || !Array.isArray(miembros)) {
      return res.status(400).json({ msg: 'Faltan datos: id_organizacion y miembros (array)' });
    }
    await DirectivaMiembro.update({ activo: false }, { where: { id_organizacion, activo: true } });
    for (const m of miembros) {
      await DirectivaMiembro.create({ ...m, id_organizacion, activo: true });
    }
    await registrarBitacora(
      req.usuario!.id,
      'directiva_miembros',
      'RENOVAR',
      id_organizacion,
      `Directiva renovada para organización ${id_organizacion}`,
      obtenerIp(req)
    );
    res.json({ msg: 'Directiva renovada exitosamente' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al renovar directiva', error: err.message });
  }
};

// Desactivar un miembro específico (por ID)
export const desactivarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const miembro = await DirectivaMiembro.findByPk(id);
    if (!miembro) return res.status(404).json({ msg: 'Miembro no encontrado' });
    await miembro.update({ activo: false });
    await registrarBitacora(
      req.usuario!.id,
      'directiva_miembros',
      'DESACTIVAR',
      miembro.id,
      `Miembro ${miembro.nombre_completo} desactivado`,
      obtenerIp(req)
    );
    res.json({ msg: 'Miembro desactivado' });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al desactivar miembro', error: err.message });
  }
};