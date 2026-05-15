import { chromium } from 'playwright';

export async function submitToKeepUp(excelFilePath: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Visit KeepUp Website
    await page.goto('https://keepup.bps.go.id/login'); // Placeholder URL

    // 2. Login (using env vars)
    await page.fill('#username', process.env.KEEPUP_USERNAME || 'demo_user');
    await page.fill('#password', process.env.KEEPUP_PASSWORD || 'demo_pass');
    await page.click('button[type="submit"]');

    // 3. Navigate to Upload
    await page.waitForSelector('.nav-upload');
    await page.click('.nav-upload');

    // 4. Upload File
    const fileInput = await page.$('input[type="file"]');
    await fileInput?.setInputFiles(excelFilePath);

    // 5. Submit
    await page.click('#btn-submit-laporan');
    await page.waitForSelector('.success-message');

    await browser.close();
    return { success: true, message: 'Automation finished successfully' };
  } catch (error: any) {
    await browser.close();
    console.error('KeepUp Automation Error:', error.message);
    throw error;
  }
}
