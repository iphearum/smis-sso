import {
  buildAuthUrl,
  fetchAuthorizations,
  fetchContextAuthorizations,
  logoutSession,
} from "./http";
import { getDefaultStorage, readSession, storeSession } from "./storage";
import {
  AuthProbeMessage,
  Authorization,
  Session,
  Config,
  ContextAuthorization,
  StorageAdapter,
} from "./types";

export class Client {
  private readonly storage: StorageAdapter;
  private readonly storageKey: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly authOrigin: string;

  constructor(private readonly config: Config) {
    this.storage = getDefaultStorage();
    this.storageKey = config.storageKey ?? `smis-sso:${config.appKey}`;
    this.timeoutMs = config.timeoutMs ?? 60 * 60 * 1000;
    this.pollIntervalMs = config.pollIntervalMs ?? 60 * 1000;
    this.authOrigin = new URL(config.authBaseUrl).origin;
  }

  getCachedSession(): Session | null {
    const session = readSession(this.storage, this.storageKey);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      storeSession(this.storage, this.storageKey, null);
      return null;
    }

    return session;
  }

  async ensureSession(): Promise<Session> {
    const cached = this.getCachedSession();
    if (cached) return cached;

    if (typeof window === "undefined") {
      throw new Error(
        "ensureSession requires a browser runtime to open the auth probe"
      );
    }

    const session = await this.launchAuthProbe();
    storeSession(this.storage, this.storageKey, session);
    return session;
  }

  async loadAuthorizations(session?: Session): Promise<Authorization> {
    const resolvedSession = session ?? (await this.ensureSession());
    return fetchAuthorizations(this.config, resolvedSession);
  }

  async loadContextAuthorizations(session?: Session): Promise<ContextAuthorization> {
    const resolvedSession = session ?? (await this.ensureSession());
    return fetchContextAuthorizations(this.config, resolvedSession);
  }

  /**
   * Clears the locally cached session only (no network calls).
   */
  clearSession(): void {
    storeSession(this.storage, this.storageKey, null);
  }

  /**
   * Signs in, forcing a fresh probe if `force` is true even when a cached session exists.
   */
  async signIn(options?: { force?: boolean }): Promise<Session> {
    const force = options?.force ?? false;
    if (force) {
      this.clearSession();
    }
    return this.ensureSession();
  }

  /**
   * Signs out: calls the auth portal logout (best-effort) and clears all local state.
   */
  async signOut(session?: Session): Promise<void> {
    const current = session ?? this.getCachedSession() ?? undefined;
    await logoutSession(this.config, current).catch(() => undefined);
    this.clearSession();
    // window.localStorage.removeItem(`smis-sso:${this.config.appKey}`);
    // window.cookieStore.delete(`smis_refresh_token`).catch(() => undefined);
  }

  /**
   * Switches user by clearing the current session and forcing a new sign-in.
   */
  async switchUser(): Promise<Session> {
    await this.signOut();
    return this.signIn({ force: true });
  }

  private launchAuthProbe(): Promise<Session> {
    return new Promise<Session>((resolve, reject) => {
      const authUrl = buildAuthUrl(this.config);
      authUrl.searchParams.set("appKey", this.config.appKey);

      const popup = window.open(
        authUrl.toString(),
        "_blank",
        "width=580,height=640"
      );
      if (!popup) {
        reject(new Error("Unable to open auth probe window"));
        return;
      }

      const timeoutId = window.setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        popup.close();
        reject(new Error("Auth probe timed out"));
      }, this.timeoutMs);

      const messageHandler = (event: MessageEvent<AuthProbeMessage>): void => {
        if (event.origin !== this.authOrigin) return;
        if (!event.data || event.data.type !== "smis:sso:session") return;

        window.clearTimeout(timeoutId);
        window.removeEventListener("message", messageHandler);
        popup.close();
        resolve(event.data.payload);
      };

      window.addEventListener("message", messageHandler);

      const intervalId = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(intervalId);
          window.clearTimeout(timeoutId);
          window.removeEventListener("message", messageHandler);
          reject(new Error("Auth probe was closed before completing sign-in"));
        }
      }, this.pollIntervalMs);
    });
  }
}

export const createAuthProbeResponse = (session: Session): void => {
  if (typeof window === "undefined") return;
  const message: AuthProbeMessage = {
    type: "smis:sso:session",
    payload: session,
  };
  window.opener?.postMessage(message, window.location.origin);
};
