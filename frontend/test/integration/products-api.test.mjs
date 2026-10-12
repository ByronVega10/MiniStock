import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createProductsApi, ApiError } from '../../src/lib/products-api.ts';
const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const { AppModule } = require('./dist/app.module');
const { configureApplication } = require('./dist/app.factory');
const { PrismaService } = require('./dist/prisma/prisma.service');
const dotenv = require('dotenv');

test('Cliente frontend con NestJS y PostgreSQL: CRUD, fechas opcionales y errores', async () => {
  const env = { ...dotenv.parse(readFileSync(new URL('../../../backend/.env', import.meta.url))), ...process.env };
  const prisma = new PrismaService(new ConfigService(env));
  const rollback = new Error('ROLLBACK_TEST');
  const ids = [];
  await prisma.onModuleInit();
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      const testingModule = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue({ product: tx.product }).compile();
      const app = configureApplication(testingModule.createNestApplication());
      try {
        await app.listen(0, '127.0.0.1');
        const api = createProductsApi(await app.getUrl());
        const input = { name: 'Prueba integración frontend', category: 'Prueba', quantity: 2, minStock: 4, expirationDate: null };
        const created = await api.create(input); ids.push(created.id);
        assert.equal(created.expirationDate, null);
        assert.equal((await api.get(created.id)).name, input.name);
        assert.ok((await api.list()).some(p => p.id === created.id));
        const updated = await api.update(created.id, { ...input, quantity: 8, expirationDate: '2028-02-29' });
        assert.equal(updated.quantity, 8); assert.equal(updated.expirationDate, '2028-02-29');
        assert.equal((await tx.product.findUnique({ where: { id: created.id } })).quantity, 8);
        await assert.rejects(api.create({ ...input, quantity: -1 }), error => error instanceof ApiError && error.status === 400);
        await api.remove(created.id);
        await assert.rejects(api.get(created.id), error => error instanceof ApiError && error.status === 404);
        const temporary = await api.create(input); ids.push(temporary.id);
      } finally { await app.close(); }
      throw rollback;
    }, { timeout: 20000 }), error => error === rollback);
    assert.equal(await prisma.product.count({ where: { id: { in: ids } } }), 0);
  } finally { await prisma.onModuleDestroy(); }
});
