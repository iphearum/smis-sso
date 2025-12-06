import 'reflect-metadata';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import view from '@fastify/view';
import handlebars from 'handlebars';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('SMIS Auth Gateway')
    .setDescription('SSO and authorization APIs')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap auth gateway', error);
  process.exit(1);
});
