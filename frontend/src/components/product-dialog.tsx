"use client";
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { categories, validDate, type Product } from '@/lib/inventory';
import { useInventory } from './inventory-provider';
function Modal({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement as HTMLElement | null; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><div className="modal-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" disabled={busy} aria-label="Cerrar ventana" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}
export function ProductDialog({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: (name: string) => void }) {
  const { saveProduct, products } = useInventory(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const choices = [...new Set([...categories, ...products.map(p => p.category)])].sort((a,b) => a.localeCompare(b, 'es'));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim(); const category = String(data.get('category') ?? '').trim();
    const quantity = Number(data.get('quantity')); const minStock = Number(data.get('minStock')); const expirationDate = String(data.get('expirationDate') ?? '') || null;
    if (!name || !category || !Number.isInteger(quantity) || quantity < 0 || quantity > 2147483647 || !Number.isInteger(minStock) || minStock < 0 || minStock > 2147483647 || (expirationDate !== null && !validDate(expirationDate))) { setError('Revisa el nombre, la categoría, las cantidades enteras no negativas y la fecha de vencimiento.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try { const saved = await saveProduct({ name, category, quantity, minStock, expirationDate }, product?.id); onSaved(saved.name); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el producto.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Modal title={product ? 'Editar producto' : 'Agregar producto'} onClose={onClose} busy={busy}><form onSubmit={submit} className="product-form"><p>La fecha de vencimiento es opcional. Los cambios se guardan en tu inventario.</p><fieldset disabled={busy} className="form-fields"><label>Nombre del producto<input name="name" defaultValue={product?.name} placeholder="Ej. Arroz grano largo 1 kg" required autoFocus /></label><label>Categoría<input name="category" list="product-categories" defaultValue={product?.category ?? ''} placeholder="Ej. Abarrotes" required /><datalist id="product-categories">{choices.map(c => <option key={c} value={c} />)}</datalist></label><div className="form-grid"><label>Cantidad<input name="quantity" type="number" min="0" step="1" max="2147483647" defaultValue={product?.quantity ?? 0} required /></label><label>Stock mínimo<input name="minStock" type="number" min="0" step="1" max="2147483647" defaultValue={product?.minStock ?? 0} required /></label></div><label>Fecha de vencimiento (opcional)<input name="expirationDate" type="date" defaultValue={product?.expirationDate ?? ''} min="0001-01-01" max="9999-12-31" /></label></fieldset>{error && <p className="text-red" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Agregar producto'}</button></div></form></Modal>;
}
export function DeleteDialog({ product, onClose, onDeleted }: { product: Product; onClose: () => void; onDeleted: () => void }) {
  const { deleteProduct } = useInventory(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const inFlight = useRef(false);
  async function remove() {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    try { await deleteProduct(product.id); onDeleted(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el producto.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Modal title="Eliminar producto" onClose={onClose} busy={busy}><div className="delete-content"><span className="stat-icon red"><Trash2 size={24} /></span><p>¿Eliminar <strong>{product.name}</strong> de tu inventario?</p><p className="muted">El producto se eliminará permanentemente y se quitará de las cuatro secciones.</p></div>{error && <p className="text-red" role="alert">{error}</p>}<div className="modal-actions"><button className="button secondary" disabled={busy} onClick={onClose} autoFocus>Cancelar</button><button className="button destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'Eliminando…' : 'Eliminar producto'}</button></div></Modal>;
}
