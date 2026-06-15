import { Router } from 'express';
import {
  asignarMiembro,
  listarDirectiva,
  renovarDirectiva,
  actualizarMiembro,
  desactivarMiembro
} from '../controllers/directivaController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Directiva
 *   description: Gestión de miembros de la junta directiva
 */

/**
 * @swagger
 * /directiva/organizacion/{id_organizacion}:
 *   get:
 *     summary: Obtener directiva activa de una organización
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_organizacion
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de miembros activos ordenados por cargo
 *       404:
 *         description: Organización no encontrada
 */
router.get('/organizacion/:id_organizacion', listarDirectiva);

/**
 * @swagger
 * /directiva/miembros:
 *   post:
 *     summary: Asignar un nuevo miembro a la directiva (solo roles 1,2,3)
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_organizacion
 *               - id_cargo
 *               - nombre_completo
 *               - dni
 *               - fecha_inicio
 *             properties:
 *               id_organizacion: { type: integer }
 *               id_cargo: { type: integer }
 *               nombre_completo: { type: string }
 *               dni: { type: string }
 *               telefono_personal: { type: string }
 *               fecha_inicio: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Miembro asignado
 *       400:
 *         description: Error de validación (cargo ya ocupado, conflicto patronato/junta de agua, presidente excede períodos, etc.)
 *       403:
 *         description: No tiene permisos
 */
router.post('/miembros', authorize([1, 2, 3]), asignarMiembro);

/**
 * @swagger
 * /directiva/miembros/{id}:
 *   put:
 *     summary: Corregir datos de un miembro existente (solo roles 1,2,3)
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_completo: { type: string }
 *               dni: { type: string, description: "Si cambia, se valida con el trigger (conflicto patronato/junta de agua, límite de presidente)" }
 *               telefono_personal: { type: string }
 *               fecha_inicio: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Miembro actualizado
 *       400:
 *         description: Error de validación (si cambió el DNI y la BD lo rechaza)
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Miembro no encontrado
 */
router.put('/miembros/:id', authorize([1, 2, 3]), actualizarMiembro);

/**
 * @swagger
 * /directiva/renovar:
 *   post:
 *     summary: Renovar toda la directiva (solo roles 1,2,3)
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_organizacion
 *               - miembros
 *             properties:
 *               id_organizacion: { type: integer }
 *               motivo:
 *                 type: string
 *                 description: "Motivo del cambio de directiva (se guarda en directiva_historial)"
 *                 example: "Renovación periódica"
 *               miembros:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_cargo: { type: integer }
 *                     nombre_completo: { type: string }
 *                     dni: { type: string }
 *                     telefono_personal: { type: string }
 *                     fecha_inicio: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Directiva renovada exitosamente
 *       400:
 *         description: Datos inválidos o validación de la BD (conflicto patronato/junta de agua, límite de presidente)
 *       403:
 *         description: No tiene permisos
 */
router.post('/renovar', authorize([1, 2, 3]), renovarDirectiva);

/**
 * @swagger
 * /directiva/miembros/{id}:
 *   delete:
 *     summary: Desactivar un miembro específico (solo roles 1,2,3)
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Miembro desactivado
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Miembro no encontrado
 */
router.delete('/miembros/:id', authorize([1, 2, 3]), desactivarMiembro);

export default router;