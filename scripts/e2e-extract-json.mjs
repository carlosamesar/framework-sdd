#!/usr/bin/env node
import { extractFirstJsonObject, extractAllJsonObjects } from './extract-json-block.mjs';

let failed = 0;
function ok(name, cond) {
  if (!cond) {
    console.error('FAIL:', name);
    failed++;
  } else console.log('OK:', name);
}

ok('fence json', extractFirstJsonObject('pre\n```json\n{"x":2}\n```\npost').x === 2);
ok('fence sin lang', extractFirstJsonObject('```\n{"y":3}\n```').y === 3);
ok('raw trim', extractFirstJsonObject('  \n{"z":4}\n  ').z === 4);
ok(
  'embedded',
  extractFirstJsonObject('Aquí el resultado:\n{"phase":"specify","n":1}\nfin').phase === 'specify',
);

try {
  extractFirstJsonObject('sin json');
  ok('debe fallar sin json', false);
} catch {
  ok('falla sin json', true);
}

const multi = `
\`\`\`json
{"u": 10}
\`\`\`
entre
\`\`\`json
{"v": 20}
\`\`\`
`;
const all = extractAllJsonObjects(multi);
ok('extractAll cuenta 2', all.length === 2 && all[0].u === 10 && all[1].v === 20);

const braceTwo = '{"p":1}{"q":2}';
const all2 = extractAllJsonObjects(braceTwo);
ok('extractAll dos brace', all2.length === 2 && all2[0].p === 1 && all2[1].q === 2);

console.log(failed ? `\ne2e-extract-json: FAILED (${failed})` : '\ne2e-extract-json: OK');
process.exit(failed ? 1 : 0);
