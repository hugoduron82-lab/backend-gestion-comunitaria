import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Organizacion from '../models/Organizacion';
import Zona from '../models/Zona';
import TipoOrganizacion from '../models/TipoOrganizacion';
import Configuracion from '../models/Configuracion';
import Renovacion from '../models/Renovacion';
import DirectivaMiembro from '../models/DirectivaMiembro';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
import { Op } from 'sequelize';
import sequelize from '../config/db';

const parseIdParam = (param: string | string[]): number => {
  const str = Array.isArray(param) ? param[0] : param;
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error('ID inválido');
  return num;
};

async function calcularEstado(fechaVencimiento: Date): Promise<'activa' | 'proxima_vencer' | 'vencida'> {
  const config = await Configuracion.findOne({ where: { clave: 'dias_alerta_vencimiento' } });
  const diasAlerta = config ? parseInt(config.valor) : 30;
  const hoy = new Date();
  const diffDays = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencida';
  if (diffDays <= diasAlerta) return 'proxima_vencer';
  return 'activa';
}

export const crearOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, id_tipo, id_zona, colonia_sector, tomo, folio, fecha_inscripcion, total_directiva, observaciones } = req.body;
    const tipo = await TipoOrganizacion.findByPk(id_tipo);
    if (!tipo) return res.status(400).json({ msg: 'Tipo de organización no válido' });
    const fechaIns = new Date(fecha_inscripcion);
    const fechaVenc = new Date(fechaIns);
    fechaVenc.setMonth(fechaIns.getMonth() + tipo.vigencia_meses);
    const estado = await calcularEstado(fechaVenc);
    const nueva = await Organizacion.create({
      nombre, id_tipo, id_zona, colonia_sector, tomo, folio,
      fecha_inscripcion: fechaIns, fecha_vencimiento: fechaVenc,
      total_directiva, estado, observaciones,
      registrado_por: req.usuario!.id
    });
    await registrarBitacora(
      req.usuario!.id,
      'organizaciones',
      'CREAR',
      nueva.id,
      `Organización creada: ${nombre}`,
      obtenerIp(req)
    );
    res.status(201).json(nueva);
  } catch (err: any) {
    res.status(500).json({ msg: 'Error al crear organización', error: err.message });
  }
};

// ── Listado con filtros y paginación ────────────────────────
export const listarOrganizaciones = async (req: AuthRequest, res: Response) => {
  try {
    const {
      zona, estado, tipo, categoria, busqueda,
      pagina = '1', porPagina = '12'
    } = req.query;

    const pageNum  = Math.max(1, parseInt(pagina as string, 10) || 1);
    const perPage  = Math.max(1, parseInt(porPagina as string, 10) || 12);

    const where: any = {};

    if (!estado || estado === 'todos') {
      where.estado = { [Op.ne]: 'inactiva' };
    } else {
      where.estado = estado;
    }

    if (zona) where.id_zona = parseInt(zona as string, 10);
    if (tipo) where.id_tipo = parseInt(tipo as string, 10);

    if (busqueda) {
      where.nombre = { [Op.like]: `%${busqueda}%` };
    }

    const tipoInclude: any = {
      model: TipoOrganizacion,
      as: 'tipo',
      attributes: ['nombre', 'categoria']
    };
    if (categoria && categoria !== 'todos') {
      tipoInclude.where = { categoria };
      tipoInclude.required = true;
    }

    const { count, rows } = await Organizacion.findAndCountAll({
      where,
      include: [
        { model: Zona, as: 'zona', attributes: ['id', 'nombre'] },
        tipoInclude
      ],
      order: [['creado_en', 'DESC']],
      limit: perPage,
      offset: (pageNum - 1) * perPage,
      distinct: true
    });

    res.json({
      data: rows,
      total: count,
      pagina: pageNum,
      porPagina: perPage,
      totalPaginas: Math.max(1, Math.ceil(count / perPage))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al listar organizaciones' });
  }
};

export const obtenerOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const org = await Organizacion.findByPk(id, {
      include: [
        { model: Zona, as: 'zona' },
        { model: TipoOrganizacion, as: 'tipo' }
      ]
    });
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener organización' });
  }
};

export const actualizarOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const org = await Organizacion.findByPk(id);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });
    await org.update(req.body);
    if (req.body.fecha_vencimiento) {
      const nuevoEstado = await calcularEstado(new Date(req.body.fecha_vencimiento));
      await org.update({ estado: nuevoEstado });
    }
    await org.reload();
    await registrarBitacora(
      req.usuario!.id,
      'organizaciones',
      'EDITAR',
      org.id,
      `Organización actualizada: ${org.nombre}`,
      obtenerIp(req)
    );
    res.json(org);
  } catch (err) {
    res.status(500).json({ msg: 'Error al actualizar' });
  }
};

