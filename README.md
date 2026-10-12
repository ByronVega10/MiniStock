# MiniStock

Plataforma web para la gestión de inventario y vencimientos en minimarkets y almacenes familiares. Incluye bienvenida, Dashboard, Productos, Vencimientos y Alertas. Los productos se almacenan en PostgreSQL mediante una API REST.

## Tecnologías

- Frontend: Next.js 16, React, TypeScript, Tailwind CSS y lucide-react.
- Backend: NestJS 11, TypeScript y validación con class-validator.
- Datos: PostgreSQL local y Prisma ORM 7.10.0 con adaptador PostgreSQL.

Se recomienda Node.js 24 para ejecutar el proyecto y las pruebas TypeScript del frontend.

## Estructura del repositorio

```text
MiniStock/
├── frontend/          # Interfaz y cliente HTTP
│   ├── src/
│   ├── test/
│   └── .env.example
├── backend/           # API NestJS y acceso a PostgreSQL
│   ├── src/
│   ├── prisma/        # Esquema y migraciones versionadas
│   ├── test/
│   └── .env.example
├── .gitignore
└── README.md
```

Frontend y backend son directorios normales de un único repositorio raíz. Cada uno mantiene su propio package.json y package-lock.json, sin requerir submódulos ni un sistema de workspaces.

## Instalar dependencias

Desde la raíz, en PowerShell:

```powershell
Push-Location frontend
npm.cmd ci --cache .npm-cache
Pop-Location
Push-Location backend
npm.cmd ci --cache .npm-cache
Pop-Location
```

## Variables de entorno

En una copia nueva, crea los archivos locales a partir de las plantillas. No sobrescribas los archivos de entorno existentes:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env
```

En `frontend/.env.local`, configura `NEXT_PUBLIC_API_URL=http://localhost:3001`. Esta URL es pública; nunca añadas contraseñas ni DATABASE_URL al frontend.

En `backend/.env`, configura PORT=3001, CORS_ORIGIN=http://localhost:3000 y DATABASE_URL con tu conexión privada. Los archivos de entorno locales están excluidos de Git. Las plantillas `.env.example` no deben contener credenciales reales.

## PostgreSQL y Prisma

El desarrollo utiliza PostgreSQL 18.3 y la base `ministock_db` en `127.0.0.1:5432`. En una instalación nueva, crea la base local y completa DATABASE_URL con tu usuario y contraseña reales, codificando sus caracteres especiales. No compartas la cadena de conexión ni la publiques.

La migración `init` define Product. Para una instalación nueva con la conexión configurada, ejecuta desde backend:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:migrate
npm.cmd run prisma:generate
```

Las migraciones SQL se conservan en Git. Prisma Client generado, dependencias y compilaciones se regeneran. No se insertan productos al iniciar. No ejecutes reseteos de bases de datos para resolver errores de configuración.

## Ejecutar

Con PostgreSQL disponible, inicia el backend en una terminal desde la raíz:

```powershell
cd backend
npm.cmd run start:dev
```

En otra terminal desde la raíz:

```powershell
cd frontend
npm.cmd run dev
```

Abre http://localhost:3000. La bienvenida está en `/`; el botón Ingresar al sistema conduce a `/dashboard`. Los módulos están en `/products`, `/expirations` y `/alerts`.

La API escucha en http://localhost:3001. Para verificarla:

```powershell
Invoke-RestMethod http://localhost:3001/health
```

## Verificaciones

En cada directorio, ejecuta `npm.cmd run lint`, `npm.cmd run build` y `npm.cmd test`. Las pruebas de integración usan `npm.cmd run test:integration` y requieren PostgreSQL y el backend compilado. Sus escrituras temporales se revierten mediante transacciones.

Consulta [frontend/README.md](frontend/README.md) y [backend/README.md](backend/README.md) para detalles de formularios, endpoints, reglas de fechas y pruebas.

## Archivos privados

No publiques archivos `.env`, `.env.local`, claves privadas, respaldos de bases de datos ni copias de seguridad Git. Las dependencias, cachés, compilaciones y Prisma Client generado están excluidos. Los package-lock.json, archivos `.env.example`, código y migraciones SQL sí forman parte del proyecto versionable.
