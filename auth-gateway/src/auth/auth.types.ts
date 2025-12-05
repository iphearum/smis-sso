export interface AccessTokenPayload {
  sub: string;
  username: string;
  appKey: string;
  roles: string[];
  permissions: string[];
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
