import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';
import bcrypt from 'bcrypt';

interface UsuarioAttributes {
  id: number;
  id_empleado: number;
  correo: string;
  password_hash: string;
  id_rol: number;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
}

interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public id_empleado!: number;
  public correo!: string;
  public password_hash!: string;
  public id_rol!: number;
  public activo!: boolean;
  public readonly creado_en!: Date;
  public readonly actualizado_en!: Date;

  public async validarPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    correo: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    id_rol: { type: DataTypes.INTEGER, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    hooks: {
      beforeCreate: async (user: Usuario) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async (user: Usuario) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
    },
  }
);

export default Usuario;