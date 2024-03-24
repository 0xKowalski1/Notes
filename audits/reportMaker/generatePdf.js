const puppeteer = require('puppeteer');
const filePath = `file://${process.cwd()}/report.html`; // Use the current working directory

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/kowalski/.nix-profile/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(filePath, {waitUntil: 'networkidle0'});

  await page.pdf({
    path: `${process.cwd()}/report.pdf`, // Output to the current working directory
    format: 'A4',
    printBackground: true,
    margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    displayHeaderFooter: false,
  });

  await browser.close();
})();

