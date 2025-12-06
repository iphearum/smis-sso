import 'reflect-metadata';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import view from '@fastify/view';
import handlebars from 'handlebars';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Register Handlebars view engine for server-rendered HTML templates
  handlebars.registerHelper('json', (value: unknown) => new handlebars.SafeString(JSON.stringify(value)));
  await app.register(view as any, {
    engine: { handlebars },
    root: join(__dirname, 'templates'),
    viewExt: 'hbs'
  });

  // Casting avoids Fastify/Nest type mismatch for cookie plugin decorations
  await app.register(cookie as any, {
    secret: process.env.COOKIE_SECRET ?? 'smis-cookie-secret',
    parseOptions: {
      sameSite: 'lax',
      httpOnly: true
    }
  });

  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap auth gateway', error);
  process.exit(1);
});
