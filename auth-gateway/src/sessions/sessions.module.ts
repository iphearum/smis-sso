import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [ApplicationsModule, AuthModule],
  controllers: [SessionsController]
})
export class SessionsModule {}
