import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Organizacion from '../models/Organizacion';
import Zona from '../models/Zona';
import TipoOrganizacion from '../models/TipoOrganizacion';
import Configuracion from '../models/Configuracion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';
<<<<<<< HEAD
import { Op } from 'sequelize';
import sequelize from '../config/db';
=======
import { Op } from 'sequelize';   // ← IMPORTANTE: importar Op
>>>>>>> origin/feature/frontend-nestor

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

<<<<<<< HEAD
// ── Listado con filtros y paginación ────────────────────────
// Acepta: ?pagina=1&porPagina=12&zona=3&estado=activa&tipo=2&categoria=patronato&busqueda=texto
export const listarOrganizaciones = async (req: AuthRequest, res: Response) => {
  try {
    const {
      zona, estado, tipo, categoria, busqueda,
      pagina = '1', porPagina = '12'
    } = req.query;

    const pageNum  = Math.max(1, parseInt(pagina as string, 10) || 1);
    const perPage  = Math.max(1, parseInt(porPagina as string, 10) || 12);

    const where: any = {};

    // Por defecto excluye inactivas, salvo que se pida un estado explícito
    if (!estado || estado === 'todos') {
      where.estado = { [Op.ne]: 'inactiva' };
    } else {
      where.estado = estado;
    }

    if (zona) where.id_zona = parseInt(zona as string, 10);
    if (tipo) where.id_tipo = parseInt(tipo as string, 10);

    // Búsqueda por nombre (LIKE)
    if (busqueda) {
      where.nombre = { [Op.like]: `%${busqueda}%` };
    }

    // Filtro por categoría (patronato / junta_agua) — va sobre la tabla relacionada
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
=======
export const listarOrganizaciones = async (req: AuthRequest, res: Response) => {
  try {
    const { zona, estado, tipo } = req.query;
    const where: any = {};
    // Por defecto, excluir las inactivas (a menos que se pida explícitamente)
    if (!estado) {
      where.estado = { [Op.ne]: 'inactiva' };   // ← CORREGIDO: usa Op.ne
    } else {
      where.estado = estado;
    }
    if (zona) where.id_zona = parseInt(zona as string);
    if (tipo) where.id_tipo = parseInt(tipo as string);

    const orgs = await Organizacion.findAll({
      where,
      include: [
        { model: Zona, as: 'zona', attributes: ['nombre'] },
        { model: TipoOrganizacion, as: 'tipo', attributes: ['nombre', 'categoria'] }
      ],
      order: [['creado_en', 'DESC']]
    });
    res.json(orgs);
>>>>>>> origin/feature/frontend-nestor
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

export const eliminarOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const org = await Organizacion.findByPk(id);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });
    await org.update({ estado: 'inactiva' });
<<<<<<< HEAD
    await org.reload();
=======
    await org.reload();   // ← recargar para asegurar que la instancia tenga el nuevo estado
>>>>>>> origin/feature/frontend-nestor
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
<<<<<<< HEAD
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
=======
};  
>>>>>>> origin/feature/frontend-nestor
