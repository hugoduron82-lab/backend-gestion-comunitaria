import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

// Atributos de la tabla
interface DirectivaMiembroAttributes {
  id: number;
  id_organizacion: number;
  id_cargo: number;
  nombre_completo: string;
  dni: string;
  telefono_personal?: string;
  telefono_alternativo?: string;
  activo: boolean;
  fecha_inicio?: Date;
  id_autorizacion_reeleccion?: number | null;
}

// Atributos para crear (id es autoincremental, otros opcionales)
interface DirectivaMiembroCreationAttributes extends Optional<DirectivaMiembroAttributes, 'id' | 'telefono_personal' | 'telefono_alternativo' | 'fecha_inicio' | 'id_autorizacion_reeleccion'> {}

class DirectivaMiembro extends Model<DirectivaMiembroAttributes, DirectivaMiembroCreationAttributes> implements DirectivaMiembroAttributes {
  public id!: number;
  public id_organizacion!: number;
  public id_cargo!: number;
  public nombre_completo!: string;
  public dni!: string;
  public telefono_personal!: string;
  public telefono_alternativo!: string;
  public activo!: boolean;
  public fecha_inicio!: Date;
  public id_autorizacion_reeleccion!: number | null;
}

DirectivaMiembro.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    id_cargo: { type: DataTypes.INTEGER, allowNull: false },
    nombre_completo: { type: DataTypes.STRING(150), allowNull: false },
    dni: { type: DataTypes.STRING(15), allowNull: false },
    telefono_personal: DataTypes.STRING(15),
    telefono_alternativo: DataTypes.STRING(15),
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_inicio: DataTypes.DATEONLY,
    id_autorizacion_reeleccion: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'directiva_miembros',
    timestamps: false,
  }
);

export default DirectivaMiembro;