export const renovarOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const org = await Organizacion.findByPk(id);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

    const { fecha_vencimiento_nueva, tomo_nuevo, folio_nuevo, observaciones } = req.body;
    if (!fecha_vencimiento_nueva) {
      return res.status(400).json({ msg: 'fecha_vencimiento_nueva es requerida' });
    }

    const fechaAnt = org.fecha_vencimiento;
    const fechaNueva = new Date(fecha_vencimiento_nueva);

    await Renovacion.create({
      id_organizacion: id,
      fecha_renovacion: new Date(),
      fecha_vencimiento_ant: fechaAnt,
      fecha_vencimiento_nueva: fechaNueva,
      tomo_nuevo,
      folio_nuevo,
      observaciones,
      registrado_por: req.usuario!.id
    });

    const nuevoEstado = await calcularEstado(fechaNueva);
    const updates: any = { fecha_vencimiento: fechaNueva, estado: nuevoEstado };
    if (tomo_nuevo) updates.tomo = tomo_nuevo;
    if (folio_nuevo) updates.folio = folio_nuevo;
    await org.update(updates);
    await org.reload();

    await registrarBitacora(
      req.usuario!.id,
      'organizaciones',
      'RENOVAR',
      org.id,
      `Organización renovada: ${org.nombre}. Nueva vigencia: ${fechaNueva.toLocaleDateString()}`,
      obtenerIp(req)
    );

    res.json(org);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al renovar organización', error: err.message });
  }
};

export const eliminarOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const org = await Organizacion.findByPk(id);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });
    await org.update({ estado: 'inactiva' });
    await org.reload();
    await registrarBitacora(
      req.usuario!.id,
      'organizaciones',
      'DESACTIVAR',
      org.id,
      `Organización desactivada: ${org.nombre}`,
      obtenerIp(req)
    );
    res.json({ msg: 'Organización desactivada', organizacion: org });
  } catch (err) {
    res.status(500).json({ msg: 'Error al eliminar' });
  }
};

export const obtenerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [result]: any = await sequelize.query('SELECT * FROM v_dashboard_stats');
    res.json(result[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener estadísticas del dashboard' });
  }
};

export const obtenerAlertas = async (req: AuthRequest, res: Response) => {
  try {
    const baseInclude = [
      { model: Zona, as: 'zona', attributes: ['id', 'nombre'] },
      { model: TipoOrganizacion, as: 'tipo', attributes: ['nombre', 'categoria'] },
      {
        model: DirectivaMiembro,
        as: 'directiva',
        where: { id_cargo: 1, activo: true },
        required: false,
        attributes: ['nombre_completo', 'telefono_personal']
      }
    ];

    const proximasVencer = await Organizacion.findAll({
      where: { estado: 'proxima_vencer' },
      include: baseInclude,
      order: [['fecha_vencimiento', 'ASC']]
    });

    const vencidas = await Organizacion.findAll({
      where: { estado: 'vencida' },
      include: baseInclude,
      order: [['fecha_vencimiento', 'ASC']]
    });

    res.json({ proximas_vencer: proximasVencer, vencidas });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener alertas', error: err.message });
  }
};

// ── Reporte de organizaciones (para regidores) ──────────────
// Lista TODAS las organizaciones (sin paginación, pensado para imprimir),
// incluyendo presidente y teléfono, con filtros por tipo y zona.
export const listarReporte = async (req: AuthRequest, res: Response) => {
  try {
    const { zona, tipo, categoria, busqueda } = req.query;

    const where: any = { estado: { [Op.ne]: 'inactiva' } };
    if (zona) where.id_zona = parseInt(zona as string, 10);
    if (tipo) where.id_tipo = parseInt(tipo as string, 10);
    if (busqueda) where.nombre = { [Op.like]: `%${busqueda}%` };

    const tipoInclude: any = {
      model: TipoOrganizacion,
      as: 'tipo',
      attributes: ['nombre', 'categoria']
    };
    if (categoria && categoria !== 'todos') {
      tipoInclude.where = { categoria };
      tipoInclude.required = true;
    }

    const organizaciones = await Organizacion.findAll({
      where,
      include: [
        { model: Zona, as: 'zona', attributes: ['id', 'nombre'] },
        tipoInclude,
        {
          model: DirectivaMiembro,
          as: 'directiva',
          where: { id_cargo: 1, activo: true },
          required: false,
          attributes: ['nombre_completo', 'telefono_personal']
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json(organizaciones);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener reporte de organizaciones', error: err.message });
  }
};