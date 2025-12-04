import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import '@fastify/cookie';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';

class LoginDto {
  username!: string;
  password!: string;
  appKey!: string;
}

class RefreshDto {
  appKey?: string;
  refreshToken?: string;
}

class LogoutDto {
  refreshToken?: string;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/auth/login')
  async login(@Body() body: LoginDto, @Res() reply: FastifyReply): Promise<void> {
    const session = await this.authService.login(body.username, body.password, body.appKey);
    this.attachRefreshCookie(reply, session.refreshToken);
    reply.send(session);
  }

  @Post('/auth/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshDto, @Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const refreshToken = body.refreshToken ?? request.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      reply.status(HttpStatus.UNAUTHORIZED).send({ message: 'Missing refresh token' });
      return;
    }

    const session = await this.authService.refresh(refreshToken, body.appKey);
    this.attachRefreshCookie(reply, session.refreshToken);
    reply.send(session);
  }

  @Post('/auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: LogoutDto, @Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const refreshToken = body.refreshToken ?? request.cookies?.[REFRESH_COOKIE_NAME];
    this.authService.logout(refreshToken);
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    reply.send({ success: true });
  }

  private attachRefreshCookie(reply: FastifyReply, refreshToken: string): void {
    reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    });
  }
}
