import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenStore } from './refresh-token.store';

@Module({
  imports: [ApplicationsModule, UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenStore, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard]
})
export class AuthModule {}
