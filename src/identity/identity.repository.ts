import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createPool, RowDataPacket } from 'mysql2/promise';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

@Injectable()
export class IdentityRepository implements OnModuleDestroy {
  private readonly pool = createPool({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: required('MYSQL_USER'),
    password: required('MYSQL_PASSWORD'),
    database: required('MYSQL_DATABASE'),
    charset: 'utf8mb4',
    connectionLimit: 10,
    queueLimit: 100,
    connectTimeout: 3000,
  });

  private async find(id1: string, id2: string): Promise<string | undefined> {
    const [rows] = await this.pool.execute<(RowDataPacket & { userID: string })[]>(
      'SELECT user_id AS userID FROM identities WHERE id1 = ? AND id2 = ?',
      [id1, id2],
    );
    return rows[0]?.userID;
  }

  async findOrCreate(id1: string, id2: string): Promise<string> {
    const existing = await this.find(id1, id2);
    if (existing !== undefined) return existing;

    const userID = randomUUID();
    try {
      await this.pool.execute(
        'INSERT INTO identities (id1, id2, user_id) VALUES (?, ?, ?)',
        [id1, id2, userID],
      );
      return userID;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY')) {
        throw error;
      }
      // Another request may have inserted this pair after our SELECT.
      const winner = await this.find(id1, id2);
      if (winner === undefined) throw error;
      return winner;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
