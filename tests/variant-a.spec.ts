import { test, expect } from '@playwright/test';

test('Variant A, no mismatch -> brak CTA ostrzegawczego', async ({ page }) => {
  await page.route('**/api/analyze-cv-multiple', async route => {
    const body = {
      status: 'success',
      analysis: {
        podsumowanie: 'OK',
        dopasowanie: {
          mocne_strony: ['A'],
          obszary_do_poprawy: []
        },
        pytania: {
          kompetencje_miekkie: ['S1','S2'],
          kompetencje_twarde: ['T1','T2']
        },
        dopasowanie_procentowe: 80,
        warning_mismatch: false,
        meta: {
          kw_overlap_pct: 65,
          industry_cv: 'IT/Software',
          industry_jd: 'IT/Software',
          industry_effective: 'IT/Software',
          role_jd: 'Frontend'
        }
      }
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/?ab=0'); // wymuś wariant A

  await page.setInputFiles('input[type="file"]', {
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake A')
  });
  await page.fill('#jobUrls', 'https://example.com/oferta1');
  await page.selectOption('#selectedIndustry', { label: 'IT / Software' });

  await Promise.all([
    page.waitForResponse('**/api/analyze-cv-multiple'),
    page.click('button:has-text("Wyślij do analizy")')
  ]);

  await expect(page.getByText(/Wyniki analizy/)).toBeVisible();
  await expect(page.getByText(/Wykryto rozbieżność/)).toHaveCount(0);
});
