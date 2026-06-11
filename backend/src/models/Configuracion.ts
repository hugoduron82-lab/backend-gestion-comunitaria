import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface ConfiguracionAttributes {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  // actualizado_en no se incluye porque la base de datos lo maneja automáticamente
}

interface ConfiguracionCreationAttributes extends Optional<ConfiguracionAttributes, 'id' | 'descripcion'> {}

class Configuracion extends Model<ConfiguracionAttributes, ConfiguracionCreationAttributes> implements ConfiguracionAttributes {
  public id!: number;
  public clave!: string;
  public valor!: string;
  public descripcion!: string;
  // sin actualizado_en en la clase
}

Configuracion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    clave: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    valor: { type: DataTypes.TEXT, allowNull: false },
    descripcion: DataTypes.STRING(255),
  },
  {
    sequelize,
    tableName: 'configuracion',
    timestamps: false, // importante: no añadir createdAt/updatedAt
  }
);

export default Configuracion;