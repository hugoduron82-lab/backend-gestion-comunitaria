import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface RenovacionAttributes {
  id: number;
  id_organizacion: number;
  fecha_renovacion: Date;
  fecha_vencimiento_ant: Date;
  fecha_vencimiento_nueva: Date;
  tomo_nuevo?: string;
  folio_nuevo?: string;
  observaciones?: string;
  registrado_por: number;
  creado_en?: Date;
}

interface RenovacionCreationAttributes extends Optional<RenovacionAttributes, 'id' | 'tomo_nuevo' | 'folio_nuevo' | 'observaciones' | 'creado_en'> {}

class Renovacion extends Model<RenovacionAttributes, RenovacionCreationAttributes> implements RenovacionAttributes {
  public id!: number;
  public id_organizacion!: number;
  public fecha_renovacion!: Date;
  public fecha_vencimiento_ant!: Date;
  public fecha_vencimiento_nueva!: Date;
  public tomo_nuevo!: string;
  public folio_nuevo!: string;
  public observaciones!: string;
  public registrado_por!: number;
  public readonly creado_en!: Date;
}

Renovacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    fecha_renovacion: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_vencimiento_ant: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_vencimiento_nueva: { type: DataTypes.DATEONLY, allowNull: false },
    tomo_nuevo: DataTypes.STRING(20),
    folio_nuevo: DataTypes.STRING(20),
    observaciones: DataTypes.TEXT,
    registrado_por: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'renovaciones',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
  }
);

export default Renovacion;