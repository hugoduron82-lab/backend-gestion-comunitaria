import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

interface RolAttributes {
  id: number;
  nombre: string;
  descripcion?: string;
}

class Rol extends Model<RolAttributes> implements RolAttributes {
  public id!: number;
  public nombre!: string;
  public descripcion!: string;
}

Rol.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    descripcion: DataTypes.STRING(255),
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
  }
);

export default Rol;