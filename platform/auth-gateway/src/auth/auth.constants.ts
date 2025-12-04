export const REFRESH_COOKIE_NAME = 'smis_refresh_token';
export const JWT_SECRET = process.env.JWT_SECRET ?? 'smis-jwt-secret';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
