import { Router } from 'express';
import {
  listarConfiguraciones,
  obtenerConfiguracion,
  obtenerConfiguracionPorClave,
  crearConfiguracion,
  actualizarConfiguracion,
  eliminarConfiguracion
} from '../controllers/configuracionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Todas las rutas requieren autenticación y rol administrador (1) o jefe desarrollo (2)
router.use(auth, authorize([1, 2]));

/**
 * @swagger
 * tags:
 *   name: Configuración
 *   description: Gestión de parámetros del sistema (clave-valor)
 */

/**
 * @swagger
 * /configuracion:
 *   get:
 *     summary: Listar todas las configuraciones
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones
 */
router.get('/', listarConfiguraciones);

/**
 * @swagger
 * /configuracion/{id}:
 *   get:
 *     summary: Obtener configuración por ID
 *     tags: [Configuración]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Configuración encontrada
 *       404:
 *         description: No existe
 */
router.get('/:id', obtenerConfiguracion);

/**
 * @swagger
 * /configuracion/clave/{clave}:
 *   get:
 *     summary: Obtener configuración por clave
 *     tags: [Configuración]
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Configuración encontrada
 *       404:
 *         description: No existe
 */
router.get('/clave/:clave', obtenerConfiguracionPorClave);

/**
 * @swagger
 * /configuracion:
 *   post:
 *     summary: Crear nueva configuración
 *     tags: [Configuración]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clave, valor]
 *             properties:
 *               clave: { type: string }
 *               valor: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Configuración creada
 *       400:
 *         description: Clave ya existe o datos faltantes
 */
router.post('/', crearConfiguracion);

/**
 * @swagger
 * /configuracion/{id}:
 *   put:
 *     summary: Actualizar configuración
 *     tags: [Configuración]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       404:
 *         description: No existe
 */
router.put('/:id', actualizarConfiguracion);

/**
 * @swagger
 * /configuracion/{id}:
 *   delete:
 *     summary: Eliminar configuración
 *     tags: [Configuración]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Configuración eliminada
 *       404:
 *         description: No existe
 */
router.delete('/:id', eliminarConfiguracion);

export default router;