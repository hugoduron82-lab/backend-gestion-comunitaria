import { Router } from 'express';
import {
  crearOrganizacion,
  listarOrganizaciones,
  obtenerOrganizacion,
  actualizarOrganizacion,
  eliminarOrganizacion,
  obtenerDashboard,
  obtenerAlertas,
  listarReporte,
  renovarOrganizacion,
  datosCertificado
} from '../controllers/organizacionController';
import auth from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(auth);

router.get('/dashboard', obtenerDashboard);
router.get('/alertas', obtenerAlertas);
router.get('/reporte', listarReporte);
router.get('/', listarOrganizaciones);
router.get('/:id/certificado', datosCertificado);
router.get('/:id', obtenerOrganizacion);
router.post('/', authorize([1, 2, 3]), crearOrganizacion);
router.put('/:id/renovar', authorize([1, 2, 3]), renovarOrganizacion);
router.put('/:id', authorize([1, 2, 3]), actualizarOrganizacion);
router.delete('/:id', authorize([1, 2, 3]), eliminarOrganizacion);

export default router;