import { Router } from 'express';
import {
  asignarMiembro,
  listarDirectiva,
  renovarDirectiva,
  actualizarMiembro,
  desactivarMiembro,
  buscarPorDni
} from '../controllers/directivaController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(auth);

/**
 * @swagger
 * /directiva/buscar-por-dni/{dni}:
 *   get:
 *     summary: Buscar presidente activo por DNI (para autocompletar autorización)
 *     tags: [Directiva]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dni
 *         required: true
 *         schema: { type: string }
 *         example: "0703-1980-08834"
 *     responses:
 *       200:
 *         description: Datos del presidente encontrado
 *       404:
 *         description: No se encontró un presidente activo con ese DNI
 */
router.get('/buscar-por-dni/:dni', buscarPorDni);

router.get('/organizacion/:id_organizacion', listarDirectiva);

router.post('/miembros', authorize([1, 2, 3]), asignarMiembro);

router.put('/miembros/:id', authorize([1, 2, 3]), actualizarMiembro);

router.post('/renovar', authorize([1, 2, 3]), renovarDirectiva);

router.delete('/miembros/:id', authorize([1, 2, 3]), desactivarMiembro);

export default router;