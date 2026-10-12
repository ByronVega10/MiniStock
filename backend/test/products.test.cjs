const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { Prisma } = require('../dist/generated/prisma/client');
const { startHttp } = require('./support/products-http.cjs');

const records = new Map();
let nextId = 1;
let failure = false;
let lastOrder;
function missing() { return new Prisma.PrismaClientKnownRequestError('private missing detail', { code: 'P2025', clientVersion: '7.10.0' }); }
const prisma = { product: {
  async findMany({ orderBy }) { if (failure) throw new Error('private database details'); lastOrder = orderBy; return [...records.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id); },
  async findUnique({ where }) { return records.get(where.id) ?? null; },
  async create({ data }) {
    const date = new Date();
    const defined = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    const row = { id: nextId++, quantity: 0, minStock: 0, expirationDate: null, ...defined, createdAt: date, updatedAt: date };
    records.set(row.id, row); return row;
  },
  async update({ where, data }) { const row = records.get(where.id); if (!row) throw missing(); const updated = { ...row, ...data, updatedAt: new Date(row.updatedAt.getTime() + 1) }; records.set(row.id, updated); return updated; },
  async delete({ where }) { const row = records.get(where.id); if (!row) throw missing(); records.delete(where.id); return row; },
} };
let http;
before(async () => { http = await startHttp(prisma); });
beforeEach(() => { records.clear(); nextId = 1; failure = false; });
after(async () => { await http?.close(); });
const valid = { name: 'Arroz', category: 'Abarrotes', quantity: 5, minStock: 2, expirationDate: '2028-02-29' };

test('CRUD HTTP completo: crear, listar, consultar, editar y eliminar', async () => {
  const created = await http.request('/products', 'POST', valid);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(created.body.expirationDate, '2028-02-29');
  assert.equal(new Date(created.body.createdAt).toISOString(), created.body.createdAt);
  assert.equal(new Date(created.body.updatedAt).toISOString(), created.body.updatedAt);
  const listed = await http.request('/products');
  assert.equal(listed.status, 200); assert.equal(listed.body.length, 1);
  const found = await http.request(`/products/${id}`);
  assert.equal(found.status, 200); assert.deepEqual(found.body, created.body);
  const updated = await http.request(`/products/${id}`, 'PATCH', { quantity: 0, expirationDate: null });
  assert.equal(updated.status, 200); assert.equal(updated.body.quantity, 0); assert.equal(updated.body.expirationDate, null);
  assert.equal(updated.body.name, valid.name); assert.equal(updated.body.minStock, 2);
  assert.equal(updated.body.createdAt, created.body.createdAt); assert.notEqual(updated.body.updatedAt, created.body.updatedAt);
  const deleted = await http.request(`/products/${id}`, 'DELETE');
  assert.equal(deleted.status, 200); assert.equal(deleted.body.id, id);
  assert.equal((await http.request(`/products/${id}`)).status, 404);
  assert.deepEqual((await http.request('/products')).body, []);
});

test('Creación sin cantidades usa cero y sin fecha usa null; recorta textos', async () => {
  const { status, body } = await http.request('/products', 'POST', { name: '  Pan  ', category: '  Panadería  ' });
  assert.equal(status, 201); assert.equal(body.name, 'Pan'); assert.equal(body.category, 'Panadería');
  assert.equal(body.quantity, 0); assert.equal(body.minStock, 0); assert.equal(body.expirationDate, null);
  assert.equal((await http.request('/products', 'POST', { name: 'Agua', category: 'Bebidas', expirationDate: null })).status, 201);
});

test('Listado solicita orden por nombre y desempata por id', async () => {
  for (const name of ['Zanahoria', 'Arroz', 'Manzana']) await http.request('/products', 'POST', { ...valid, name });
  assert.deepEqual((await http.request('/products')).body.map(p => p.name), ['Arroz', 'Manzana', 'Zanahoria']);
  assert.deepEqual(lastOrder, [{ name: 'asc' }, { id: 'asc' }]);
});

test('PATCH conserva cantidades y fecha cuando se omiten; permite sustituir fecha', async () => {
  const { body: created } = await http.request('/products', 'POST', valid);
  const { body } = await http.request(`/products/${created.id}`, 'PATCH', { name: 'Arroz integral' });
  assert.equal(body.quantity, 5); assert.equal(body.minStock, 2); assert.equal(body.expirationDate, valid.expirationDate);
  const result = await http.request(`/products/${created.id}`, 'PATCH', { expirationDate: '2027-01-01' });
  assert.equal(result.status, 200); assert.equal(result.body.expirationDate, '2027-01-01');
});

const invalidFields = [
  { name: '' }, { name: '   ' }, { name: null }, { name: 123 }, { name: [] },
  { category: '' }, { category: '\t ' }, { category: null }, { category: 12 },
  { quantity: -1 }, { quantity: 1.5 }, { quantity: '5' }, { quantity: null }, { quantity: true }, { quantity: 2147483648 },
  { minStock: -1 }, { minStock: 1.1 }, { minStock: '2' }, { minStock: null }, { minStock: 2147483648 },
  { expirationDate: '' }, { expirationDate: '2027-02-29' }, { expirationDate: '2026-02-30' },
  { expirationDate: '2026-13-01' }, { expirationDate: '2026-1-01' }, { expirationDate: '0000-01-01' },
  { expirationDate: '2026-10-12T00:00:00Z' }, { expirationDate: 123 }, { expirationDate: {} },
  { id: 1 }, { createdAt: '2026-01-01' }, { unexpected: 'value' },
];
test('POST y PATCH rechazan campos inválidos o desconocidos con HTTP 400', async () => {
  const { body } = await http.request('/products', 'POST', valid);
  for (const fields of invalidFields) {
    assert.equal((await http.request('/products', 'POST', { ...valid, ...fields })).status, 400, `POST ${JSON.stringify(fields)}`);
    assert.equal((await http.request(`/products/${body.id}`, 'PATCH', fields)).status, 400, `PATCH ${JSON.stringify(fields)}`);
  }
  for (const data of [{}, { name: 'Arroz' }, { category: 'Abarrotes' }, [], null]) {
    assert.equal((await http.request('/products', 'POST', data)).status, 400);
  }
  assert.equal(records.size, 1);
});

test('Identificadores inválidos producen 400 y ausentes producen 404', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '1e2', '2147483648']) {
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      assert.equal((await http.request(`/products/${id}`, method, method === 'PATCH' ? { name: 'Pan' } : undefined)).status, 400);
    }
  }
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    assert.equal((await http.request('/products/999', method, method === 'PATCH' ? { name: 'Pan' } : undefined)).status, 404);
  }
});

test('Los fallos internos devuelven 500 sin detalles privados', async () => {
  failure = true;
  const response = await http.request('/products');
  assert.equal(response.status, 500); assert.equal(JSON.stringify(response.body).includes('private database details'), false);
  assert.equal(response.body.message, 'No se pudo completar la operación de productos.');
});
