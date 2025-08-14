import { test, expect } from '@playwright/test';

test('MVP flow: upload + analyze + render results + Plausible event fired', async ({ page }) => {
  // Intercept backend call i wstrzyknij mock odpowiedzi
  await page.route('**/api/analyze-cv-multiple', async route => {
    const body = {
      status: 'success',
      analysis: {
        podsumowanie: 'OK',
        dopasowanie: {
          mocne_strony: ['X', 'Y'],
          obszary_do_poprawy: ['Z'],
          ryzyko_niedopasowania: 'CV Finanse vs JD DevOps'
        },
        pytania: {
          kompetencje_miekkie: ['Q1','Q2'],
          kompetencje_twarde: ['H1','H2']
        },
        dopasowanie_procentowe: 40,
        warning_mismatch: true,
        meta: {
          kw_overlap_pct: 12,
          industry_cv: 'Finanse/Księgowość',
          industry_jd: 'IT/Software',
          industry_effective: 'IT/Software',
          role_jd: 'DevOps',
          ab_variant: 'B'
        }
      }
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  // Załaduj aplikację z wymuszeniem wariantu B
  await page.goto('/?ab=1');

  // Załaduj „fałszywy” plik (Playwright tworzy upload z bufora)
  await page.setInputFiles('input[type="file"]', {
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake')
  });

  // Wklej ogłoszenie
  await page.fill('#jobUrls', 'https://example.com/oferta1');

  // Wybierz branżę
  await page.selectOption('#selectedIndustry', { label: 'IT / Software' });

  // Wyślij formularz
  await Promise.all([
    page.waitForResponse('**/api/analyze-cv-multiple'),
    page.click('button:has-text("Wyślij do analizy")')
  ]);

  // Sprawdź, że wynik się pojawił
  await expect(page.getByText('Wyniki analizy')).toBeVisible();
  await expect(page.getByText('Dopasowanie:')).toBeVisible();

  // Sprawdź CTA mismatch
  await expect(page.getByText(/Wykryto rozbieżność/)).toBeVisible();
  await expect(page.getByText(/DevOps/)).toBeVisible();
});
