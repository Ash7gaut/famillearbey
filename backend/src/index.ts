import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`🌳 FamilyHub API — http://localhost:${env.port}`);
  console.log(`   Environnement : ${env.nodeEnv}`);
});
