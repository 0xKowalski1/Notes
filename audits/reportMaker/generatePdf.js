const puppeteer = require('puppeteer');
const path = require('path');
const filePath = `file://${path.resolve(__dirname, 'report.html')}`;

(async () => {
  // Launch a headless browser
    const browser = await puppeteer.launch({
    executablePath: '/home/kowalski/.nix-profile/bin/chromium', // Specify the path to the Chromium binary
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

  // Open a new page
  const page = await browser.newPage();

  // Navigate to your HTML file
  await page.goto(filePath, {waitUntil: 'networkidle0'});

  // Generate PDF with custom options
  await page.pdf({
    path: 'report.pdf', // The path to save the PDF to
    format: 'A4', // Specify the format
    printBackground: true, // Print background graphics
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px"
    },
    displayHeaderFooter: false, // Disable automatic headers and footers
  });

  // Close the browser
  await browser.close();
})();

