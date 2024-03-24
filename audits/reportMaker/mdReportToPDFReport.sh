pandoc report.md --template=template.html --toc --toc-depth=4 -o report.html
node generatePdf.js
evince report.pdf
