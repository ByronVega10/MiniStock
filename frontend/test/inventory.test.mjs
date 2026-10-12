import assert from 'node:assert/strict';
import { test } from 'node:test';
import { daysRemaining, expirationStatus, validDate, localToday, formatDate, sortProducts } from '../src/lib/inventory.ts';

test('Fechas de calendario: cambios de año, año bisiesto y horario de verano', () => {
  assert.equal(daysRemaining('2027-01-01', '2026-12-31'), 1);
  assert.equal(daysRemaining('2028-03-01', '2028-02-28'), 2);
  assert.equal(daysRemaining('2026-09-07', '2026-09-05'), 2);
  assert.equal(daysRemaining('2026-10-11', '2026-10-12'), -1);
  assert.equal(localToday(new Date(2026, 9, 12, 23, 59)), '2026-10-12');
});
test('Los cinco estados de vencimiento y el umbral inclusivo de siete días', () => {
  for (const [days, label] of [[-1, 'Vencido'], [0, 'Vence hoy'], [1, 'Próximo a vencer'], [7, 'Próximo a vencer'], [8, 'Vigente'], [Infinity, 'Sin fecha de vencimiento']]) assert.equal(expirationStatus(days).label, label);
  assert.equal(daysRemaining(null, '2026-10-12'), Infinity);
  assert.equal(formatDate(null), 'Sin fecha de vencimiento');
});
test('Validación de fechas rechaza días inexistentes y timestamps', () => {
  assert.ok(validDate('2028-02-29'));
  for (const date of ['2027-02-29', '2026-02-30', '2026-13-01', '2026-1-01', '0000-01-01', '2026-10-12T00:00:00Z', '']) assert.equal(validDate(date), false);
});
test('El orden del estado compartido no muta el arreglo original', () => {
  const rows = [{ id: 2, name: 'Pan' }, { id: 1, name: 'Arroz' }];
  assert.deepEqual(sortProducts(rows).map(p => p.id), [1, 2]);
  assert.equal(rows[0].id, 2);
});
