const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('../../dist/prisma/prisma.service');
const { startHttp } = require('../support/products-http.cjs');
const dotenv = require('dotenv');
const fs = require('node:fs');

test('CRUD HTTP con PostgreSQL real, rollback y health', async () => {
  const env = { ...dotenv.parse(fs.readFileSync('.env')), ...process.env };
  const prisma = new PrismaService(new ConfigService(env));
  const rollback = new Error('ROLLBACK_TEST');
  const createdIds = [];
  await prisma.onModuleInit();
  try {
    await assert.rejects(prisma.$transaction(async tx => {
      const http = await startHttp({ product: tx.product });
      try {
        assert.equal((await http.request('/health')).status, 200);
        const first = await http.request('/products', 'POST', { name: 'Prueba CRUD transaccional', category: 'Prueba', quantity: 4, minStock: 1, expirationDate: '2028-02-29' });
        assert.equal(first.status, 201);
        createdIds.push(first.body.id);
        const id = first.body.id;
        assert.equal((await tx.product.findUnique({ where: { id } })).quantity, 4);
        const second = await http.request('/products', 'POST', { name: 'Prueba sin fecha', category: 'Prueba' });
        assert.equal(second.status, 201); assert.equal(second.body.expirationDate, null);
        createdIds.push(second.body.id);
        const listing = await http.request('/products');
        assert.equal(listing.status, 200);
        assert.ok(listing.body.some(p => p.id === id));
        assert.equal((await http.request(`/products/${id}`)).body.expirationDate, '2028-02-29');
        const updated = await http.request(`/products/${id}`, 'PATCH', { quantity: 9, expirationDate: null });
        assert.equal(updated.status, 200); assert.equal(updated.body.quantity, 9); assert.equal(updated.body.expirationDate, null);
        assert.equal((await tx.product.findUnique({ where: { id } })).quantity, 9);
        assert.equal((await http.request(`/products/${id}`, 'PATCH', { quantity: -1 })).status, 400);
        assert.equal((await http.request(`/products/${id}`, 'DELETE')).status, 200);
        assert.equal(await tx.product.findUnique({ where: { id } }), null);
        for (const method of ['GET', 'PATCH', 'DELETE']) {
          assert.equal((await http.request(`/products/${id}`, method, method === 'PATCH' ? { name: 'Cambio' } : undefined)).status, 404);
        }
      } finally { await http.close(); }
      throw rollback;
    }, { timeout: 20000 }), error => error === rollback);
    assert.equal(await prisma.product.count({ where: { id: { in: createdIds } } }), 0);
  } finally { await prisma.onModuleDestroy(); }
});
