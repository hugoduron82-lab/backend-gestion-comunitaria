import { Router } from 'express';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  reactivarUsuario,
} from '../controllers/usuarioController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Todas las rutas requieren autenticación y rol administrador (1) o jefe desarrollo (2)
router.use(auth, authorize([1, 2]));

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema (solo admin/jefe desarrollo)
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar usuarios con filtros
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema: { type: integer }
 *       - in: query
 *         name: activo
 *         schema: { type: boolean }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 */
router.get('/', listarUsuarios);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: No existe
 */
router.get('/:id', obtenerUsuario);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_empleado, correo, password, id_rol]
 *             properties:
 *               id_empleado: { type: number }
 *               correo: { type: string }
 *               password: { type: string }
 *               id_rol: { type: number }
 *               activo: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/', crearUsuario);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario (correo, rol, activo, password)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo: { type: string }
 *               id_rol: { type: number }
 *               activo: { type: boolean }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/:id', actualizarUsuario);

/**
 * @swagger
 * /usuarios/{id}/desactivar:
 *   put:
 *     summary: Desactivar usuario (activo=false)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Usuario desactivado
 */
router.put('/:id/desactivar', desactivarUsuario);

/**
 * @swagger
 * /usuarios/{id}/reactivar:
 *   put:
 *     summary: Reactivar usuario (activo=true)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Usuario reactivado
 */
router.put('/:id/reactivar', reactivarUsuario);

export default router;