import { BadRequestException, Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ApplicationsService } from '../applications/applications.service';
import { AccessTokenPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('/api/sso')
export class AuthorizationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('/authorizations')
  @UseGuards(JwtAuthGuard)
  getAuthorizations(@Headers('x-smis-app-key') appKey: string, @Req() request: FastifyRequest): { roles: string[]; permissions: string[] } {
    const payload = (request as FastifyRequest & { user?: AccessTokenPayload }).user;
    if (!payload) {
      throw new BadRequestException('Missing access token context');
    }

    const requestedAppKey = appKey || payload.appKey;
    const application = this.applicationsService.requireApplication(requestedAppKey);
    if (payload.appKey !== application.key) {
      throw new BadRequestException('Token does not match requested application key');
    }

    return { roles: payload.roles, permissions: payload.permissions };
  }
}
