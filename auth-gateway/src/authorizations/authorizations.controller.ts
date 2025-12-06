import { BadRequestException, Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ApplicationsService } from '../applications/applications.service';
import { AccessTokenPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('/api/sso')
export class AuthorizationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService
  ) {}

  @Get('/authorizations')
  @UseGuards(JwtAuthGuard)
  async getAuthorizations(@Headers('x-smis-app-key') appKey: string, @Req() request: FastifyRequest): Promise<{ roles: string[]; permissions: string[] }> {
    const payload = (request as FastifyRequest & { user?: AccessTokenPayload }).user;
    if (!payload) {
      throw new BadRequestException('Missing access token context');
    }

    const requestedAppKey = appKey || payload.appKey;
    const application = await this.applicationsService.requireApplication(requestedAppKey);
    if (payload.appKey !== application.key) {
      throw new BadRequestException('Token does not match requested application key');
    }

    const rolePermissions = await this.usersService.getPermissionsForRoles(payload.roles ?? []);
    const flatPermissions = Array.from(new Set([...(payload.permissions ?? []), ...rolePermissions]));

    return { roles: payload.roles, permissions: flatPermissions };
  }

  @Get('/authorizations/context')
  @UseGuards(JwtAuthGuard)
  async getContext(@Req() request: FastifyRequest) {
    const payload = (request as FastifyRequest & { user?: AccessTokenPayload }).user;
    if (!payload) {
      throw new BadRequestException('Missing access token context');
    }
    const user = await this.usersService.getById(payload.sub);
    if (!user.employeeId) {
      return { employeeId: null, branches: [] };
    }
    const branches = await this.usersService.getBranchDepartmentAuthorizations(user.employeeId);
    return { employeeId: user.employeeId, branches };
  }
}
