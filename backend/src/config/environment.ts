export function validateEnvironment(environment: Record<string, unknown>) {
  const portValue = environment.PORT ?? '3001';
  const port = Number(portValue);
  if (
    !/^\d+$/.test(String(portValue)) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('PORT debe ser un número entero entre 1 y 65535.');
  }

  const origin = String(environment.CORS_ORIGIN ?? 'http://localhost:3000');
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error('CORS_ORIGIN debe ser un origen HTTP o HTTPS válido.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
    throw new Error('CORS_ORIGIN debe contener solo el origen, sin ruta ni barra final.');
  }

  return { ...environment, PORT: port, CORS_ORIGIN: origin };
}
