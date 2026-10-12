const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateEnvironment } = require('../dist/config/environment');

test('La configuración por defecto utiliza puerto 3001 y el frontend local', () => {
  assert.deepEqual(validateEnvironment({}), {
    PORT: 3001,
    CORS_ORIGIN: 'http://localhost:3000',
  });
});

test('Las variables de entorno permiten configurar puerto y origen', () => {
  assert.deepEqual(validateEnvironment({ PORT: '3002', CORS_ORIGIN: 'http://localhost:3003' }), {
    PORT: 3002,
    CORS_ORIGIN: 'http://localhost:3003',
  });
});

test('Se rechazan puertos inválidos', () => {
  for (const PORT of ['abc', '', '0', '-1', '65536', '3001.5']) {
    assert.throws(() => validateEnvironment({ PORT }), /PORT/);
  }
});

test('Se rechazan orígenes inválidos, comodines y rutas', () => {
  for (const CORS_ORIGIN of ['*', '', 'ftp://localhost', 'http://localhost:3000/', 'http://localhost:3000/ruta']) {
    assert.throws(() => validateEnvironment({ CORS_ORIGIN }), /CORS_ORIGIN/);
  }
});
