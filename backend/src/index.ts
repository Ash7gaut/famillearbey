import app from './app.js';
import { env } from './config/env.js';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

app.listen(env.port, () => {
  console.log(`🌳 FamilyHub API — http://localhost:${env.port}`);
  console.log(`   Environnement : ${env.nodeEnv}`);
});
