import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApplicationsService } from '../applications/applications.service';
import { UserProfile, UsersService } from '../users/users.service';
import { ACCESS_TOKEN_TTL_SECONDS, JWT_SECRET, REFRESH_COOKIE_NAME } from './auth.constants';
import { AccessTokenPayload, SessionTokens } from './auth.types';
import { RefreshTokenStore } from './refresh-token.store';

@Injectable()
export class AuthService {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenStore: RefreshTokenStore
  ) {}

  async login(username: string, password: string, appKey: string): Promise<SessionTokens> {
    const app = this.applicationsService.requireApplication(appKey);
    const user = await this.usersService.validateCredentials(username, password);
    return this.issueSession(user, app.key);
  }

  async issueSessionFromRefreshToken(refreshToken: string, appKey: string): Promise<SessionTokens> {
    const record = this.refreshTokenStore.get(refreshToken);
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const app = this.applicationsService.requireApplication(appKey);
    const user = await this.usersService.getById(record.userId);
    return this.issueSession(user, app.key, refreshToken);
  }

  async refresh(refreshToken: string, appKey?: string): Promise<SessionTokens> {
    const record = this.refreshTokenStore.get(refreshToken);
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const resolvedAppKey = appKey ?? record.appKey;
    const app = this.applicationsService.requireApplication(resolvedAppKey);
    const user = await this.usersService.getById(record.userId);
    return this.issueSession(user, app.key, refreshToken);
  }

  logout(refreshToken?: string): void {
    if (refreshToken) {
      this.refreshTokenStore.revoke(refreshToken);
    }
  }

  getRefreshCookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  private async issueSession(user: UserProfile, appKey: string, refreshToken?: string): Promise<SessionTokens> {
    const app = this.applicationsService.requireApplication(appKey);
    const { roles, permissions } = await this.usersService.resolveAuthorizations(user, app);
    const userId = String(user.id);
    const accessToken = await this.createAccessToken({
      sub: userId,
      username: user.username,
      appKey: app.key,
      roles,
      permissions
    });

    const refresh = refreshToken ?? this.refreshTokenStore.generate(userId, app.key);
    this.refreshTokenStore.touch(refresh, userId, app.key);

    return {
      accessToken: accessToken.token,
      refreshToken: refresh,
      expiresAt: accessToken.expiresAt
    };
  }

  private async createAccessToken(payload: AccessTokenPayload): Promise<{ token: string; expiresAt: string }> {
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
    const token = await this.jwtService.signAsync(payload, {
      secret: JWT_SECRET,
      expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`
    });
    return { token, expiresAt };
  }
}
