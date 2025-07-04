import { buildApp } from './app';

// Start server
async function start(): Promise<void> {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env['PORT'] || '3000', 10);
    const host = process.env['HOST'] || '0.0.0.0';

    await app.listen({ port, host });
    
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/health`);
    console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const gracefulShutdown = (signal: string): void => {
  console.log(`\n Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 