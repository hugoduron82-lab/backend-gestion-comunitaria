import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface CertificacionAttributes {
  id: number;
  id_organizacion: number;
  numero_certificado: string;
  generado_por: number;
  fecha_generacion?: Date;
  ruta_archivo?: string;
  observaciones?: string;
}

class Certificacion extends Model<CertificacionAttributes, Optional<CertificacionAttributes, 'id' | 'fecha_generacion'>> implements CertificacionAttributes {
  public id!: number;
  public id_organizacion!: number;
  public numero_certificado!: string;
  public generado_por!: number;
  public fecha_generacion!: Date;
  public ruta_archivo!: string;
  public observaciones!: string;
}

Certificacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_organizacion: { type: DataTypes.INTEGER, allowNull: false },
    numero_certificado: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    generado_por: { type: DataTypes.INTEGER, allowNull: false },
    fecha_generacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ruta_archivo: DataTypes.STRING(255),
    observaciones: DataTypes.STRING(255),
  },
  {
    sequelize,
    tableName: 'certificaciones',
    timestamps: false,
  }
);

export default Certificacion;