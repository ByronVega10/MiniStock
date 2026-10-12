# MiniStock — backend

NestJS 11, TypeScript y Prisma ORM 7.10.0 con PostgreSQL y `@prisma/adapter-pg`. Requiere Node.js 20.19+, 22.12+ o 24+. El proyecto es independiente de `frontend`.

## Iniciar en Windows / PowerShell

Desde la raíz de MiniStock:

```powershell
cd backend
npm.cmd ci --cache .npm-cache
npm.cmd run start:dev
```

El `.env` local contiene `PORT=3001`, `CORS_ORIGIN=http://localhost:3000` y la conexión privada `DATABASE_URL`. El servidor estará en `http://localhost:3001`. El modo desarrollo genera Prisma Client y recompila cuando cambian los archivos. Si falta la conexión o PostgreSQL no responde, el servidor falla al iniciar con un mensaje sin datos privados.

En una copia nueva del repositorio, primero crea el archivo de entorno desde la plantilla:

```powershell
Copy-Item .env.example .env
```

Ejecuta los comandos desde `backend`, ya que `ConfigModule` carga `.env` desde ese directorio. Las variables del proceso tienen prioridad sobre el archivo. Puerto y origen se validan al iniciar. CORS_ORIGIN es un único origen HTTP/HTTPS sin ruta ni barra final.

## Configurar PostgreSQL local

Edita `backend/.env` manualmente. Completa `DATABASE_URL` con tu usuario y contraseña reales para la base ya existente `ministock_db` en `127.0.0.1:5432`. No compartas este valor en el chat ni lo incluyas en Git.

Formato de referencia, con marcadores sin credenciales reales:

```dotenv
DATABASE_URL="postgresql://USUARIO:CONTRASENA_CODIFICADA@127.0.0.1:5432/ministock_db?schema=public"
```

Codifica los caracteres especiales del usuario y la contraseña mediante percent-encoding. La plantilla `.env.example` deja `DATABASE_URL` vacío y no contiene secretos.

`prisma.config.ts` carga el entorno explícitamente con dotenv y proporciona la URL a la CLI. El esquema define PostgreSQL sin URL, según Prisma 7. El generador `prisma-client` produce TypeScript dentro de `src/generated/prisma`, con `moduleFormat = "cjs"` para conservar CommonJS en NestJS.

La migración inicial `20261012191000_init` se generó mediante `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` y se aplicó con `prisma migrate deploy`, después de comprobar que la base estaba vacía. Solo crea el esquema público si hace falta y la tabla `Product`. No inserta productos ni reinicia la base.

En otra instalación, tras crear la base vacía y configurar `.env`, ejecuta:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:migrate
npm.cmd run prisma:generate
```

`prisma:migrate` aplica las migraciones pendientes con `migrate deploy`; no usa shadow database ni solicita reset. No ejecutes `migrate reset` ni aceptes un reseteo ante errores o diferencias de esquema.

El modelo `Product` usa `id` autoincremental, `name` y `category` obligatorios, `quantity` y `minStock` con valor inicial 0, `expirationDate` opcional de tipo PostgreSQL `DATE`, y marcas `createdAt`/`updatedAt`. Prisma asigna `updatedAt` automáticamente al crear o actualizar mediante el cliente; no es un trigger SQL para escrituras externas.

`PrismaModule` exporta `PrismaService`, que utiliza el adaptador PostgreSQL, conecta y ejecuta `SELECT 1` al iniciar, y desconecta al cerrar. `enableShutdownHooks` activa el ciclo de cierre de NestJS. No se registran cadenas de conexión ni los detalles privados de errores del driver.

## Probar `/health`

Abre `http://localhost:3001/health` en el navegador, o ejecuta en otra terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/health
```

Respuesta HTTP 200:

```json
{
  "status": "ok",
  "message": "El backend de MiniStock está funcionando."
}
```

Este endpoint comprueba que la aplicación HTTP responde; no verifica bases de datos ni servicios externos.

Para comprobar CORS:

```powershell
$response = Invoke-WebRequest -Uri http://localhost:3001/health -Headers @{ Origin = 'http://localhost:3000' }
$response.Headers['Access-Control-Allow-Origin']
```

Debe mostrar `http://localhost:3000`. Otros orígenes no reciben la cabecera de autorización CORS. CORS controla el acceso desde navegadores; no impide solicitudes desde PowerShell u otros clientes HTTP.

