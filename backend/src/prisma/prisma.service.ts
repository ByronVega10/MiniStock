import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (!connectionString?.trim()) {
      throw new Error('Falta DATABASE_URL. Completa backend/.env con tu conexión PostgreSQL local.');
    }
    super({
      adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 }),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      // Verifica una conexión real; no depende de la existencia de tablas.
      await this.$queryRaw`SELECT 1`;
    } catch {
      await this.$disconnect().catch(() => undefined);
      // No propagar mensajes del driver que podrían contener datos de conexión.
      throw new Error('No se pudo conectar a PostgreSQL. Revisa DATABASE_URL y el servicio local.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
