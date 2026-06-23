import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Organizacion from '../models/Organizacion';
import Zona from '../models/Zona';
import TipoOrganizacion from '../models/TipoOrganizacion';
import Configuracion from '../models/Configuracion';
import DirectivaMiembro from '../models/DirectivaMiembro';
import CargoDirectiva from '../models/CargoDirectiva';
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


// ── Alertas de vencimiento ────────────────────────────────────────────────
export const obtenerAlertas = async (req: AuthRequest, res: Response) => {
  try {
    const config = await Configuracion.findOne({ where: { clave: 'dias_alerta_vencimiento' } });
    const diasAlerta = config ? parseInt(config.valor) : 30;
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + diasAlerta);

    const todas = await Organizacion.findAll({
      include: [
        { model: Zona, as: 'zona', attributes: ['nombre'] },
        { model: TipoOrganizacion, as: 'tipo', attributes: ['nombre'] },
        { model: DirectivaMiembro, as: 'directiva',
          where: { id_cargo: 1, activo: true }, required: false,
          attributes: ['nombre_completo', 'telefono_personal'] }
      ]
    });

    const proximas_vencer = todas.filter((o: any) => {
      const v = new Date(o.fecha_vencimiento);
      return v >= hoy && v <= limite;
    });

    const vencidas = todas.filter((o: any) => {
      return new Date(o.fecha_vencimiento) < hoy;
    });

    res.json({ proximas_vencer, vencidas });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener alertas', error: err.message });
  }
};

// ── Reporte completo para listado ─────────────────────────────────────────
export const listarReporte = async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, zona, categoria, busqueda } = req.query;

    const where: any = {};
    if (tipo) where.id_tipo = Number(tipo);
    if (zona) where.id_zona = Number(zona);
    if (busqueda) where.nombre = { [Op.like]: `%${busqueda}%` };

    const orgs = await Organizacion.findAll({
      where,
      include: [
        { model: Zona, as: 'zona', attributes: ['nombre'] },
        { model: TipoOrganizacion, as: 'tipo', attributes: ['nombre', 'categoria', 'vigencia_meses'] },
        { model: DirectivaMiembro, as: 'directiva',
          where: { id_cargo: 1, activo: true }, required: false,
          attributes: ['nombre_completo', 'telefono_personal', 'id_cargo'] }
      ],
      order: [['nombre', 'ASC']]
    });

    const hoy = new Date();
    const config = await Configuracion.findOne({ where: { clave: 'dias_alerta_vencimiento' } });
    const diasAlerta = config ? parseInt(config.valor) : 30;

    let resultado = orgs.map((o: any) => {
      const v = new Date(o.fecha_vencimiento);
      const diff = Math.ceil((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      let estado = 'activa';
      if (diff < 0) estado = 'vencida';
      else if (diff <= diasAlerta) estado = 'proxima_vencer';
      return { ...o.toJSON(), estado };
    });

    if (categoria && categoria !== 'todos') {
      resultado = resultado.filter((o: any) => o.tipo?.categoria === categoria);
    }

    res.json(resultado);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener reporte', error: err.message });
  }
};

// ── Renovar vigencia ──────────────────────────────────────────────────────
export const renovarOrganizacion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const { fecha_vencimiento_nueva, tomo_nuevo, folio_nuevo, observaciones } = req.body;

    if (!fecha_vencimiento_nueva) {
      return res.status(400).json({ msg: 'La nueva fecha de vencimiento es obligatoria' });
    }

    const org = await Organizacion.findByPk(id);
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

    const updateData: any = { fecha_vencimiento: fecha_vencimiento_nueva };
    if (tomo_nuevo) updateData.tomo = tomo_nuevo;
    if (folio_nuevo) updateData.folio = folio_nuevo;
    if (observaciones) updateData.observaciones = observaciones;

    await org.update(updateData);

    await registrarBitacora(
      req.usuario!.id, 'organizaciones', 'RENOVAR', org.id,
      `Vigencia renovada hasta ${fecha_vencimiento_nueva}`,
      obtenerIp(req)
    );

    res.json({ msg: 'Vigencia renovada correctamente', organizacion: org });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al renovar vigencia', error: err.message });
  }
};

// ── Datos para certificado ────────────────────────────────────────────────
export const datosCertificado = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);

    const org = await Organizacion.findByPk(id, {
      include: [
        { model: Zona, as: 'zona', attributes: ['nombre'] },
        { model: TipoOrganizacion, as: 'tipo', attributes: ['nombre', 'categoria', 'vigencia_meses'] }
      ]
    });
    if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

    const directiva = await DirectivaMiembro.findAll({
      where: { id_organizacion: id, activo: true },
      include: [{ model: CargoDirectiva, as: 'cargo', attributes: ['nombre', 'orden'] }],
      order: [[{ model: CargoDirectiva, as: 'cargo' }, 'orden', 'ASC']]
    });

    if (directiva.length === 0) {
      return res.status(400).json({ msg: 'La organización no tiene directiva activa registrada' });
    }

    const claves = ['nombre_institucion', 'cargo_firmante_pdf', 'nombre_firmante_pdf', 'correlativo_certificaciones'];
    const configs = await Configuracion.findAll({ where: { clave: claves } });
    const config: Record<string, string> = {};
    configs.forEach((c: any) => { config[c.clave] = c.valor; });

    const correlativoActual = parseInt(config['correlativo_certificaciones'] || '0');
    const numeroCertificado = `CERT-${new Date().getFullYear()}-${String(correlativoActual + 1).padStart(4, '0')}`;

    const configCorr = configs.find((c: any) => c.clave === 'correlativo_certificaciones');
    if (configCorr) {
      await (configCorr as any).update({ valor: String(correlativoActual + 1) });
    }

    await registrarBitacora(
      req.usuario!.id, 'certificaciones', 'GENERAR_CERT', org.id,
      `Certificado ${numeroCertificado} generado para ${org.nombre}`,
      obtenerIp(req)
    );

    res.json({
      organizacion: org,
      directiva,
      config,
      numeroCertificado,
      fechaGeneracion: new Date().toLocaleDateString('es-HN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener datos del certificado', error: err.message });
  }
};