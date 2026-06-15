import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DirectivaMiembro from '../models/DirectivaMiembro';
import CargoDirectiva from '../models/CargoDirectiva';
import Organizacion from '../models/Organizacion';
import HistorialPresidente from '../models/HistorialPresidente';
import AutorizacionReeleccion from '../models/AutorizacionReeleccion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import sequelize from '../config/db';

// Helper para convertir parámetros de ruta (string | string[]) a número
const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

// Helper para extraer el mensaje del trigger SIGNAL SQLSTATE '45000'
// cuando Sequelize lanza un error de validación de MySQL
const mensajeSql = (err: any): string => {
  return err.original?.sqlMessage || err.message || 'Error desconocido';
};

// Asignar un nuevo miembro a la directiva
// El trigger trg_validar_directiva_ins (en MySQL) valida automáticamente:
//  - máximo 9 miembros activos por organización
//  - conflicto patronato / junta de agua por DNI (la misma persona no
//    puede estar activa en organizaciones de ambas categorías)
//  - límite de 2 períodos como presidente (salvo autorización especial
//    activa del Jefe de Desarrollo Comunitario)
export const asignarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, id_cargo, nombre_completo, dni, telefono_personal, fecha_inicio } = req.body;

    const cargo = await CargoDirectiva.findByPk(id_cargo);
    if (!cargo) return res.status(400).json({ msg: 'Cargo no válido' });

    const existe = await DirectivaMiembro.findOne({ where: { id_organizacion, id_cargo, activo: true } });
    if (existe) return res.status(400).json({ msg: 'Ya hay un miembro activo en este cargo' });

    let id_autorizacion = null;

    // Si la persona ya cumplió 2 períodos como presidente y el Jefe de
    // Desarrollo Comunitario emitió una autorización especial activa para
    // esta organización, la vinculamos al nuevo registro.
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

    // Si se usó una autorización especial, marcarla como usada
    if (id_autorizacion) {
      await AutorizacionReeleccion.update({ activa: false }, { where: { id: id_autorizacion } });
    }

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
    // Si el error viene de un trigger (SIGNAL SQLSTATE '45000'), el mensaje
    // ya está en español y listo para mostrar al usuario tal cual.
    res.status(400).json({ msg: mensajeSql(err) });
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

// ── Renovar toda la directiva ───────────────────────────────
// Usa el procedimiento renovar_directiva (ya existente en la BD), que:
//  - copia la directiva actual a directiva_historial (con motivo_cambio)
//  - cierra el período abierto en historial_presidentes
//  - libera autorizaciones de reelección activas
//  - desactiva (activo=0) la directiva actual
//  - registra en bitácora (CAMBIO_DIRECTIVA)
// Luego inserta los nuevos miembros uno por uno; cada inserción pasa por
// el trigger trg_validar_directiva_ins (mismas validaciones de arriba).
export const renovarDirectiva = async (req: AuthRequest, res: Response) => {
  try {
    const { id_organizacion, miembros, motivo } = req.body;
    if (!id_organizacion || !miembros || !Array.isArray(miembros)) {
      return res.status(400).json({ msg: 'Faltan datos: id_organizacion y miembros (array)' });
    }

    // 1) Archivar directiva actual (procedimiento ya existente en la BD)
    await sequelize.query('CALL renovar_directiva(?, ?, ?)', {
      replacements: [id_organizacion, req.usuario!.id, motivo || 'Renovación periódica']
    });

    // 2) Insertar la nueva directiva
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

      // Si es presidente, registrar nuevo período en historial_presidentes
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

// ── Actualizar (corregir) un miembro existente ──────────────
// - Si NO cambia el DNI: corrección directa (nombre, teléfono, fecha_inicio).
//   No pasa por el trigger porque no afecta conflicto patronato/junta de
//   agua ni el límite de presidente (ambos dependen del DNI).
// - Si cambia el DNI: el miembro actual se desactiva y se crea uno nuevo
//   con el DNI corregido, para que el trigger trg_validar_directiva_ins
//   valide el nuevo DNI (conflicto patronato/junta de agua, límite de
//   presidente, máximo 9 miembros).
export const actualizarMiembro = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const miembro = await DirectivaMiembro.findByPk(id);
    if (!miembro) return res.status(404).json({ msg: 'Miembro no encontrado' });

    const { nombre_completo, dni, telefono_personal, fecha_inicio } = req.body;

    if (dni && dni !== miembro.dni) {
      // El DNI cambió: desactivar el actual y crear uno nuevo (pasa por el trigger)
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
        // Si el trigger bloquea el nuevo DNI, revertir la desactivación
        // del miembro original para no dejar el registro sin directiva
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
        `DNI corregido en organización ${miembro.id_organizacion}: ${dniAnterior} → ${dni} (${nombre_completo ?? miembro.nombre_completo})`,
        obtenerIp(req)
      );

      return res.json(nuevo);
    }

    // Sin cambio de DNI: corrección simple (nombre, teléfono, fecha)
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