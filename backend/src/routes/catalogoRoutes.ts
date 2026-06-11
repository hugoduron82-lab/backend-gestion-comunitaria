import { Router } from 'express';
import { getZonas, getTiposOrganizacion } from '../controllers/catalogoController';

const router = Router();

/**
 * @swagger
 * /catalogos/zonas:
 *   get:
 *     summary: Obtener todas las zonas activas
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Lista de zonas
 */
router.get('/zonas', getZonas);

/**
 * @swagger
 * /catalogos/tipos-organizacion:
 *   get:
 *     summary: Obtener todos los tipos de organización activos
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Lista de tipos
 */
router.get('/tipos-organizacion', getTiposOrganizacion);

export default router;