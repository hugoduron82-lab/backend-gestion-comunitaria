import { Router } from 'express';
import { listarHistorial } from '../controllers/historialController';
import auth from '../middleware/auth';

const router = Router();
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Historial
 *   description: Historial de cambios de directiva
 */

/**
 * @swagger
 * /historial-directivas:
 *   get:
 *     summary: Listar eventos de cambio de directiva (paginado)
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema: { type: string }
 *         description: Filtra por nombre de organización
 *       - in: query
 *         name: zona
 *         schema: { type: integer }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: porPagina
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista paginada de eventos de cambio de directiva
 */
router.get('/', listarHistorial);

export default router;