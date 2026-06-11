import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

interface TipoOrganizacionAttributes {
  id: number;
  nombre: string;
  categoria: 'patronato' | 'junta_agua';
  vigencia_meses: number;
  activo: boolean;
}

class TipoOrganizacion extends Model<TipoOrganizacionAttributes> implements TipoOrganizacionAttributes {
  public id!: number;
  public nombre!: string;
  public categoria!: 'patronato' | 'junta_agua';
  public vigencia_meses!: number;
  public activo!: boolean;
}

TipoOrganizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    categoria: { type: DataTypes.ENUM('patronato', 'junta_agua'), allowNull: false },
    vigencia_meses: { type: DataTypes.INTEGER, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'tipos_organizacion',
    timestamps: false,
  }
);

export default TipoOrganizacion;