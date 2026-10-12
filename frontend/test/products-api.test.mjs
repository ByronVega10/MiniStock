import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProductsApi, ApiError } from '../src/lib/products-api.ts';
const input = { name: 'Prueba', category: 'Categoría libre', quantity: 0, minStock: 2, expirationDate: null };
const product = { ...input, id: 5, createdAt: '2026-10-12T00:00:00.000Z', updatedAt: '2026-10-12T00:00:00.000Z' };
test('El cliente usa las cinco rutas y envía solo el contrato del backend', async () => {
  const requests = [];
  const api = createProductsApi('http://localhost:3001/', async (url, options) => {
    requests.push({ url, options });
    return Response.json(requests.length === 1 ? [product] : product);
  });
  assert.deepEqual(await api.list(), [product]);
  await api.get(5); await api.create(input); await api.update(5, input); await api.remove(5);
  assert.deepEqual(requests.map(r => [r.url, r.options.method]), [['http://localhost:3001/products', 'GET'], ['http://localhost:3001/products/5', 'GET'], ['http://localhost:3001/products', 'POST'], ['http://localhost:3001/products/5', 'PATCH'], ['http://localhost:3001/products/5', 'DELETE']]);
  assert.deepEqual(JSON.parse(requests[2].options.body), input);
  assert.equal(requests[3].options.headers['Content-Type'], 'application/json');
  assert.ok(requests.every(r => r.options.cache === 'no-store'));
});
test('Inventario vacío permanece vacío sin fallback de ejemplos', async () => {
  assert.deepEqual(await createProductsApi('http://localhost', async () => Response.json([])).list(), []);
});
test('Errores HTTP 400, 404 y 500 son explícitos y no filtran detalles internos', async () => {
  for (const status of [400, 404, 500]) {
    const api = createProductsApi('http://localhost', async () => Response.json({ message: status === 400 ? ['quantity must be positive'] : 'private database details' }, { status }));
    await assert.rejects(api.create(input), error => error instanceof ApiError && error.status === status && !error.message.includes('private database details'));
  }
});
test('Desconexión o respuesta inválida devuelven un error recuperable', async () => {
  for (const fetcher of [async () => { throw new TypeError('Failed to fetch'); }, async () => new Response('invalid JSON')]) {
    await assert.rejects(createProductsApi('http://localhost', fetcher).list(), /No se pudo conectar/);
  }
});
