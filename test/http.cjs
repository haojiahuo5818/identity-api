require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');

async function startApi(overrides = []) {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  for (const [token, value] of overrides) {
    builder.overrideProvider(token).useValue(value);
  }
  const module = await builder.compile();
  const app = module.createNestApplication({ logger: false });
  await app.listen(0, '127.0.0.1');
  const url = (await app.getUrl()) + '/identities/resolve';
  return {
    app,
    async post(body) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}

module.exports = { startApi };
