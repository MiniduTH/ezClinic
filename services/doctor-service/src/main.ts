import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  try {
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const path = req.path || req.originalUrl.split('?')[0];
    const isDocs = path.startsWith('/api/docs');
    const isAuthRoute =
      path.startsWith('/api/v1/auth/') ||
      path.startsWith('/api/v1/doctors/auth/');

    let isPublicDoctorRoute = false;
    if (req.method === 'GET' && path.startsWith('/api/v1/doctors')) {
      const subPath = path.replace('/api/v1/doctors', '');
      if (
        subPath === '' ||
        subPath === '/' ||
        (subPath.startsWith('/') &&
          !subPath.startsWith('/me') &&
          !subPath.includes('/appointments') &&
          !subPath.startsWith('/patients'))
      ) {
        isPublicDoctorRoute = true;
      }
    }

    if (isDocs || isPublicDoctorRoute || isAuthRoute) {
      next();
      return;
    }

    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing Authorization bearer token' });
      return;
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({ message: 'Missing Authorization bearer token' });
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    const exp = payload.exp;
    if (typeof exp === 'number' && Date.now() >= exp * 1000) {
      res.status(401).json({ message: 'Token has expired' });
      return;
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : 'unknown';
    req.user = payload;

    console.log(`[Auth] subject=${sub} path=${req.originalUrl}`);

    next();
  });

  // Serve uploaded credential files (auth middleware above still protects this path)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS for the Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('ezClinic – Doctor Management Service')
    .setDescription(
      'REST API for doctor profiles, availability scheduling, and digital prescriptions.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Doctor Service running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
