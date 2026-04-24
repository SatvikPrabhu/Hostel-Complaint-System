const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HostelCare API',
      version: '1.0.0',
      description: 'API documentation for Hostel Complaint Management System',
      contact: {
        name: 'API Support',
        email: 'support@hostelcare.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['student', 'worker', 'admin', 'supervisor'] },
            student_id: { type: 'string' },
            hostel_block: { type: 'string' },
            room_number: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        Complaint: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            category: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['review_board', 'pending', 'assigned', 'in_progress', 'completed', 'rejected'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            student_id: { type: 'integer' },
            worker_id: { type: 'integer' },
            hostel_block: { type: 'string' },
            room_number: { type: 'string' },
            media_path: { type: 'string' },
            deadline: { type: 'string', format: 'date' },
            support_count: { type: 'integer' },
            feedback_rating: { type: 'integer' },
            feedback_comments: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            complaint_id: { type: 'integer' },
            type: { type: 'string', enum: ['task_assigned', 'task_completed', 'new_complaint'] },
            message: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      },
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../index.js'),
    path.join(__dirname, '../routes/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
