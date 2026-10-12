import type { Product, ProductInput } from './inventory.ts';
export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) { super(message); this.name = 'ApiError'; this.status = status; }
}
export function createProductsApi(baseUrl: string, fetcher: typeof fetch = fetch) {
  async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method, cache: 'no-store', signal: controller.signal,
        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      if (!response.ok) {
        let message = 'No se pudo completar la solicitud. Inténtalo nuevamente.';
        if (response.status === 404) message = 'El producto ya no existe. Actualiza el inventario e inténtalo nuevamente.';
        if (response.status === 400) {
          const data = await response.json().catch(() => null);
          message = Array.isArray(data?.message) ? data.message.join(' · ') : 'Revisa los datos del producto.';
        }
        throw new ApiError(message, response.status);
      }
      return await response.json() as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('No se pudo conectar con MiniStock. Comprueba que el backend esté disponible y vuelve a intentarlo.');
    } finally { clearTimeout(timeout); }
  }
  return {
    list: () => request<Product[]>('/products'),
    get: (id: number) => request<Product>(`/products/${id}`),
    create: (product: ProductInput) => request<Product>('/products', 'POST', product),
    update: (id: number, product: ProductInput) => request<Product>(`/products/${id}`, 'PATCH', product),
    remove: (id: number) => request<Product>(`/products/${id}`, 'DELETE'),
  };
}
export const productsApi = createProductsApi(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001');
