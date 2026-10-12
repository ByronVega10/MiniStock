# MiniStock — frontend conectado

Next.js 16, TypeScript y Tailwind. Las cuatro secciones conservan su diseño y utilizan la API NestJS para consultar y guardar productos en PostgreSQL. No existen productos simulados ni fallback de ejemplo.

## Iniciar en Windows

Primero inicia el backend, con PostgreSQL disponible y DATABASE_URL configurada únicamente en `backend/.env`:

```powershell
cd backend
npm.cmd run start:dev
```

En otra terminal, desde la raíz del proyecto:

```powershell
cd frontend
npm.cmd install
```

Se incluye `.env.local` para desarrollo. En una copia nueva, crea la configuración pública:

```powershell
Copy-Item .env.example .env.local
```

El archivo debe contener:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

No pongas DATABASE_URL, contraseñas ni credenciales en el frontend. NEXT_PUBLIC_API_URL es una URL pública que Next.js incluye en el código del navegador. Reinicia desarrollo o reconstruye producción cuando cambies su valor.

```powershell
npm.cmd run dev
```

Abre http://localhost:3000. La bienvenida está en `/`. El botón Ingresar al sistema abre `/dashboard`. Las otras rutas son `/products`, `/expirations` y `/alerts`; las antiguas rutas en español redirigen a sus equivalentes. El navegador llama a NestJS en el puerto 3001; el backend permite CORS desde http://localhost:3000.

## Contrato y estado

`src/lib/products-api.ts` usa fetch sin dependencias adicionales y proporciona listar, consultar, crear, editar y eliminar. Envía únicamente name, category, quantity, minStock y expirationDate; los ids son numéricos y createdAt/updatedAt los administra el backend. Las fechas de vencimiento son YYYY-MM-DD o null. Los campos numéricos admiten enteros de 0 a 2147483647; la categoría acepta cualquier texto no vacío, con sugerencias de categorías locales y existentes.

`InventoryProvider` empieza sin productos y carga GET /products. Solo actualiza el estado tras una respuesta satisfactoria de POST, PATCH o DELETE, utilizando el producto que devuelve el servidor. Las cuatro pantallas comparten ese estado durante la navegación. Al recargar, los productos se consultan nuevamente desde PostgreSQL; no se usa localStorage como persistencia.

Hay estados de carga, error con reintento y vacío. Los formularios conservan sus datos al fallar, muestran el error y bloquean envíos repetidos mientras esperan. No se muestra éxito antes de recibir la confirmación del backend. Los errores 400/404 se distinguen de desconexiones y errores internos; no se muestran detalles privados del servidor.

La fecha de referencia usa el día local del navegador y se actualiza al cambiar de día o recuperar el foco. Se comparan días de calendario mediante fechas sin hora; no se convierte la fecha de vencimiento a la zona horaria del navegador. Se consideran próximos a vencer desde hoy hasta siete días inclusive. Las fechas ausentes no producen alertas de vencimiento. Bajo stock es cantidad menor o igual al mínimo. Un producto puede tener una alerta de stock y otra de vencimiento; estas alertas apuntan al mismo producto.

## Verificaciones automatizadas

Las pruebas del frontend usan el soporte de TypeScript de Node.js; utiliza Node.js 22.18+ o 24, como en este entorno.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
```

Las pruebas cubren rutas y payloads del cliente HTTP, inventario vacío, errores 400/404/500, desconexión, JSON inválido, fechas locales, cambios de año, bisiestos, horario de verano y los cinco estados de vencimiento.

Para la integración con PostgreSQL, primero compila el backend (`npm.cmd run build` en backend) y después ejecuta en frontend:

```powershell
npm.cmd run test:integration
```

La prueba levanta un servidor NestJS temporal y usa el mismo cliente HTTP del frontend. Todas las escrituras quedan dentro de una transacción revertida al terminar. Solo elimina sus propios registros temporales y verifica que no quedan productos de prueba; no altera registros existentes. La secuencia de ids puede avanzar aunque se revierta la transacción. Requiere la conexión privada en backend/.env y no necesita los servidores de desarrollo encendidos.

## Prueba manual en navegador

1. Abre `/` y pulsa Ingresar al sistema para llegar a `/dashboard`. Con el backend iniciado, navega por Productos (`/products`), Vencimientos (`/expirations`) y Alertas (`/alerts`).
2. Si la base está vacía, verás contadores en cero y mensajes para comenzar.
3. Registra un producto propio; revisa las otras secciones y recarga para comprobar la persistencia.
4. Prueba búsqueda y filtro con la categoría del producto.
5. Edita cantidad, mínimo y fecha; comprueba el cambio inmediato en Dashboard, Vencimientos y Alertas.
6. Quita la fecha y comprueba Sin fecha de vencimiento, sin alerta de vencimiento.
7. Usa la confirmación de eliminación solo en un producto que quieras borrar.
8. Detén el backend y recarga: debe aparecer el error de conexión, sin ejemplos. Reinícialo y pulsa Reintentar.
9. Con un formulario abierto y el backend detenido, intenta guardar: el formulario mantiene los datos y muestra el error.

No se modifican el esquema Prisma, las migraciones ni las reglas del backend.

