import { SmisAuthorization, SmisSession, SmisSsoConfig } from './types';

export const buildAuthUrl = (config: SmisSsoConfig): URL => {
  const probePath = config.probePath ?? '/sso/probe';
  return new URL(probePath, config.authBaseUrl);
};

export const fetchAuthorizations = async (
  config: SmisSsoConfig,
  session: SmisSession
): Promise<SmisAuthorization> => {
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

  return (await response.json()) as SmisAuthorization;
};
