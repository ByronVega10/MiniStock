import { connection } from 'next/server';
import { Suspense, type ReactNode } from 'react';
import { InventoryProvider } from '@/components/inventory-provider';
import { Shell } from '@/components/shell';

async function InventoryApp({ children }: { children: ReactNode }) {
  await connection();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <InventoryProvider today={today}><Shell>{children}</Shell></InventoryProvider>;
}

export default function SystemLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="loading">Cargando MiniStock…</div>}><InventoryApp>{children}</InventoryApp></Suspense>;
}
