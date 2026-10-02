import * as fs from 'fs';
import * as path from 'path';

function findFiles(dir: string, ext = ['.ts', '.tsx']): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('src');
const prismaRegex = /prisma\.([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)/g;
const usages: Record<string, Set<string>> = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = prismaRegex.exec(content)) !== null) {
    const model = match[1];
    const method = match[2];
    if (!usages[model]) usages[model] = new Set();
    usages[model].add(method);
  }
  // Check for prisma.$
  const dollarRegex = /prisma\.\$([a-zA-Z0-9_$]+)/g;
  while ((match = dollarRegex.exec(content)) !== null) {
    const method = '$' + match[1];
    if (!usages['$']) usages['$'] = new Set();
    usages['$'].add(method);
  }
}

const report: Record<string, string[]> = {};
for (const [k, v] of Object.entries(usages)) {
  report[k] = Array.from(v);
}

console.log(JSON.stringify(report, null, 2));
