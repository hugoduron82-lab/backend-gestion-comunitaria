import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

interface CargoDirectivaAttributes {
  id: number;
  nombre: string;
  orden: number;
  obligatorio: boolean;
  es_presidente: boolean;
}

class CargoDirectiva extends Model<CargoDirectivaAttributes> implements CargoDirectivaAttributes {
  public id!: number;
  public nombre!: string;
  public orden!: number;
  public obligatorio!: boolean;
  public es_presidente!: boolean;
}

CargoDirectiva.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    orden: { type: DataTypes.INTEGER, allowNull: false },
    obligatorio: { type: DataTypes.BOOLEAN, defaultValue: true },
    es_presidente: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'cargos_directiva',
    timestamps: false,
  }
);

export default CargoDirectiva;