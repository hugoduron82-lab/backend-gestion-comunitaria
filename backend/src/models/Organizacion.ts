import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface OrganizacionAttributes {
  id: number;
  nombre: string;
  id_tipo: number;
  id_zona: number;
  colonia_sector?: string;
  tomo?: string;
  folio?: string;
  fecha_inscripcion: Date;
  fecha_vencimiento: Date;
  total_directiva: number;
  estado: 'activa' | 'proxima_vencer' | 'vencida' | 'inactiva';
  observaciones?: string;
  registrado_por: number;
  creado_en?: Date;
  actualizado_en?: Date;
}

interface OrganizacionCreationAttributes extends Optional<OrganizacionAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Organizacion extends Model<OrganizacionAttributes, OrganizacionCreationAttributes> implements OrganizacionAttributes {
  public id!: number;
  public nombre!: string;
  public id_tipo!: number;
  public id_zona!: number;
  public colonia_sector!: string;
  public tomo!: string;
  public folio!: string;
  public fecha_inscripcion!: Date;
  public fecha_vencimiento!: Date;
  public total_directiva!: number;
  public estado!: 'activa' | 'proxima_vencer' | 'vencida' | 'inactiva';
  public observaciones!: string;
  public registrado_por!: number;
  public readonly creado_en!: Date;
  public readonly actualizado_en!: Date;
}

Organizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(200), allowNull: false },
    id_tipo: { type: DataTypes.INTEGER, allowNull: false },
    id_zona: { type: DataTypes.INTEGER, allowNull: false },
    colonia_sector: DataTypes.STRING(150),
    tomo: DataTypes.STRING(20),
    folio: DataTypes.STRING(20),
    fecha_inscripcion: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    total_directiva: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 7, validate: { isIn: [[7, 9]] } },
    estado: { type: DataTypes.ENUM('activa', 'proxima_vencer', 'vencida', 'inactiva'), defaultValue: 'activa' },
    observaciones: DataTypes.TEXT,
    registrado_por: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'organizaciones',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
  }
);

export default Organizacion;