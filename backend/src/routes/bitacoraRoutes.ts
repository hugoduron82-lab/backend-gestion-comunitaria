import { Router } from 'express';
import { listarBitacora } from '../controllers/bitacoraController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bitácora
 *   description: Auditoría de acciones del sistema (solo admin/jefe desarrollo)
 */

/**
 * @swagger
 * /bitacora:
 *   get:
 *     summary: Obtener registros de la bitácora con filtros (solo roles 1,2)
 *     tags: [Bitácora]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuario
 *         schema: { type: integer }
 *         description: ID del usuario
 *       - in: query
 *         name: tabla
 *         schema: { type: string }
 *         description: Tabla afectada (organizaciones, directiva_miembros, etc.)
 *       - in: query
 *         name: accion
 *         schema: { type: string, enum: [CREAR, EDITAR, DESACTIVAR, RENOVAR, GENERAR_PDF, LOGIN, LOGOUT, CAMBIO_DIRECTIVA, AUTORIZACION_REELECCION, RECHAZO_VALIDACION] }
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *         description: Fecha inicial (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista paginada de eventos
 *       403:
 *         description: No autorizado
 */
router.get('/', auth, authorize([1, 2]), listarBitacora);

export default router;