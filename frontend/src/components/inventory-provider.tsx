"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { localToday, sortProducts, type Product, type ProductInput } from '@/lib/inventory';
import { productsApi } from '@/lib/products-api';
type Inventory = { products: Product[]; today: string; loading: boolean; error: string; refresh: () => Promise<void>; saveProduct: (product: ProductInput, id?: number) => Promise<Product>; deleteProduct: (id: number) => Promise<void> };
const Context = createContext<Inventory | null>(null);
export function InventoryProvider({ children, today: initialToday }: { children: ReactNode; today: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [today, setToday] = useState(initialToday);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    setLoading(true); setError('');
    try {
      const result = await productsApi.list();
      if (!Array.isArray(result)) throw new Error('La API devolvió una respuesta inválida.');
      if (request === version.current) setProducts(sortProducts(result));
    } catch (cause) {
      if (request === version.current) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el inventario.');
    } finally { if (request === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    const request = ++version.current;
    void productsApi.list().then(result => {
      if (!Array.isArray(result)) throw new Error('La API devolvió una respuesta inválida.');
      if (active && request === version.current) setProducts(sortProducts(result));
    }).catch(cause => {
      if (active && request === version.current) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el inventario.');
    }).finally(() => {
      if (active && request === version.current) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const updateDate = () => setToday(localToday());
    const timer = setInterval(updateDate, 30000);
    const initial = setTimeout(updateDate, 0);
    window.addEventListener('focus', updateDate);
    return () => { clearInterval(timer); clearTimeout(initial); window.removeEventListener('focus', updateDate); };
  }, []);
  async function saveProduct(input: ProductInput, id?: number) {
    const saved = id === undefined ? await productsApi.create(input) : await productsApi.update(id, input);
    version.current++;
    setProducts(current => sortProducts([...current.filter(p => p.id !== saved.id), saved]));
    return saved;
  }
  async function deleteProduct(id: number) {
    await productsApi.remove(id);
    version.current++;
    setProducts(current => current.filter(p => p.id !== id));
  }
  return <Context.Provider value={{ products, today, loading, error, refresh, saveProduct, deleteProduct }}>{children}</Context.Provider>;
}
export function useInventory() { const value = useContext(Context); if (!value) throw new Error('Se requiere InventoryProvider'); return value; }
