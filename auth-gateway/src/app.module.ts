import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationsModule } from './authorizations/authorizations.module';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';
import { Application } from './applications/application.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'apps',
      type: 'sqlite',
      database: process.env.APPS_DB_PATH ?? join(process.cwd(), 'apps.sqlite'),
      entities: [Application],
      synchronize: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/static'
    }),
    DatabaseModule,
    ApplicationsModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    AuthorizationsModule
  ]
})
export class AppModule {}
