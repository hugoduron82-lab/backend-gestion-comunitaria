import express from 'express';
import cors from 'cors';
import sequelize from './config/db';
import authRoutes from './routes/authRoutes';
import catalogoRoutes from './routes/catalogoRoutes';
import organizacionRoutes from './routes/organizacionRoutes';
import directivaRoutes from './routes/directivaRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { config } from './config/env';

import usuarioRoutes from './routes/usuarioRoutes';
import Usuario from './models/Usuario';
import Zona from './models/Zona';
import TipoOrganizacion from './models/TipoOrganizacion';
import Organizacion from './models/Organizacion';
import CargoDirectiva from './models/CargoDirectiva';
import DirectivaMiembro from './models/DirectivaMiembro';
import HistorialPresidente from './models/HistorialPresidente';
import Configuracion from './models/Configuracion';
import autorizacionRoutes from './routes/autorizacionRoutes';
import certificacionRoutes from './routes/certificacionRoutes';
import Bitacora from './models/Bitacora';
import bitacoraRoutes from './routes/bitacoraRoutes';
import Rol from './models/Rol';
import Renovacion from './models/Renovacion';
import DirectivaHistorial from './models/DirectivaHistorial';
import historialRoutes from './routes/historialRoutes';
import AutorizacionReeleccion from './models/AutorizacionReeleccion';
import configuracionRoutes from './routes/configuracionRoutes';

Bitacora.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-spec.json', (req, res) => {
  console.log('Solicitando /api-spec.json');
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/organizaciones', organizacionRoutes);
app.use('/api/directiva', directivaRoutes);
app.use('/api/autorizaciones', autorizacionRoutes);
app.use('/api/certificaciones', certificacionRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/historial-directivas', historialRoutes);
app.use('/api/configuracion', configuracionRoutes);

app.get('/', (req, res) => {
  res.send('Backend funcionando - Documentación en /api-docs');
});

// Asociaciones
Organizacion.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });
Organizacion.belongsTo(Zona, { foreignKey: 'id_zona', as: 'zona' });
Organizacion.belongsTo(TipoOrganizacion, { foreignKey: 'id_tipo', as: 'tipo' });
DirectivaMiembro.belongsTo(Organizacion, { foreignKey: 'id_organizacion', as: 'organizacion' });
DirectivaMiembro.belongsTo(CargoDirectiva, { foreignKey: 'id_cargo', as: 'cargo' });
Organizacion.hasMany(DirectivaMiembro, { foreignKey: 'id_organizacion', as: 'directiva' });
HistorialPresidente.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizador' });
HistorialPresidente.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });
Organizacion.hasMany(Renovacion, { foreignKey: 'id_organizacion', as: 'renovaciones' });
Renovacion.belongsTo(Organizacion, { foreignKey: 'id_organizacion', as: 'organizacion' });
Renovacion.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });
DirectivaHistorial.belongsTo(Organizacion, { foreignKey: 'id_organizacion', as: 'organizacion' });
DirectivaHistorial.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });
// Autorización de reelección: quién emitió la autorización
AutorizacionReeleccion.belongsTo(Usuario, { foreignKey: 'autorizado_por', as: 'autorizador' });

sequelize.sync()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Servidor corriendo en http://localhost:${config.port}`);
      console.log(`Swagger UI disponible en http://localhost:${config.port}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Error al conectar la base de datos:', err);
  });