const puppeteer = require('puppeteer');
const filePath = `file://${process.cwd()}/report.html`; // Use the current working directory

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/kowalski/.nix-profile/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(filePath, {waitUntil: 'networkidle0'});

    const { title, author } = await page.evaluate(() => {
        const title = document.title;
        const author = document.querySelector('meta[name="author"]').getAttribute('content');
        return { title, author };
    });

       // const headerTemplate = `<div style="font-size:10px; width:100%; text-align:center;">${title}</div>`;
    const headerTemplate = `
        <div style="font-size:14px; width:100%; padding: 5px 100px; color: #555; margin: 10px; border-bottom: 2px solid #000;">
            <span style="float:left;">${title}</span>
            <span style="float:right;">${author}</span>
        </div>
        <div style="clear: both;"></div>
    `;

    const footerTemplate = `<div style="font-size:10px; width:100%; text-align:center; margin: 10px; padding-top: 5px; border-top: 2px solid #000;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>`;


  await page.pdf({
    path: `${process.cwd()}/report.pdf`, // Output to the current working directory
    format: 'A4',
    printBackground: true,
    margin: { top: "75px", right: "75px", bottom: "75px", left: "75px" },
    displayHeaderFooter: true,
    headerTemplate, 
    footerTemplate
  });

  await browser.close();
})();

