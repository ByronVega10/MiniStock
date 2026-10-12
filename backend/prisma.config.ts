import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Permite generar y validar el cliente sin una conexión configurada.
  // Las migraciones sí requieren DATABASE_URL real en .env.
  datasource: { url: process.env.DATABASE_URL },
});
