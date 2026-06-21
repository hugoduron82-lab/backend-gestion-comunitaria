import { Router } from 'express';
import { crearAutorizacion, listarAutorizaciones } from '../controllers/autorizacionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autorizaciones
 *   description: Autorizaciones especiales de reelección (roles 1 y 2)
 */

/**
 * @swagger
 * /autorizaciones:
 *   post:
 *     summary: Crear autorización especial para 3er período (roles 1 y 2)
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
 *               dni: { type: string, example: "0703-1980-08834" }
 *               nombre_persona: { type: string, example: "Marco Antonio Ramos Cruz" }
 *               id_organizacion: { type: number, example: 34 }
 *               periodo_solicitado: { type: number, example: 3 }
 *               justificacion: { type: string }
 *     responses:
 *       201:
 *         description: Autorización creada
 *       400:
 *         description: Ya existe una autorización activa para este DNI en esta organización
 */
router.post('/', auth, authorize([1, 2]), crearAutorizacion);

/**
 * @swagger
 * /autorizaciones:
 *   get:
 *     summary: Listar todas las autorizaciones (activas e históricas)
 *     tags: [Autorizaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de autorizaciones
 */
router.get('/', auth, authorize([1, 2]), listarAutorizaciones);

export default router;