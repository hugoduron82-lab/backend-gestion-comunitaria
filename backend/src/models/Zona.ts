import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

interface ZonaAttributes {
  id: number;
  nombre: string;
  activo: boolean;
}

class Zona extends Model<ZonaAttributes> implements ZonaAttributes {
  public id!: number;
  public nombre!: string;
  public activo!: boolean;
}

Zona.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'zonas',
    timestamps: false,
  }
);

export default Zona;