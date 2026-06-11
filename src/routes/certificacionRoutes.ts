import { Router } from 'express';
import { generarCertificado } from '../controllers/certificacionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificaciones
 *   description: Generación de certificados PDF
 */

/**
 * @swagger
 * /certificaciones/organizacion/{id_organizacion}:
 *   get:
 *     summary: Generar y descargar certificado de vigencia en PDF
 *     tags: [Certificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_organizacion
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *       400:
 *         description: Organización sin directiva
 */
router.get('/organizacion/:id_organizacion', auth, authorize([1,2,3,4]), generarCertificado);

export default router;