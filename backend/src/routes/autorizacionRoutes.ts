import { Router } from 'express';
import { crearAutorizacion, listarAutorizaciones } from '../controllers/autorizacionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autorizaciones
 *   description: Autorizaciones especiales de reelección (solo Jefe Desarrollo)
 */

/**
 * @swagger
 * /autorizaciones:
 *   post:
 *     summary: Crear autorización para reelección (solo rol 2)
 *     tags: [Autorizaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dni, nombre_persona, id_organizacion, periodo_solicitado, justificacion]
 *             properties:
 *               dni: { type: string }
 *               nombre_persona: { type: string }
 *               id_organizacion: { type: number }
 *               periodo_solicitado: { type: number }
 *               justificacion: { type: string }
 *     responses:
 *       201:
 *         description: Autorización creada
 */
router.post('/', auth, authorize([1,2]), crearAutorizacion);

/**
 * @swagger
 * /autorizaciones:
 *   get:
 *     summary: Listar autorizaciones activas
 *     tags: [Autorizaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de autorizaciones
 */
router.get('/', auth, authorize([1,2]), listarAutorizaciones);

export default router;