import { expect, test } from './_apoio/teste';
import { DADOS, campo, semearSacola } from './_apoio/checkout';
import { vigiarConsole } from './_apoio/console';
import { cabecalhosDeSeguranca } from '../lib/cabecalhos';

// O servidor do e2e é `next start` (NODE_ENV=production) fora da Vercel: política "local".
const ESPERADOS = cabecalhosDeSeguranca({ desenvolvimento: false, producao: false });

const CAMINHOS = [
  { caminho: '/', status: 200 },
  { caminho: '/queijos', status: 200 },
  { caminho: '/checkout', status: 200 },
  { caminho: '/nao-existe', status: 404 },
];

for (const { caminho, status } of CAMINHOS) {
  test(`cabeçalhos de segurança em ${caminho}`, async ({ request }) => {
    const resposta = await request.get(caminho);
    expect(resposta.status()).toBe(status);
    const cabecalhos = resposta.headers();
    for (const { key, value } of ESPERADOS) {
      expect(cabecalhos[key.toLowerCase()], key).toBe(value);
    }
    expect(cabecalhos['x-powered-by']).toBeUndefined();
    const csp = cabecalhos['content-security-policy'];
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
}

test('checkout completo (Server Action) sob a CSP, sem violação no console', async ({ page }) => {
  const problemas = vigiarConsole(page);
  await semearSacola(page);
  await page.goto('/checkout');
  await campo(page, 'Nome completo').fill(DADOS.nome);
  await campo(page, 'E-mail').fill(DADOS.email);
  await campo(page, 'Telefone').fill(DADOS.telefone);
  await campo(page, 'CEP').fill(DADOS.cep);
  await campo(page, 'Rua ou avenida').fill(DADOS.logradouro);
  await campo(page, 'Número').fill(DADOS.numero);
  await campo(page, 'Bairro').fill(DADOS.bairro);
  await campo(page, 'Cidade').fill(DADOS.cidade);
  await campo(page, 'Estado').selectOption('SP');
  await expect(page.getByText('Chega refrigerado em até 3 dias úteis.')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Pagamento' })).toBeFocused();
  await page.locator('label').filter({ hasText: 'Pix (5% de desconto)' }).click();
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Seu queijo já está sendo preparado.' }),
  ).toBeFocused();
  await expect(page.getByText(/^Pedido nº AQ-\d{6}$/)).toBeVisible();
  expect(problemas).toEqual([]);
});
