import { Router, Request, Response } from 'express';

const router = Router();

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'HealthFlow AI Backend API Gateway',
    version: '1.0.0',
    description: 'Production Healthcare Resource Intelligence Platform REST API. Predict. Prevent. Protect.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@healthflow.demo' },
                  password: { type: 'string', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated session with JWT token and safe user payload' },
          401: { description: 'Invalid credentials or inactive account' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get currently authenticated user profile',
        tags: ['Authentication'],
        responses: { 200: { description: 'Authenticated user profile' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Invalidate current user session',
        tags: ['Authentication'],
        responses: { 200: { description: 'Logged out successfully' } },
      },
    },
    '/auth/change-password': {
      post: {
        summary: 'Change password for authenticated user (mandatory on first login)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password updated successfully' } },
      },
    },
    '/users': {
      get: {
        summary: 'List users (Admin only)',
        tags: ['Users'],
        responses: { 200: { description: 'User roster' } },
      },
      post: {
        summary: 'Provision new employee account with HF-EMP ID (Admin only)',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'HOSPITAL_MANAGER', 'SUPPLY_MANAGER'] },
                  facilityId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Employee provisioned with one-time temporary password' } },
      },
    },
    '/facilities': {
      get: {
        summary: 'List facilities (filtered or all in scope)',
        tags: ['Facilities'],
        responses: { 200: { description: 'Facilities directory' } },
      },
      post: {
        summary: 'Register new facility (Admin only)',
        tags: ['Facilities'],
        responses: { 201: { description: 'Facility registered' } },
      },
    },
    '/facilities/{id}': {
      get: {
        summary: 'Get facility details (with facility isolation)',
        tags: ['Facilities'],
        responses: { 200: { description: 'Facility record' }, 403: { description: 'Facility access denied' } },
      },
    },
    '/resources': {
      get: {
        summary: 'Get medical resource catalog',
        tags: ['Resources'],
        responses: { 200: { description: 'Catalog items' } },
      },
    },
    '/inventory': {
      get: {
        summary: 'Get inventory records with dynamically calculated daysRemaining and riskLevel',
        tags: ['Inventory'],
        responses: { 200: { description: 'Calculated inventory records' } },
      },
    },
    '/inventory/update': {
      post: {
        summary: 'Update or upsert facility stock level',
        tags: ['Inventory'],
        responses: { 200: { description: 'Updated inventory record' } },
      },
    },
    '/patients/demand': {
      get: {
        summary: 'Get historical patient demand data',
        tags: ['Patient Demand'],
        responses: { 200: { description: 'Patient demand series' } },
      },
      post: {
        summary: 'Record daily patient demand for a facility',
        tags: ['Patient Demand'],
        responses: { 201: { description: 'Patient demand recorded' } },
      },
    },
    '/predictions': {
      get: {
        summary: 'Get generated predictions and stockout dates',
        tags: ['Predictions'],
        responses: { 200: { description: 'Prediction records' } },
      },
    },
    '/predictions/run': {
      post: {
        summary: 'Execute automated demand forecasting and stockout prediction pipeline',
        tags: ['Predictions'],
        responses: { 201: { description: 'Pipeline execution summary and persisted predictions' } },
      },
    },
    '/risks': {
      get: {
        summary: 'Evaluate real-time operational risk and clinical explanation across facilities',
        tags: ['Risks'],
        responses: { 200: { description: 'Evaluated risks with genuine explainable reasons' } },
      },
    },
    '/alerts': {
      get: {
        summary: 'List operational alerts (filters: severity, status, facilityId, type)',
        tags: ['Alerts'],
        responses: { 200: { description: 'Alert items' } },
      },
      post: {
        summary: 'Create operational alert',
        tags: ['Alerts'],
        responses: { 201: { description: 'Alert created' } },
      },
    },
    '/alerts/{id}/resolve': {
      patch: {
        summary: 'Resolve operational alert',
        tags: ['Alerts'],
        responses: { 200: { description: 'Alert resolved' } },
      },
    },
    '/transfers': {
      get: {
        summary: 'List inter-facility transfer requests',
        tags: ['Transfers'],
        responses: { 200: { description: 'Transfer records' } },
      },
      post: {
        summary: 'Create inter-facility resource transfer request',
        tags: ['Transfers'],
        responses: { 201: { description: 'Transfer requested' } },
      },
    },
    '/transfers/{id}/status': {
      patch: {
        summary: 'Transition transfer lifecycle status (state machine checked)',
        tags: ['Transfers'],
        responses: { 200: { description: 'Status updated and inventory reconciled upon delivery' } },
      },
    },
    '/recommendations/redistribution': {
      get: {
        summary: 'Dynamically calculate surplus-deficit pairs and recommended reallocations',
        tags: ['Recommendations'],
        responses: { 200: { description: 'Dynamic redistribution recommendations' } },
      },
    },
    '/reports/daily': {
      get: {
        summary: 'Get structured daily resource intelligence report',
        tags: ['Reports'],
        responses: { 200: { description: 'Daily operational report' } },
      },
    },
    '/reports/weekly': {
      get: {
        summary: 'Get structured weekly trend report',
        tags: ['Reports'],
        responses: { 200: { description: 'Weekly operational trend report' } },
      },
    },
    '/chat': {
      post: {
        summary: 'Interact with HealthFlow Panda grounded AI assistant',
        tags: ['Chat / Panda AI'],
        responses: { 200: { description: 'Panda response grounded in database metrics' } },
      },
    },
    '/audit': {
      get: {
        summary: 'List platform audit trail logs (Admin only)',
        tags: ['Audit'],
        responses: { 200: { description: 'Audit logs' } },
      },
    },
  },
};

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

router.get('/', (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>HealthFlow AI API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f8fafc; font-family: sans-serif; }
    .topbar { background-color: #0f766e !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

export default router;
