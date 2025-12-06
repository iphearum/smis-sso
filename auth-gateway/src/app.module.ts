import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationsModule } from './authorizations/authorizations.module';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
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
