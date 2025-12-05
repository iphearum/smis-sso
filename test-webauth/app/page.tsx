'use client';

import { useCallback, useMemo, useState } from 'react';
import { SmisSsoClient, type SmisSession } from '@smis/sso-client';

const defaultBase = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:3000';
const defaultAppKey = process.env.NEXT_PUBLIC_APP_KEY || 'pp-demo-123456';

export default function Home() {
  const [authBaseUrl, setAuthBaseUrl] = useState(defaultBase);
  const [appKey, setAppKey] = useState(defaultAppKey);
  const [session, setSession] = useState<SmisSession | null>(null);
  const [authz, setAuthz] = useState<any>(null);
  const [contextAuthz, setContextAuthz] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const client = useMemo(() => new SmisSsoClient({ appKey, authBaseUrl }), [appKey, authBaseUrl]);

  const ensureSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const sess = await client.ensureSession();
      setSession(sess);
    } catch (e: any) {
      setError(e?.message || 'Failed to get session');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchAuthorizations = useCallback(async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const data = await client.loadAuthorizations(session);
      setAuthz(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load authorizations');
    } finally {
      setLoading(false);
    }
  }, [client, session]);

  const fetchContext = useCallback(async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${authBaseUrl}/api/sso/authorizations/context`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setContextAuthz(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load contextual authorizations');
    } finally {
      setLoading(false);
    }
  }, [authBaseUrl, session]);

  const logout = useCallback(async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      await fetch(`${authBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
      setSession(null);
      setAuthz(null);
      setContextAuthz(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  }, [authBaseUrl, session]);

  return (
    <main>
      <div className="card grid">
        <div>
          <h1>SMIS SSO Test Harness</h1>
          <p className="muted">Probe/login via popup, then fetch authorizations (flat + contextual).</p>
          <div style={{ marginTop: 20 }}>
            <label>Auth Base URL</label>
            <input value={authBaseUrl} onChange={(e) => setAuthBaseUrl(e.target.value)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>App Key</label>
            <input value={appKey} onChange={(e) => setAppKey(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={ensureSession} disabled={loading}>Probe / Login</button>
            <button onClick={fetchAuthorizations} disabled={!session || loading}>Load AuthZ</button>
            <button onClick={fetchContext} disabled={!session || loading}>Load Context</button>
            <button onClick={logout} disabled={!session || loading} style={{ background: '#f85149', color: '#fff' }}>Logout</button>
          </div>
          {error && <p style={{ color: '#f85149', marginTop: 14 }}>{error}</p>}
        </div>
        <div>
          <h2>Session</h2>
          <pre>{session ? JSON.stringify(session, null, 2) : 'No session yet'}</pre>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Flat authorizations</h2>
          <pre>{authz ? JSON.stringify(authz, null, 2) : 'Click Load AuthZ'}</pre>
        </div>
        <div className="card">
          <h2>Context authorizations</h2>
          <pre>{contextAuthz ? JSON.stringify(contextAuthz, null, 2) : 'Click Load Context'}</pre>
        </div>
      </div>
    </main>
  );
}
