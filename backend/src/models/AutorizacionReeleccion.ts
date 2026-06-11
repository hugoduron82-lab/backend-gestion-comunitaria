import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface AutorizacionAttributes {
  id: number;
  dni: string;
  nombre_persona: string;
  id_organizacion: number;
  nombre_organizacion: string;
  categoria_org: 'patronato' | 'junta_agua';
  periodo_solicitado: number;
  justificacion: string;
  autorizado_por: number;
  fecha_autorizacion?: Date;
  activa: boolean;
}

class AutorizacionReeleccion extends Model<AutorizacionAttributes, Optional<AutorizacionAttributes, 'id' | 'fecha_autorizacion'>> implements AutorizacionAttributes {
  public id!: number;
  public dni!: string;
  public nombre_persona!: string;
  public id_organizacion!: number;
  public nombre_organizacion!: string;
  public categoria_org!: 'patronato' | 'junta_agua';
  public periodo_solicitado!: number;
  public justificacion!: string;
  public autorizado_por!: number;
  public fecha_autorizacion!: Date;
  public activa!: boolean;
}

AutorizacionReeleccion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dni: { type: DataTypes.STRING(15), allowNull: false },
    nombre_persona: { type: DataTypes.STRING(150), allowNull: false },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    nombre_organizacion: { type: DataTypes.STRING(200), allowNull: false },
    categoria_org: { type: DataTypes.ENUM('patronato', 'junta_agua'), allowNull: false },
    periodo_solicitado: { type: DataTypes.INTEGER, allowNull: false },
    justificacion: { type: DataTypes.TEXT, allowNull: false },
    autorizado_por: { type: DataTypes.INTEGER, allowNull: false },
    fecha_autorizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activa: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'autorizaciones_reeleccion',
    timestamps: false,
  }
);

export default AutorizacionReeleccion;