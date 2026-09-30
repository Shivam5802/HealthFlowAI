import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './repositories/prisma.js';
import { bootstrapDatabaseIfNeeded } from './utils/bootstrap.js';

const app = createApp();

const server = app.listen(config.port, async () => {
  console.log(`=========================================`);
  console.log(`HEALTHFLOW AI - Backend Service`);
  console.log(`"Predict. Prevent. Protect."`);
  console.log(`=========================================`);
  console.log(`Environment: ${config.env}`);
  console.log(`Listening on: http://localhost:${config.port}`);
  console.log(`API Base:    http://localhost:${config.port}/api`);
  console.log(`Healthcheck: http://localhost:${config.port}/api/health`);
  console.log(`=========================================`);

  // Auto-populate demo users and baseline data if database is empty
  await bootstrapDatabaseIfNeeded();
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
export default app;
