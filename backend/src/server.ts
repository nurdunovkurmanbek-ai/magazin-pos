import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startBackupScheduler } from './modules/backup/backup.scheduler';

/**
 * Серверди иштетүү
 */
async function bootstrap(): Promise<void> {
  try {
    // База менен байланыш
    await connectDatabase();
    console.log('✅ PostgreSQL базасына туташылды');

    const app = createApp();

    const server = app.listen(env.port, () => {
      console.log(`🚀 Сервер иштеп жатат: http://localhost:${env.port}`);
      console.log(`📡 API: http://localhost:${env.port}${env.apiPrefix}`);
      console.log(`🔧 Режим: ${env.nodeEnv}`);
      startBackupScheduler();
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} алынды, сервер токтотулууда...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('✅ Сервер токтотулду');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Сервер иштетүүдө ката:', error);
    if (error instanceof Error && error.message.includes('database')) {
      console.error('');
      console.error('📌 PostgreSQL иштебейт. Төмөнкүлөрдү кылыңыз:');
      console.error('   1. Docker Desktop иштетиңиз');
      console.error('   2. docker compose up -d');
      console.error('   3. npm run db:push --prefix backend');
      console.error('');
    }
    process.exit(1);
  }
}

bootstrap();
