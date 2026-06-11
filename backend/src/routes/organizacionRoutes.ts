import { Router } from 'express';
import {
  crearOrganizacion,
  listarOrganizaciones,
  obtenerOrganizacion,
  actualizarOrganizacion,
  eliminarOrganizacion
} from '../controllers/organizacionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Organizaciones
 *   description: Gestión de organizaciones comunitarias
 */

/**
 * @swagger
 * /organizaciones:
 *   get:
 *     summary: Listar organizaciones con filtros opcionales
 *     tags: [Organizaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: zona
 *         schema: { type: integer }
 *         description: ID de la zona
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [activa, proxima_vencer, vencida, inactiva] }
 *       - in: query
 *         name: tipo
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de organizaciones
 */
router.get('/', listarOrganizaciones);

/**
 * @swagger
 * /organizaciones/{id}:
 *   get:
 *     summary: Obtener una organización por ID
 *     tags: [Organizaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organización encontrada
 *       404:
 *         description: No existe
 */
router.get('/:id', obtenerOrganizacion);

/**
 * @swagger
 * /organizaciones:
 *   post:
 *     summary: Crear una nueva organización (solo roles 1,2,3)
 *     tags: [Organizaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - id_tipo
 *               - id_zona
 *               - fecha_inscripcion
 *             properties:
 *               nombre: { type: string }
 *               id_tipo: { type: integer }
 *               id_zona: { type: integer }
 *               colonia_sector: { type: string }
 *               tomo: { type: string }
 *               folio: { type: string }
 *               fecha_inscripcion: { type: string, format: date }
 *               total_directiva: { type: integer, default: 7 }
 *               observaciones: { type: string }
 *     responses:
 *       201:
 *         description: Organización creada
 *       403:
 *         description: No tiene permisos
 */
router.post('/', authorize([1, 2, 3]), crearOrganizacion);

/**
 * @swagger
 * /organizaciones/{id}:
 *   put:
 *     summary: Actualizar una organización (solo roles 1,2,3)
 *     tags: [Organizaciones]
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
 *               nombre: { type: string }
 *               id_tipo: { type: integer }
 *               id_zona: { type: integer }
 *               colonia_sector: { type: string }
 *               tomo: { type: string }
 *               folio: { type: string }
 *               fecha_inscripcion: { type: string, format: date }
 *               total_directiva: { type: integer }
 *               fecha_vencimiento: { type: string, format: date }
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Organización actualizada
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: No encontrada
 */
router.put('/:id', authorize([1, 2, 3]), actualizarOrganizacion);

/**
 * @swagger
 * /organizaciones/{id}:
 *   delete:
 *     summary: Desactivar una organización (solo roles 1,2,3)
 *     tags: [Organizaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organización desactivada
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: No encontrada
 */
router.delete('/:id', authorize([1, 2, 3]), eliminarOrganizacion);

export default router;