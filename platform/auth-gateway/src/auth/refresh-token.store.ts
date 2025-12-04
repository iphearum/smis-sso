import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { REFRESH_TOKEN_TTL_DAYS } from './auth.constants';

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  appKey: string;
  expiresAt: number;
}

@Injectable()
export class RefreshTokenStore {
  private readonly tokens = new Map<string, RefreshTokenRecord>();

  generate(userId: string, appKey: string): string {
    const token = randomUUID();
    const expiresAt = Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    this.tokens.set(token, { token, userId, appKey, expiresAt });
    return token;
  }

  touch(token: string, userId: string, appKey: string): RefreshTokenRecord {
    const record = this.tokens.get(token);
    const expiresAt = Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (!record) {
      const newRecord: RefreshTokenRecord = { token, userId, appKey, expiresAt };
      this.tokens.set(token, newRecord);
      return newRecord;
    }
    record.expiresAt = expiresAt;
    this.tokens.set(token, record);
    return record;
  }

  get(token: string): RefreshTokenRecord | undefined {
    const record = this.tokens.get(token);
    if (!record) return undefined;
    if (record.expiresAt <= Date.now()) {
      this.tokens.delete(token);
      return undefined;
    }
    return record;
  }

  revoke(token: string): void {
    this.tokens.delete(token);
  }
}
