import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DirectivaMiembro from '../models/DirectivaMiembro';
import CargoDirectiva from '../models/CargoDirectiva';
import Organizacion from '../models/Organizacion';
import HistorialPresidente from '../models/HistorialPresidente';
import AutorizacionReeleccion from '../models/AutorizacionReeleccion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import sequelize from '../config/db';

const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

const mensajeSql = (err: any): string => {
  return err.original?.sqlMessage || err.message || 'Error desconocido';
};

export const asignarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, id_cargo, nombre_completo, dni, telefono_personal, fecha_inicio } = req.body;

    const cargo = await CargoDirectiva.findByPk(id_cargo);
    if (!cargo) return res.status(400).json({ msg: 'Cargo no válido' });

    const existe = await DirectivaMiembro.findOne({ where: { id_organizacion, id_cargo, activo: true } });
    if (existe) return res.status(400).json({ msg: 'Ya hay un miembro activo en este cargo' });

    let id_autorizacion = null;

    if (cargo.es_presidente) {
      const autorizacion = await AutorizacionReeleccion.findOne({
        where: { dni, id_organizacion, activa: true }
      });
      if (autorizacion) {
        id_autorizacion = autorizacion.id;
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

    if (id_autorizacion) {
      await AutorizacionReeleccion.update({ activa: false }, { where: { id: id_autorizacion } });
    }

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
    res.status(400).json({ msg: mensajeSql(err) });
  }
};

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

export const renovarDirectiva = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, miembros, motivo } = req.body;
    if (!id_organizacion || !miembros || !Array.isArray(miembros)) {
      return res.status(400).json({ msg: 'Faltan datos: id_organizacion y miembros (array)' });
    }

    await sequelize.query('CALL renovar_directiva(?, ?, ?)', {
      replacements: [id_organizacion, req.usuario!.id, motivo || 'Renovación periódica']
    });

    const org = await Organizacion.findByPk(id_organizacion);
    const nuevosMiembros = [];

    for (const m of miembros) {
      let id_autorizacion = null;

      const cargo = await CargoDirectiva.findByPk(m.id_cargo);

      if (cargo?.es_presidente) {
        const autorizacion = await AutorizacionReeleccion.findOne({
          where: { dni: m.dni, id_organizacion, activa: true }
        });
        if (autorizacion) id_autorizacion = autorizacion.id;
      }

      const nuevo = await DirectivaMiembro.create({
        id_organizacion,
        id_cargo: m.id_cargo,
        nombre_completo: m.nombre_completo,
        dni: m.dni,
        telefono_personal: m.telefono_personal,
        telefono_alternativo: m.telefono_alternativo,
        fecha_inicio: m.fecha_inicio,
        activo: true,
        id_autorizacion_reeleccion: id_autorizacion
      });
      nuevosMiembros.push(nuevo);

      if (id_autorizacion) {
        await AutorizacionReeleccion.update({ activa: false }, { where: { id: id_autorizacion } });
      }

      if (cargo?.es_presidente && org) {
        const periodos = await HistorialPresidente.count({ where: { dni: m.dni, id_organizacion } });
        await HistorialPresidente.create({
          dni: m.dni,
          nombre_completo: m.nombre_completo,
          id_organizacion,
          nombre_organizacion: org.nombre,
          categoria_org: (org.id_tipo === 1 || org.id_tipo === 2) ? 'patronato' : 'junta_agua',
          fecha_inicio: new Date(m.fecha_inicio),
          periodo_numero: periodos + 1,
          registrado_por: req.usuario!.id,
          autorizado_por: id_autorizacion ? req.usuario!.id : undefined
        });
      }
    }

    res.json({ msg: 'Directiva renovada exitosamente', miembros: nuevosMiembros });
  } catch (err: any) {
    res.status(400).json({ msg: mensajeSql(err) });
  }
};

export const actualizarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const miembro = await DirectivaMiembro.findByPk(id);
    if (!miembro) return res.status(404).json({ msg: 'Miembro no encontrado' });

    const { nombre_completo, dni, telefono_personal, fecha_inicio } = req.body;

    if (dni && dni !== miembro.dni) {
      const dniAnterior = miembro.dni;
      await miembro.update({ activo: false });

      const cargo = await CargoDirectiva.findByPk(miembro.id_cargo);
      let id_autorizacion = null;
      if (cargo?.es_presidente) {
        const autorizacion = await AutorizacionReeleccion.findOne({
          where: { dni, id_organizacion: miembro.id_organizacion, activa: true }
        });
        if (autorizacion) id_autorizacion = autorizacion.id;
      }

      let nuevo;
      try {
        nuevo = await DirectivaMiembro.create({
          id_organizacion: miembro.id_organizacion,
          id_cargo: miembro.id_cargo,
          nombre_completo: nombre_completo ?? miembro.nombre_completo,
          dni,
          telefono_personal: telefono_personal ?? miembro.telefono_personal,
          fecha_inicio: fecha_inicio ?? miembro.fecha_inicio,
          activo: true,
          id_autorizacion_reeleccion: id_autorizacion
        });
      } catch (errCreate: any) {
        await miembro.update({ activo: true });
        throw errCreate;
      }

      if (id_autorizacion) {
        await AutorizacionReeleccion.update({ activa: false }, { where: { id: id_autorizacion } });
      }

      await registrarBitacora(
        req.usuario!.id,
        'directiva_miembros',
        'EDITAR',
        nuevo.id,
        `DNI corregido en organización ${miembro.id_organizacion}: ${dniAnterior} → ${dni}`,
        obtenerIp(req)
      );

      return res.json(nuevo);
    }

    const updates: any = {};
    if (nombre_completo !== undefined) updates.nombre_completo = nombre_completo;
    if (telefono_personal !== undefined) updates.telefono_personal = telefono_personal;
    if (fecha_inicio !== undefined) updates.fecha_inicio = fecha_inicio;

    await miembro.update(updates);

    await registrarBitacora(
      req.usuario!.id,
      'directiva_miembros',
      'EDITAR',
      miembro.id,
      `Datos corregidos: ${miembro.nombre_completo} (organización ${miembro.id_organizacion})`,
      obtenerIp(req)
    );

    res.json(miembro);
  } catch (err: any) {
    res.status(400).json({ msg: mensajeSql(err) });
  }
};

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

// ── Buscar presidente activo por DNI ────────────────────────
// Usado por el formulario de autorizaciones especiales para
// autocompletar nombre y organización al ingresar el DNI.
// Busca en directiva_miembros con id_cargo=1 (Presidente) y activo=true.
export const buscarPorDni = async (req: AuthRequest, res: Response) => {
  try {
    const { dni } = req.params;

    const miembro = await DirectivaMiembro.findOne({
      where: { dni, activo: true, id_cargo: 1 },
      include: [
        {
          model: Organizacion,
          as: 'organizacion',
          attributes: ['id', 'nombre']
        },
        {
          model: CargoDirectiva,
          as: 'cargo',
          attributes: ['nombre']
        }
      ]
    });

    if (!miembro) {
      return res.status(404).json({
        msg: 'No se encontró un presidente activo con ese DNI'
      });
    }

    res.json({
      nombre_completo: miembro.nombre_completo,
      id_organizacion: (miembro as any).organizacion?.id,
      nombre_organizacion: (miembro as any).organizacion?.nombre,
      cargo: (miembro as any).cargo?.nombre
    });
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al buscar por DNI', error: err.message });
  }
};