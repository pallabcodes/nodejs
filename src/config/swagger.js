import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartVault API Documentation',
      version: '1.0.0',
      description: 'API documentation for SmartVault application',
      contact: {
        name: 'API Support',
        email: 'support@smartvault.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/modules/*/routes/*.js',
    './src/modules/*/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export const swaggerMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SmartVault API Documentation'
  })
];

export default specs;