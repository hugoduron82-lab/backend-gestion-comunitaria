import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DirectivaHistorial from '../models/DirectivaHistorial';
import DirectivaMiembro from '../models/DirectivaMiembro';
import Organizacion from '../models/Organizacion';
import Usuario from '../models/Usuario';
import { Op } from 'sequelize';

// ── Historial de cambios de directiva ───────────────────────
// Agrupa los registros de directiva_historial por (organización,
// fecha del cambio) para mostrar un "evento de renovación" por fila,
// destacando al presidente saliente y al presidente actual de la
// organización (presidente "entrante" desde la perspectiva del evento).
export const listarHistorial = async (req: AuthRequest, res: Response) => {
  try {
    const { busqueda, zona, pagina = '1', porPagina = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(pagina as string, 10) || 1);
    const perPage = Math.max(1, parseInt(porPagina as string, 10) || 20);

    const orgWhere: any = {};
    if (busqueda) orgWhere.nombre = { [Op.like]: `%${busqueda}%` };
    if (zona) orgWhere.id_zona = parseInt(zona as string, 10);

    // Traer todos los registros de historial (con datos de la organización)
    const registros = await DirectivaHistorial.findAll({
      include: [
        {
          model: Organizacion,
          as: 'organizacion',
          where: Object.keys(orgWhere).length ? orgWhere : undefined,
          attributes: ['id', 'nombre', 'id_zona'],
          include: [{ association: 'zona', attributes: ['nombre'] }]
        },
        { model: Usuario, as: 'registrador', attributes: ['correo'] }
      ],
      order: [['creado_en', 'DESC']]
    });

    // Agrupar por (id_organizacion, creado_en) => un "evento de renovación"
    const eventosMap = new Map<string, any>();
    for (const r of registros as any[]) {
      const key = `${r.id_organizacion}__${r.creado_en?.toISOString()}`;
      if (!eventosMap.has(key)) {
        eventosMap.set(key, {
          id_organizacion: r.id_organizacion,
          organizacion: r.organizacion?.nombre,
          zona: r.organizacion?.zona?.nombre,
          fecha_cambio: r.creado_en,
          motivo: r.motivo_cambio,
          registrado_por: r.registrador?.correo,
          presidenteSaliente: null,
          totalMiembrosSalientes: 0
        });
      }
      const ev = eventosMap.get(key);
      ev.totalMiembrosSalientes++;
      if (r.id_cargo === 1) {
        ev.presidenteSaliente = { nombre_completo: r.nombre_completo, dni: r.dni };
      }
    }

    let eventos = Array.from(eventosMap.values());

    // Presidente actual de cada organización involucrada
    const idsOrg = [...new Set(eventos.map(e => e.id_organizacion))];
    const presidentesActuales = idsOrg.length
      ? await DirectivaMiembro.findAll({
          where: { id_organizacion: idsOrg, id_cargo: 1, activo: true },
          attributes: ['id_organizacion', 'nombre_completo', 'dni']
        })
      : [];
    const presidenteActualPorOrg = new Map(
      presidentesActuales.map((p: any) => [p.id_organizacion, { nombre_completo: p.nombre_completo, dni: p.dni }])
    );

    eventos = eventos.map(e => ({
      ...e,
      presidenteEntrante: presidenteActualPorOrg.get(e.id_organizacion) || null
    }));

    // Ordenar y paginar
    eventos.sort((a, b) => new Date(b.fecha_cambio).getTime() - new Date(a.fecha_cambio).getTime());
    const total = eventos.length;
    const inicio = (pageNum - 1) * perPage;
    const pagina_actual = eventos.slice(inicio, inicio + perPage);

    res.json({
      data: pagina_actual,
      total,
      pagina: pageNum,
      porPagina: perPage,
      totalPaginas: Math.max(1, Math.ceil(total / perPage))
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener historial de directivas', error: err.message });
  }
};