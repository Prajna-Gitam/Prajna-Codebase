import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth/auth.router.js';

const app = express();
com.huhygwyguywi

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
      traceId: crypto.randomUUID(),
    },
  });
});

export default app;
