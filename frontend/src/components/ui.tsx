"use client";
import type { ReactNode } from 'react';
import { PackageSearch, RefreshCw } from 'lucide-react';
import { useInventory } from './inventory-provider';
export function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const { loading, error, refresh } = useInventory();
  return <><div className="page-heading"><div><p className="eyebrow">MI MINIMARKET</p><h1>{title}</h1><p>{description}</p></div>{action}</div>
    {loading && <div className="demo-banner" role="status"><RefreshCw size={18} /><span>Cargando inventario…</span></div>}
    {error && <div className="connection-error" role="alert"><span>{error}</span><button className="button secondary" onClick={() => void refresh()}>Reintentar</button></div>}
  </>;
}
export function Badge({ tone, children }: { tone: string; children: ReactNode }) { return <span className={`badge ${tone}`}><span />{children}</span>; }
export function EmptyState({ message, description = 'Prueba con otra búsqueda o revisa tus productos.' }: { message: string; description?: string }) { return <div className="empty-state"><PackageSearch size={32} /><strong>{message}</strong><span>{description}</span></div>; }
export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>; }
