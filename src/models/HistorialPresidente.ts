import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

// Atributos de la tabla
interface HistorialPresidenteAttributes {
  id: number;
  dni: string;
  nombre_completo: string;
  id_organizacion: number;
  nombre_organizacion: string;
  categoria_org: 'patronato' | 'junta_agua';
  fecha_inicio: Date;
  fecha_fin?: Date;
  periodo_numero: number;
  autorizado_por?: number;
  registrado_por: number;
  creado_en?: Date;
}

// Atributos para crear (id es autoincremental, otros opcionales)
interface HistorialPresidenteCreationAttributes extends Optional<HistorialPresidenteAttributes, 'id' | 'fecha_fin' | 'autorizado_por' | 'creado_en'> {}

class HistorialPresidente extends Model<HistorialPresidenteAttributes, HistorialPresidenteCreationAttributes> implements HistorialPresidenteAttributes {
  public id!: number;
  public dni!: string;
  public nombre_completo!: string;
  public id_organizacion!: number;
  public nombre_organizacion!: string;
  public categoria_org!: 'patronato' | 'junta_agua';
  public fecha_inicio!: Date;
  public fecha_fin!: Date;
  public periodo_numero!: number;
  public autorizado_por!: number;
  public registrado_por!: number;
  public readonly creado_en!: Date;
}

HistorialPresidente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dni: { type: DataTypes.STRING(15), allowNull: false },
    nombre_completo: { type: DataTypes.STRING(150), allowNull: false },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    nombre_organizacion: { type: DataTypes.STRING(200), allowNull: false },
    categoria_org: { type: DataTypes.ENUM('patronato', 'junta_agua'), allowNull: false },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull: true },
    periodo_numero: { type: DataTypes.INTEGER, allowNull: false },
    autorizado_por: { type: DataTypes.INTEGER, allowNull: true },
    registrado_por: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'historial_presidentes',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
  }
);

export default HistorialPresidente;