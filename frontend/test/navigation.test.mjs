import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as inventory from '../src/lib/inventory.ts';

const require = createRequire(import.meta.url);
let pathname = '/dashboard';
// Transpilar en memoria permite probar el TSX real sin dependencias nuevas.
// Solo se sustituyen el router de Next.js y el contexto de datos.
function loadComponent(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2023, esModuleInterop: true },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: name => {
      if (name === 'next/link') return function TestLink({ href, children, ...props }) { return createElement('a', { ...props, href }, children); };
      if (name === 'next/navigation') return { usePathname: () => pathname };
      if (name === './inventory-provider') return { useInventory: () => ({ products: [], today: '2026-10-12', loading: false, error: '' }) };
      if (name === '@/lib/inventory') return inventory;
      return require(name);
    },
  });
  return exports;
}
const { Shell } = loadComponent('../src/components/shell.tsx');
const { default: Lobby } = loadComponent('../src/app/page.tsx');
const routes = [['Dashboard', '/dashboard'], ['Productos', '/products'], ['Vencimientos', '/expirations'], ['Alertas', '/alerts']];

function sidebarAt(path) {
  pathname = path;
  const html = renderToStaticMarkup(createElement(Shell, {}, 'Contenido'));
  const sidebar = html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)?.[1];
  assert.ok(sidebar);
  const anchors = [...sidebar.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  return { html, anchors };
}

test('El logo tiene su enlace independiente al Lobby y Dashboard al sistema', () => {
  const { anchors } = sidebarAt('/products');
  const logo = anchors.find(link => link[1].includes('class="brand"'));
  const dashboard = anchors.find(link => link[2].includes('<span>Dashboard</span>'));
  assert.ok(logo[1].includes('href="/"'));
  assert.ok(logo[1].includes('aria-label="MiniStock, ir al Lobby"'));
  assert.ok(dashboard[1].includes('href="/dashboard"'));
  assert.ok(!dashboard[1].includes('href="/"'));
});

test('Cada opción conserva su destino y solo la ruta actual está activa', () => {
  for (const [, current] of routes) {
    const { anchors } = sidebarAt(current);
    for (const [label, destination] of routes) {
      const link = anchors.find(anchor => anchor[2].includes(`<span>${label}</span>`));
      assert.ok(link[1].includes(`href="${destination}"`));
      assert.equal(link[1].includes('aria-current="page"'), destination === current);
      assert.equal(/class="nav-link active"/.test(link[1]), destination === current);
    }
    assert.equal(anchors.filter(link => link[1].includes('aria-current="page"')).length, 1);
  }
});

test('El Lobby no activa Dashboard por compartir el prefijo de la ruta', () => {
  assert.equal(sidebarAt('/').anchors.filter(link => link[1].includes('aria-current="page"')).length, 0);
});

test('Ingresar al sistema del Lobby sigue apuntando a /dashboard', () => {
  const html = renderToStaticMarkup(createElement(Lobby));
  const link = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(anchor => anchor[2].includes('Ingresar al sistema'));
  assert.ok(link[1].includes('href="/dashboard"'));
  assert.ok(!html.includes('class="sidebar"'));
});
