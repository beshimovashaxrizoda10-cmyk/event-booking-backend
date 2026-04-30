const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Booking System API',
      version: '1.0.0',
      description: 'Event booking system with authentication, roles, events and bookings',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // routes va modellardan izohlar o‘qiladi
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;