const { Test } = require('@nestjs/testing');
const { AppModule } = require('../../dist/app.module');
const { configureApplication } = require('../../dist/app.factory');
const { PrismaService } = require('../../dist/prisma/prisma.service');

async function startHttp(prisma) {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = configureApplication(module.createNestApplication());
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  return {
    close: () => app.close(),
    async request(path, method = 'GET', body) {
      const response = await fetch(url + path, {
        method,
        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}
module.exports = { startHttp };
