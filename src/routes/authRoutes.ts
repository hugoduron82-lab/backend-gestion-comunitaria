import { Router } from 'express';
import { login, perfil } from '../controllers/authController';
import auth from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios (registro deshabilitado, solo login y perfil)
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 example: "usuario@ejemplo.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token JWT y datos del usuario
 *       400:
 *         description: Credenciales incorrectas o usuario inactivo
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: Datos del usuario (sin incluir la contraseña)
 *       401:
 *         description: No autorizado (token inválido o faltante)
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile', auth, perfil);

export default router;