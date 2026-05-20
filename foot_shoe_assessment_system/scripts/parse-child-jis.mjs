import fs from 'fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('/home/ubuntu/child_jis_source.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;
const rows = [...document.querySelectorAll('table.table4 tbody tr')];

const widthOrder = ['B', 'C', 'D', 'E', 'EE', 'EEE', 'EEEE', 'F', 'G'];
const result = rows.map((row) => {
  const cells = [...row.querySelectorAll('th, td')].map((cell) => cell.textContent.trim());
  const footLength = Number(cells[1]);
  const values = cells.slice(2).map(Number);
  const widths = {};

  for (let i = 0; i < widthOrder.length; i += 1) {
    widths[widthOrder[i]] = {
      girth: values[i * 2],
      width: values[i * 2 + 1],
    };
  }

  return { footLength, widths };
});

fs.writeFileSync('/home/ubuntu/child_jis.json', JSON.stringify(result, null, 2));
console.log(`parsed ${result.length} rows`);
