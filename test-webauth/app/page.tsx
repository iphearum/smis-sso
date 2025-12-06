'use client';

import { useCallback, useMemo, useState } from 'react';
import { SmisSsoClient, type SmisSession } from '@smis/sso-client';

const defaultBase = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:3000';
const defaultAppKey = process.env.NEXT_PUBLIC_APP_KEY || 'pp-demo-123456';
const STORAGE_KEY = 'smis-demo:sessions';

type StoredSession = {
  session: SmisSession;
  username?: string;
  appKey?: string;
};

const decodeJwt = (token: string): any | null => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof window !== 'undefined' ? window.atob(normalized) : Buffer.from(normalized, 'base64').toString();
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

export default function Home() {
  const [authBaseUrl, setAuthBaseUrl] = useState(defaultBase);
  const [appKey, setAppKey] = useState(defaultAppKey);
  const [session, setSession] = useState<SmisSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<StoredSession[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession[]) : [];
    } catch {
      return [];
    }
  });
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
      const decoded = decodeJwt(sess.accessToken);
      const username = decoded?.username ?? decoded?.sub;
      const enriched: StoredSession = { session: sess, username, appKey };
      setSession(sess);
      setSavedSessions((prev) => {
        const next = [enriched, ...prev.filter((s) => s.session.refreshToken !== sess.refreshToken)];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
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

  const selectSavedSession = (saved: StoredSession) => {
    setSession(saved.session);
    setError(null);
  };

  const removeSavedSession = (refreshToken: string) => {
    setSavedSessions((prev) => {
      const next = prev.filter((s) => s.session.refreshToken !== refreshToken);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      if (session?.refreshToken === refreshToken) {
        setSession(null);
        setAuthz(null);
        setContextAuthz(null);
      }
      return next;
    });
  };

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
          {savedSessions.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3>Choose an account</h3>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {savedSessions.map((s) => {
                  const decoded = decodeJwt(s.session.accessToken);
                  const username = s.username || decoded?.username || decoded?.sub || 'Unknown user';
                  const exp = decoded?.exp ? new Date(decoded.exp * 1000).toLocaleString() : s.session.expiresAt;
                  return (
                    <div key={s.session.refreshToken} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{username}</div>
                      <div className="muted" style={{ fontSize: 12 }}>App: {s.appKey ?? appKey}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Expires: {exp}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={() => selectSavedSession(s)} disabled={loading}>Use</button>
                        <button onClick={() => removeSavedSession(s.session.refreshToken)} style={{ background: '#f85149', color: '#fff' }} disabled={loading}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
