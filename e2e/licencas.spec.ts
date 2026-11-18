import { expect, test } from './_apoio/teste';

test('avisos de licença de terceiros são servidos em /licencas-de-terceiros.txt', async ({
  request,
}) => {
  const resposta = await request.get('/licencas-de-terceiros.txt');
  expect(resposta.status()).toBe(200);
  expect(await resposta.text()).toContain('@google/model-viewer@');
});
