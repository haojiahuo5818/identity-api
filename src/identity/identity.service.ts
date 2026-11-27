import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { IdentityCache } from './identity.cache';
import { IdentityRepository } from './identity.repository';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly repository: IdentityRepository,
    private readonly cache: IdentityCache,
  ) {}

  async resolve(id1: string, id2: string): Promise<string> {
    const cached = await this.cache.get(id1, id2);
    if (cached !== null) return cached;

    let userID: string;
    try {
      userID = await this.repository.findOrCreate(id1, id2);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : 'unknown';
      this.logger.error(`MySQL lookup failed (${code})`);
      throw new ServiceUnavailableException('Identity lookup is temporarily unavailable');
    }

    await this.cache.set(id1, id2, userID);
    return userID;
  }
}
