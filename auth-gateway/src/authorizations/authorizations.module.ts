import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AuthorizationsController } from './authorizations.controller';

@Module({
  imports: [ApplicationsModule, AuthModule, UsersModule],
  controllers: [AuthorizationsController]
})
export class AuthorizationsModule {}
