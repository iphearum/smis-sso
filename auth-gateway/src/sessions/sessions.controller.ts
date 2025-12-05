import { BadRequestException, Controller, Get, Query, Req, Res } from '@nestjs/common';
import '@fastify/cookie';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationsService } from '../applications/applications.service';
import { AuthService } from '../auth/auth.service';
import { REFRESH_COOKIE_NAME } from '../auth/auth.constants';

@Controller()
export class SessionsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly authService: AuthService
  ) {}

  @Get('/sso/probe')
  async probe(@Query('appKey') appKey: string, @Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
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

  private renderProbe(reply: FastifyReply, accessToken: string, refreshToken: string, expiresAt: string): void {
    reply.header('Content-Type', 'text/html');
    reply.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>SMIS SSO Probe</title>
  </head>
  <body>
    <script>
      const payload = {
        accessToken: ${JSON.stringify(accessToken)},
        refreshToken: ${JSON.stringify(refreshToken)},
        expiresAt: ${JSON.stringify(expiresAt)}
      };
      const message = { type: 'smis:sso:session', payload };
      // Use wildcard target to allow cross-origin opener; client should validate origin on receipt.
      window.opener?.postMessage(message, '*');
      window.close();
    </script>
  </body>
</html>`);
  }

  private renderLogin(reply: FastifyReply, appKey: string): void {
    reply.header('Content-Type', 'text/html');
    reply.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign in to SMIS</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      form { display: flex; flex-direction: column; gap: 12px; max-width: 320px; }
      input { padding: 8px; }
      button { padding: 10px; cursor: pointer; }
      .error { color: #b71c1c; margin-top: 8px; }
    </style>
  </head>
  <body>
    <h1>Sign in</h1>
    <p>Enter your SMIS credentials to continue to the requested application.</p>
    <form id="login-form">
      <input type="text" name="username" placeholder="Username" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Sign in</button>
      <div id="error" class="error" aria-live="polite"></div>
    </form>
    <script>
      const form = document.getElementById('login-form');
      const errorBox = document.getElementById('error');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorBox.textContent = '';
        const data = new FormData(form);
        const payload = {
          username: data.get('username'),
          password: data.get('password'),
          appKey: ${JSON.stringify(appKey)}
        };
        try {
          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || 'Unable to sign in');
          }
          const session = await response.json();
          const message = { type: 'smis:sso:session', payload: session };
          window.opener?.postMessage(message, '*');
          window.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to sign in';
          errorBox.textContent = message;
        }
      });
    </script>
  </body>
</html>`);
  }
}
