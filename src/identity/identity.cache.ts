import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'node:crypto';
import Redis from 'ioredis';

@Injectable()
export class IdentityCache implements OnModuleDestroy {
  private readonly redis?: Redis;

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        connectTimeout: 500,
        commandTimeout: 300,
      });
      this.redis.on('error', () => {
        // Cache failures are handled as misses. The client reconnects in the background.
      });
    }
  }

  private key(id1: string, id2: string): string {
    const digest = createHash('sha256').update(JSON.stringify([id1, id2])).digest('hex');
    return `identity:v1:${digest}`;
  }

  async get(id1: string, id2: string): Promise<string | null> {
    if (this.redis?.status !== 'ready') return null;
    return this.redis.get(this.key(id1, id2)).catch(() => null);
  }

  async set(id1: string, id2: string, userID: string): Promise<void> {
    if (this.redis?.status !== 'ready') return;
    await this.redis.set(this.key(id1, id2), userID, 'EX', 300).catch(() => {});
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }
}
