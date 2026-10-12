import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApplication } from './app.factory';

async function bootstrap() {
  const app = await createApplication();
  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(`MiniStock disponible en http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error(error, undefined, 'Bootstrap');
  process.exitCode = 1;
});
