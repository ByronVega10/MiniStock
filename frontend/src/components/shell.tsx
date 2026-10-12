"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Boxes, CalendarClock, LayoutDashboard, Package, PackageCheck, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useInventory } from './inventory-provider';
import { daysRemaining } from '@/lib/inventory';
const navigation = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/products', label: 'Productos', icon: Package }, { href: '/expirations', label: 'Vencimientos', icon: CalendarClock }, { href: '/alerts', label: 'Alertas', icon: Bell }];
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(); const { products, today, loading, error } = useInventory();
  const alerts = products.reduce((total, p) => total + Number(p.quantity <= p.minStock) + Number(daysRemaining(p.expirationDate, today) <= 7), 0);
  return <div className="app-shell"><aside className="sidebar">
    <Link href="/" className="brand" aria-label="MiniStock, ir al Lobby"><span className="brand-icon"><Boxes size={25} /></span>MiniStock<span className="brand-dot">.</span></Link>
    <p className="nav-label">GESTIÓN DE INVENTARIO</p>
    <nav aria-label="Navegación principal">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`} aria-current={path === href ? 'page' : undefined}><Icon size={20} /><span>{label}</span>{href === '/alerts' && !loading && !error && alerts > 0 && <span className="nav-count">{alerts}</span>}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="demo-card"><PackageCheck size={21} /><strong>Tu inventario conectado</strong><p>Productos, stock y vencimientos en un solo lugar.</p><span>Cambios guardados en tu inventario</span></div><div className="sidebar-footer"><span className="store-avatar">M</span><div><strong>Mi minimarket</strong><small>Gestión de inventario</small></div></div></div>
  </aside><div className="workspace"><header className="topbar"><span>Tu negocio, en orden.</span><Link href="/alerts" className="header-alert"><Bell size={18} /> Alertas <span>{loading || error ? '—' : alerts}</span><ArrowUpRight size={15} /></Link></header><main>{children}</main><footer className="page-footer">MiniStock · Gestión simple para tu negocio<span>MiniStock</span></footer></div></div>;
}


