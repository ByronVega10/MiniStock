const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('../dist/prisma/prisma.service');

test('Prisma requiere DATABASE_URL y no inventa una conexión', () => {
  assert.throws(() => new PrismaService(new ConfigService({})), /Falta DATABASE_URL/);
});

function serviceWithoutNetwork() {
  return new PrismaService(new ConfigService({
    DATABASE_URL: 'postgresql://127.0.0.1:5432/ministock_db',
  }));
}

test('El ciclo de vida conecta, comprueba la conexión y desconecta', async () => {
  const service = serviceWithoutNetwork();
  const calls = [];
  service.$connect = async () => { calls.push('connect'); };
  service.$queryRaw = async () => { calls.push('query'); return [{ value: 1 }]; };
  service.$disconnect = async () => { calls.push('disconnect'); };
  await service.onModuleInit();
  await service.onModuleDestroy();
  assert.deepEqual(calls, ['connect', 'query', 'disconnect']);
});

test('Los errores de conexión no propagan detalles del driver', async () => {
  const service = serviceWithoutNetwork();
  let closed = false;
  service.$connect = async () => { throw new Error('private driver detail'); };
  service.$disconnect = async () => { closed = true; };
  await assert.rejects(service.onModuleInit(), error => {
    assert.equal(error.message.includes('private driver detail'), false);
    assert.match(error.message, /No se pudo conectar a PostgreSQL/);
    return true;
  });
  assert.equal(closed, true);
});
