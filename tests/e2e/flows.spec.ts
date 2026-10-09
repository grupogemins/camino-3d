import { expect, test, type Page } from '@playwright/test';

async function signUpAndOnboard(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Começar meu Caminho' }).click();
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await page.getByLabel('Como quer ser chamado(a)?').fill('Ana Teste');
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill('caminho2026');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  // 7 passos "Continuar" e o último "Concluir"
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Privacidade' })).toBeVisible();
  // sem aceitar termos não avança
  await page.getByRole('button', { name: 'Concluir e planejar' }).click();
  await expect(page.getByText('aceite os termos de uso')).toBeVisible();
  await page.getByRole('switch', { name: /Aceito os termos/ }).click();
  await page.getByRole('button', { name: 'Concluir e planejar' }).click();
  await expect(page).toHaveURL(/\/planejar/);
}

test('onboarding, criação de rota e assinatura', async ({ page }) => {
  await signUpAndOnboard(page);

  // Planejamento → comparação de 3 rotas
  await page.getByRole('button', { name: 'Ver e comparar rotas' }).click();
  await expect(page).toHaveURL(/\/rotas/);
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(3);
  await expect(page.getByText('Recomendada')).toBeVisible();
  await expect(page.getByText('Dados de demonstração').first()).toBeVisible();

  // Escolhe a recomendada → viagem criada
  await page.getByRole('button', { name: 'Escolher esta rota' }).first().click();
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByRole('heading', { name: 'Etapa de hoje' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Dia 1:/ }).first()).toBeVisible();

  // Assinatura (modo demonstração, sem cobrança)
  await page.goto('/premium');
  await expect(page.getByText('Seu plano atual').first()).toBeVisible();
  await page.getByRole('button', { name: /Assinar Passe do Caminho/ }).click();
  await expect(page.getByRole('dialog', { name: 'Pagamento de demonstração' })).toBeVisible();
  await expect(page.getByText('Nenhum dado de cartão é solicitado')).toBeVisible();
  await page.getByRole('button', { name: 'Simular assinatura' }).click();
  await expect(page.getByText(/ativado em modo demonstração/)).toBeVisible();
  await expect(page.getByText('Passe do Caminho', { exact: true }).first()).toBeVisible();

  // Premium libera rotas alternativas
  await page.goto('/rotas?origin=porto&days=12&km=20&mode=scenic&start=2026-11-01');
  await expect(page.getByRole('button', { name: 'Escolher esta rota' })).toHaveCount(3);
});

test('privacidade da comunidade começa desligada e granularidade é configurável', async ({ page }) => {
  await signUpAndOnboard(page);
  await page.goto('/comunidade');
  await page.getByText('Minha visibilidade').click();
  const presence = page.getByRole('switch', { name: 'Aparecer na comunidade' });
  await expect(presence).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText('Você não está visível para outros peregrinos.')).toBeVisible();
  await presence.click();
  await page.getByText('Aproximada (~2 km)').click();
  await expect(page.getByText(/Você está visível \(aproximada/)).toBeVisible();
});

test('SOS exige confirmação e pode ser cancelado', async ({ page }) => {
  await page.goto('/seguranca');
  await page.getByRole('button', { name: /^SOS/ }).click();
  await expect(page.getByRole('dialog', { name: 'Confirmar SOS?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sim, preciso de ajuda' }).click();
  await page.getByRole('button', { name: /Cancelar \(\d\)/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('funciona sem WebGL (fallback 2D do personagem)', async ({ page }) => {
  await signUpAndOnboard(page);
  await page.goto('/peregrino?webgl=off');
  await expect(page.getByText(/Visualização 2D/)).toBeVisible();
  await page.getByRole('button', { name: 'Gorro' }).click();
  await expect(page.getByRole('button', { name: 'Gorro' })).toHaveAttribute('aria-pressed', 'true');
});
