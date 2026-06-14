import { Sequelize } from 'sequelize';
import { config } from './env';

// Verificar que las variables de entorno existen (opcional pero recomendado)
if (!config.db.name || !config.db.user || !config.db.password || !config.db.host) {
  throw new Error('Faltan variables de entorno para la base de datos');
}

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;