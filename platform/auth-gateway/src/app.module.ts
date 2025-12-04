import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationsModule } from './authorizations/authorizations.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ApplicationsModule, UsersModule, AuthModule, SessionsModule, AuthorizationsModule]
})
export class AppModule {}
