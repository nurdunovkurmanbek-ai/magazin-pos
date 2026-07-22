import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { globalRateLimiter } from './middleware/rate-limit';

export function createApp(): express.Application {
  const app = express();

  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProduction ? undefined : false,
    })
  );

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  app.use(globalRateLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  if (env.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  app.use(env.apiPrefix, apiRoutes);

  if (env.serveFrontend && fs.existsSync(env.frontendDist)) {
    app.use(express.static(env.frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith(env.apiPrefix) || req.path.startsWith('/uploads')) {
        next();
        return;
      }
      res.sendFile(path.join(env.frontendDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
