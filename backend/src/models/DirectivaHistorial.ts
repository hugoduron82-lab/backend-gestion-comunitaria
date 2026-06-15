import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface DirectivaHistorialAttributes {
  id: number;
  id_organizacion: number;
  id_cargo: number;
  nombre_completo: string;
  dni?: string;
  telefono_personal?: string;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  motivo_cambio?: string;
  registrado_por: number;
  creado_en?: Date;
}

interface DirectivaHistorialCreationAttributes extends Optional<DirectivaHistorialAttributes, 'id' | 'dni' | 'telefono_personal' | 'fecha_inicio' | 'fecha_fin' | 'motivo_cambio' | 'creado_en'> {}

class DirectivaHistorial extends Model<DirectivaHistorialAttributes, DirectivaHistorialCreationAttributes> implements DirectivaHistorialAttributes {
  public id!: number;
  public id_organizacion!: number;
  public id_cargo!: number;
  public nombre_completo!: string;
  public dni!: string;
  public telefono_personal!: string;
  public fecha_inicio!: Date;
  public fecha_fin!: Date;
  public motivo_cambio!: string;
  public registrado_por!: number;
  public readonly creado_en!: Date;
}

DirectivaHistorial.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    id_cargo: { type: DataTypes.INTEGER, allowNull: false },
    nombre_completo: { type: DataTypes.STRING(150), allowNull: false },
    dni: DataTypes.STRING(15),
    telefono_personal: DataTypes.STRING(15),
    fecha_inicio: DataTypes.DATEONLY,
    fecha_fin: DataTypes.DATEONLY,
    motivo_cambio: DataTypes.STRING(255),
    registrado_por: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'directiva_historial',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
  }
);

export default DirectivaHistorial;