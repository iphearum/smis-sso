import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AccessTokenPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: FastifyRequest) {
    const payload = (request as FastifyRequest & { user?: AccessTokenPayload }).user;
    if (!payload) return null;
    const user = this.usersService.getById(payload.sub);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      employeeId: user.employeeId,
      email: user.email,
      phone: user.phone
    };
  }
}
