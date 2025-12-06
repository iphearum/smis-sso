import { BadRequestException, Controller, Get, Query, Req, Res } from '@nestjs/common';
import '@fastify/cookie';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationsService } from '../applications/applications.service';
import { AuthService } from '../auth/auth.service';
import { REFRESH_COOKIE_NAME } from '../auth/auth.constants';

type ViewReply = FastifyReply & { view: (template: string, data?: Record<string, any>) => void };

@Controller()
export class SessionsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly authService: AuthService
  ) {}

  @Get('/sso/probe')
  async probe(@Query('appKey') appKey: string, @Req() request: FastifyRequest, @Res() reply: ViewReply): Promise<void> {
    if (!appKey) {
      throw new BadRequestException('Missing appKey');
    }

    this.applicationsService.requireApplication(appKey);
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      this.renderLogin(reply, appKey);
      return;
    }

    try {
      const session = await this.authService.issueSessionFromRefreshToken(refreshToken, appKey);
      this.renderProbe(reply, session.accessToken, session.refreshToken, session.expiresAt);
    } catch (error) {
      this.renderLogin(reply, appKey);
    }
  }

  private renderProbe(reply: ViewReply, accessToken: string, refreshToken: string, expiresAt: string): void {
    reply.view('probe', {
      payload: {
        accessToken,
        refreshToken,
        expiresAt
      }
    });
  }

  private renderLogin(reply: ViewReply, appKey: string): void {
    reply.view('login', { appKey });
  }
}
