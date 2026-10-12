import Link from 'next/link';
import { ArrowRight, Bell, Boxes, CalendarClock, Check, Package, PackageCheck } from 'lucide-react';
const benefits = [
  { title: 'Control de inventario', icon: Package, tone: 'blue' },
  { title: 'Seguimiento de vencimientos', icon: CalendarClock, tone: 'green' },
  { title: 'Alertas automáticas', icon: Bell, tone: 'yellow' },
  { title: 'Apoyo a la reposición', icon: PackageCheck, tone: 'red' },
];
export default function Home() {
  return <div className="welcome-page">
    <header className="welcome-header"><Link href="/" className="brand welcome-brand" aria-label="MiniStock, inicio"><span className="brand-icon"><Boxes size={25} /></span>MiniStock<span className="brand-dot">.</span></Link><span className="welcome-tagline">Tu negocio, en orden.</span></header>
    <main className="welcome-main">
      <section className="welcome-copy" aria-labelledby="welcome-title">
        <p className="welcome-eyebrow"><span /> GESTIÓN SIMPLE PARA TU NEGOCIO</p>
        <h1 id="welcome-title">Tu inventario en orden.<br /><span>Tu negocio bajo control.</span></h1>
        <p className="welcome-description">Plataforma web para la gestión de inventario y vencimientos en minimarkets y almacenes familiares.</p>
        <ul className="welcome-benefits">{benefits.map(({ title, icon: Icon, tone }) => <li key={title}><span className={`stat-icon ${tone}`}><Icon size={20} /></span><span>{title}</span></li>)}</ul>
        <Link href="/dashboard" className="button primary welcome-enter">Ingresar al sistema <ArrowRight size={19} /></Link>
        <p className="welcome-caption">Todo lo que necesitas para conocer y cuidar tu inventario.</p>
      </section>
      <aside className="welcome-overview" aria-label="Beneficios de MiniStock">
        <div className="welcome-overview-top"><span className="welcome-overview-icon"><Boxes size={29} /></span><span>MINISTOCK</span></div>
        <h2>Una visión clara.<br />Mejores decisiones.</h2><p>De la revisión del stock a la reposición, acompaña el día a día de tu almacén.</p>
        <div className="welcome-feature-list">
          <div><span className="welcome-step">01</span><div><strong>Organiza tus productos</strong><p>Cantidades y categorías en un solo lugar.</p></div><Check size={17} /></div>
          <div><span className="welcome-step">02</span><div><strong>Anticípate a los vencimientos</strong><p>Identifica qué productos requieren atención.</p></div><Check size={17} /></div>
          <div><span className="welcome-step">03</span><div><strong>Planifica la reposición</strong><p>Detecta los productos con bajo stock.</p></div><Check size={17} /></div>
        </div>
        <div className="welcome-overview-footer"><PackageCheck size={18} /><span>Más claridad para tu negocio, cada día.</span></div>
      </aside>
    </main>
    <footer className="welcome-footer"><span>MiniStock · Gestión simple para tu negocio</span><span>Pensado para minimarkets y almacenes familiares</span></footer>
  </div>;
}
