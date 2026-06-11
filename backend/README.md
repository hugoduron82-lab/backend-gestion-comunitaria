# Backend - Sistema de Gestión Comunitaria

Backend desarrollado en **Node.js + TypeScript + Express + Sequelize (MySQL)** para la gestión de organizaciones comunitarias, directivas, usuarios, bitácora de auditoría, autorizaciones especiales y generación de certificados PDF.

## 🚀 Tecnologías utilizadas

- Node.js (v18+)
- TypeScript
- Express.js
- Sequelize (ORM)
- MySQL
- JWT (autenticación)
- bcrypt (hash de contraseñas)
- Swagger UI (documentación interactiva)
- PDFKit (generación de certificados)

## 📋 Requisitos previos

- Node.js instalado (v18 o superior)
- MySQL instalado y en ejecución
- Git (opcional, para clonar)

## 🔧 Instalación y configuración

1. **Clonar el repositorio**  
   ```bash
   git clone https://github.com/hugoduron82-lab/backend-gestion-comunitaria
   cd backend-gestion-comunitaria

2. **Instalar dependencias**

   ```bash
   npm install

3. **Configurar variables de entorno**
   Copia el archivo .env.example a .env y completa los valores:
   ```bash
   cp .env.example .env
   Edita .env con tus credenciales de MySQL y la clave JWT.

4. **Crear la base de datos**
   Ejecuta el script gestion_desa.sql (incluido en el repositorio) en tu MySQL:
   ```bash
   mysql -u root -p < gestion_desa.sql

5. **Ejecutar el servidor**
   Modo desarrollo (con recarga automática):
   ```bash
   npm run dev

6. **Acceder a la documentación Swagger**
   Abre en tu navegador: http://localhost:3000/api-docs

## 📦 Dependencias principales

- `express` – Servidor web
- `sequelize` + `mysql2` – ORM para MySQL
- `jsonwebtoken` + `bcrypt` – Autenticación JWT y hasheo de contraseñas
- `pdfkit` – Generación de certificados PDF
- `swagger-ui-express` + `swagger-jsdoc` – Documentación interactiva
- `typescript` – Tipado estático
- `nodemon` + `ts-node` – Desarrollo en caliente

## 🛠️ Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor con recarga automática (modo desarrollo) |
| `npm run build` | Compila TypeScript a JavaScript en la carpeta `dist` |
| `npm start` | Ejecuta la versión compilada (requiere `npm run build` primero) |

## 🤝 Cómo contribuir (trabajo en equipo)

1. Clona el repositorio y crea una rama desde `develop`
2. Instala dependencias y configura `.env`
3. Realiza tus cambios en una rama `feature/nombre`
4. Sube la rama y abre un Pull Request hacia `develop`
5. Espera la revisión de al menos un compañero antes de fusionar

## 📄 Licencia

Proyecto académico – uso interno para la clase de Desarrollo Web II.

## ✉️ Contacto

Equipo de desarrollo: [nombres o correos de los 4 integrantes]


## Roles y permisos

| Rol | ID | Descripción | Acciones permitidas |
|-----|----|-------------|---------------------|
| Administrador | 1 | Acceso total al sistema | Todas las acciones |
| Jefe de Desarrollo | 2 | Puede gestionar organizaciones y directiva, autorizar reelecciones, ver bitácora | CRUD de organizaciones y directiva; crear autorizaciones; ver bitácora; NO usuarios |
| Técnico | 3 | Puede gestionar organizaciones y directiva, pero no autorizaciones especiales ni bitácora | CRUD de organizaciones y directiva; generar certificados |
| Consulta | 4 | Solo lectura y generación de certificados | GET en organizaciones, directiva; generar PDF |

## 📌 Endpoints principales
La documentación completa está disponible en Swagger. Algunos endpoints clave:

Autenticación

POST /auth/login – Iniciar sesión (devuelve JWT)

GET /auth/profile – Perfil del usuario autenticado

Organizaciones (CRUD)

GET /organizaciones – Listar con filtros

POST /organizaciones – Crear (roles 1,2,3)

PUT /organizaciones/{id} – Actualizar (roles 1,2,3)

DELETE /organizaciones/{id} – Desactivar (roles 1,2,3)

Directiva

GET /directiva/organizacion/{id} – Listar miembros activos

POST /directiva/miembros – Asignar miembro (roles 1,2,3)

POST /directiva/renovar – Renovar directiva completa (roles 1,2,3)

DELETE /directiva/miembros/{id} – Desactivar miembro (roles 1,2,3)

Usuarios (solo roles 1 y 2)

GET /usuarios – Listar usuarios

POST /usuarios – Crear usuario

PUT /usuarios/{id} – Actualizar

PUT /usuarios/{id}/desactivar – Desactivar

PUT /usuarios/{id}/reactivar – Reactivar

Autorizaciones especiales (solo rol 2)

POST /autorizaciones – Crear autorización para reelección de presidente

GET /autorizaciones – Listar autorizaciones activas

Bitácora (solo roles 1 y 2)

GET /bitacora – Consultar auditoría (con filtros)

Certificaciones PDF

GET /certificaciones/organizacion/{id} – Generar y descargar certificado de vigencia

Catálogos públicos

GET /catalogos/zonas

GET /catalogos/tipos-organizacion

## Estructura del proyecto 

   ```bash
      backend/
      ├── src/
      │   ├── config/
      │   │   ├── db.ts
      │   │   └── env.ts
      │   ├── controllers/
      │   │   ├── authController.ts
      │   │   ├── autorizacionController.ts
      │   │   ├── bitacoraController.ts
      │   │   ├── catalogoController.ts
      │   │   ├── certificacionController.ts
      │   │   ├── directivaController.ts
      │   │   ├── organizacionController.ts
      │   │   └── usuarioController.ts
      │   ├── middleware/
      │   │   ├── auth.ts
      │   │   └── authorize.ts
      │   ├── models/
      │   │   ├── AutorizacionReeleccion.ts
      │   │   ├── Bitacora.ts
      │   │   ├── CargoDirectiva.ts
      │   │   ├── Certificacion.ts
      │   │   ├── Configuracion.ts
      │   │   ├── DirectivaMiembro.ts
      │   │   ├── HistorialPresidente.ts
      │   │   ├── Organizacion.ts
      │   │   ├── Rol.ts
      │   │   ├── TipoOrganizacion.ts
      │   │   ├── Usuario.ts
      │   │   └── Zona.ts
      │   ├── routes/
      │   │   ├── authRoutes.ts
      │   │   ├── autorizacionRoutes.ts
      │   │   ├── bitacoraRoutes.ts
      │   │   ├── catalogoRoutes.ts
      │   │   ├── certificacionRoutes.ts
      │   │   ├── directivaRoutes.ts
      │   │   ├── organizacionRoutes.ts
      │   │   └── usuarioRoutes.ts
      │   ├── services/
      │   │   └── loggerService.ts
      │   ├── swagger.ts
      │   └── index.ts
      ├── .env.example
      ├── .gitignore
      ├── gestion_desa.sql
      ├── package.json
      ├── tsconfig.json
      └── README.md

