import { Authorization, ContextAuthorization, Session, Config } from './types';

export const buildAuthUrl = (config: Config): URL => {
  const probePath = config.probePath ?? '/sso/probe';
  return new URL(probePath, config.authBaseUrl);
};

export const fetchAuthorizations = async (
  config: Config,
  session: Session
): Promise<Authorization> => {
  const authUrl = new URL('/api/sso/authorizations', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(authUrl.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'X-SMIS-APP-KEY': config.appKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load authorizations (${response.status})`);
  }

  return (await response.json()) as Authorization;
};

export const fetchContextAuthorizations = async (
  config: Config,
  session: Session
): Promise<ContextAuthorization> => {
  const url = new URL('/api/sso/authorizations/context', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load contextual authorizations (${response.status})`);
  }

  return (await response.json()) as ContextAuthorization;
};

export const logoutSession = async (config: Config, session?: Session): Promise<void> => {
  if (!session?.refreshToken) return;
  const url = new URL('/auth/logout', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  try {
    await fetchImpl(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
  } catch (error) {
    // Swallow network errors; signOut should still proceed locally.
  }
};
