import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.corsOrigin, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
