import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestión Comunitaria - Sistema Integral (FINAL)',
      version: '3.0.0',
      description: `
        Backend completo para la gestión de organizaciones comunitarias, directivas, usuarios,
        bitácora de auditoría, autorizaciones especiales de reelección y generación de certificados PDF.
        
        **Módulos incluidos:**
        - Autenticación y usuarios (JWT)
        - Catálogos (zonas, tipos de organización)
        - CRUD de organizaciones (con cálculo de vigencia y estados)
        - Gestión de directiva (asignar, renovar, desactivar miembros)
        - Control de reelección de presidentes con autorización especial
        - Bitácora de auditoría (registro de acciones con IP)
        - Certificaciones PDF (descarga automática)
        - Administración de usuarios por roles (Admin, Jefe Desarrollo, Técnico, Consulta)
        
        **Rutas protegidas** mediante autenticación JWT y autorización por roles.
      `,
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        xAuthToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-auth-token',
        },
      },
    },
    security: [{ bearerAuth: [] }, { xAuthToken: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export default swaggerJsdoc(options);