export type Product = { id: number; name: string; category: string; quantity: number; minStock: number; expirationDate: string | null; createdAt: string; updatedAt: string };
export type ProductInput = Pick<Product, 'name' | 'category' | 'quantity' | 'minStock' | 'expirationDate'>;
export const categories = ['Abarrotes', 'Bebidas', 'Lácteos', 'Panadería', 'Congelados', 'Otros'];
export function localToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(date: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
// Se comparan días de calendario, sin interpretar fechas de vencimiento en la zona horaria del navegador.
export function daysRemaining(expiration: string | null, today: string) {
  if (!expiration) return Infinity;
  return Math.round((Date.parse(`${expiration}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}
export function formatDate(date: string | null) {
  if (!date) return 'Sin fecha de vencimiento';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
export function expirationStatus(days: number) {
  if (!Number.isFinite(days)) return { label: 'Sin fecha de vencimiento', tone: 'blue' };
  if (days < 0) return { label: 'Vencido', tone: 'red' };
  if (days === 0) return { label: 'Vence hoy', tone: 'red' };
  if (days <= 7) return { label: 'Próximo a vencer', tone: 'yellow' };
  return { label: 'Vigente', tone: 'green' };
}
export function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, 'es') || a.id - b.id);
}