## API de productos

Los endpoints usan PrismaService y almacenan los cambios en PostgreSQL. No se necesitan nuevas migraciones.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/products` | 200: arreglo ordenado por nombre y, para empates, por id |
| GET | `/products/:id` | 200: producto; 404 si no existe |
| POST | `/products` | 201: producto creado |
| PATCH | `/products/:id` | 200: producto actualizado; 404 si no existe |
| DELETE | `/products/:id` | 200: producto eliminado; 404 si no existe |

POST requiere `name` y `category` como textos no vacíos; se recortan espacios al inicio y al final. `quantity` y `minStock` pueden omitirse al crear y toman el valor 0. Cuando se envían deben ser números enteros entre 0 y 2147483647, sin conversión de strings ni aceptación de null.

`expirationDate` puede omitirse o ser null. Cuando se envía una fecha debe ser un string de calendario válido `YYYY-MM-DD`, entre los años 0001 y 9999. No admite timestamps ni fechas inexistentes. Las respuestas devuelven el vencimiento como `YYYY-MM-DD` o null y `createdAt`/`updatedAt` como ISO 8601 UTC.

PATCH permite enviar solo los campos que cambian: omitir un campo conserva su valor y `expirationDate: null` quita la fecha. Un objeto vacío es una actualización sin cambios. Los campos administrados por el servidor (`id`, `createdAt`, `updatedAt`) y cualquier campo desconocido se rechazan con HTTP 400. Los identificadores deben ser enteros positivos dentro del rango PostgreSQL Int.

ValidationPipe es global y utiliza `class-validator` y `class-transformer`, con whitelist y rechazo de campos desconocidos. Los errores usan las excepciones HTTP de NestJS. Las operaciones sobre registros ausentes, incluido el error Prisma P2025, producen 404; otros errores de almacenamiento producen 500 sin detalles privados del driver.

Para listar los productos desde PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/products
```

Para crear un producto real, envía JSON con los campos indicados a POST `/products`. No se insertan productos ni fixtures al iniciar la aplicación.

## Verificaciones

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm.cmd run test:integration
```

Las 18 pruebas de `npm.cmd test` cubren `/health`, CORS, configuración, ciclo de vida Prisma y endpoints CRUD, formatos de fechas, actualizaciones parciales, campos desconocidos, identificadores inválidos y registros ausentes. Usan un sustituto de PrismaService y no necesitan PostgreSQL.

`test:integration` ejecuta además una prueba HTTP CRUD contra PostgreSQL real usando la conexión local de `.env`. Todas sus escrituras están dentro de una transacción revertida al terminar, incluso si falla una comprobación; no elimina datos existentes ni deja productos de prueba. También verifica `/health` y comprueba que los ids creados no persisten tras el rollback. PostgreSQL puede consumir números de la secuencia de ids aunque la transacción se revierta. Ambas suites cierran el servidor al terminar.

`npm.cmd run build` genera Prisma Client antes de compilar. La generación y la validación del esquema pueden realizarse sin DATABASE_URL; iniciar NestJS y aplicar migraciones requieren una conexión válida. Los archivos generados están excluidos de Git y se regeneran al compilar o arrancar en desarrollo.

Para ejecutar el código compilado:

```powershell
npm.cmd run build
npm.cmd run start:prod
```

## Estructura

- `src/main.ts`: inicio del servidor y puerto.
- `src/app.module.ts`: módulo raíz y carga de configuración.
- `src/app.factory.ts`: creación de la aplicación y CORS, compartida con las pruebas.
- `src/config/environment.ts`: valores por defecto y validación de variables.
- `src/health/`: módulo y controlador del endpoint de prueba.
- `src/prisma/`: PrismaModule y PrismaService.
- `src/products/`: módulo, controlador, servicio y DTOs para crear, actualizar y validar identificadores.
- `prisma.config.ts`: configuración de la CLI de Prisma 7.
- `prisma/schema.prisma`: modelo Product.
- `prisma/migrations/`: migración inicial SQL y bloqueo del proveedor.
- `test/`: pruebas con el ejecutor de Node.js.
- `.env.example`: plantilla versionable, sin secretos.

`.gitignore` excluye `.env`, `.env.*` y `*.env`, excepto `.env.example`, además de dependencias, compilación, cliente generado y caché. No hay autenticación ni inserción automática de productos de ejemplo.
