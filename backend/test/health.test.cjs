const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { configureApplication } = require('../dist/app.factory');
const { PrismaService } = require('../dist/prisma/prisma.service');

let app;
let baseUrl;
before(async () => {
  // Estas pruebas HTTP no prueban PostgreSQL: sustituyen solo PrismaService.
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
  app = configureApplication(module.createNestApplication());
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});
after(async () => { await app?.close(); });

test('GET /health devuelve HTTP 200 y el JSON esperado', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    message: 'El backend de MiniStock está funcionando.',
  });
});

test('CORS permite el frontend local', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'http://localhost:3000' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

test('CORS responde al preflight del frontend', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.match(response.headers.get('access-control-allow-methods'), /GET/);
});

test('CORS no autoriza un origen diferente', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'http://localhost:4000' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
