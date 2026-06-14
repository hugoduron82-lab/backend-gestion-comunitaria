import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface BitacoraAttributes {
  id: number;
  id_usuario: number;
  tabla_afectada: string;
  id_registro?: number | null;
  accion: 'CREAR' | 'EDITAR' | 'DESACTIVAR' | 'REACTIVAR' | 'RENOVAR' | 'GENERAR_PDF' | 'LOGIN' | 'LOGOUT' | 'CAMBIO_DIRECTIVA' | 'AUTORIZACION_REELECCION' | 'RECHAZO_VALIDACION';
  detalle?: string;
  ip_origen?: string;
  creado_en?: Date;
}

interface BitacoraCreationAttributes extends Optional<BitacoraAttributes, 'id' | 'id_registro' | 'detalle' | 'ip_origen' | 'creado_en'> {}

class Bitacora extends Model<BitacoraAttributes, BitacoraCreationAttributes> implements BitacoraAttributes {
  public id!: number;
  public id_usuario!: number;
  public tabla_afectada!: string;
  public id_registro!: number | null;
  public accion!: BitacoraAttributes['accion'];
  public detalle!: string;
  public ip_origen!: string;
  public creado_en!: Date;
}

Bitacora.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    tabla_afectada: { type: DataTypes.STRING(60), allowNull: false },
    id_registro: { type: DataTypes.INTEGER, allowNull: true },
    accion: { type: DataTypes.ENUM('CREAR','EDITAR','DESACTIVAR','REACTIVAR','RENOVAR','GENERAR_PDF','LOGIN','LOGOUT','CAMBIO_DIRECTIVA','AUTORIZACION_REELECCION','RECHAZO_VALIDACION'), allowNull: false },
    detalle: DataTypes.TEXT,
    ip_origen: DataTypes.STRING(45),
  },
  {
    sequelize,
    tableName: 'bitacora',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
  }
);

export default Bitacora;