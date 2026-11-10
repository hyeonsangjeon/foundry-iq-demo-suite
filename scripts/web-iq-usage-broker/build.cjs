'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

function buildBundle() {
  const source = fs.readFileSync(path.join(root, 'lib/demoUsageLedgerCore.ts'), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
    reportDiagnostics: true, fileName: 'demoUsageLedgerCore.ts',
  });
  if (result.diagnostics?.some(item => item.category === ts.DiagnosticCategory.Error)) {
    throw new Error('Ledger core transpilation failed.');
  }
  for (const match of result.outputText.matchAll(/require\(["']([^"']+)["']\)/g)) {
    if (match[1] !== 'node:crypto') throw new Error('The ledger core must use Node builtins only.');
  }
  const server = fs.readFileSync(path.join(__dirname, 'server.cjs'), 'utf8');
  const marker = "require('./demoUsageLedgerCore.cjs')";
  if (server.split(marker).length !== 2) throw new Error('Broker core marker is missing or ambiguous.');
  return "'use strict';\n// Generated usage broker: Node 22+; no runtime npm dependencies.\n"
    + 'const bundledLedgerCore = (() => { const module = { exports: {} }; const exports = module.exports;\n'
    + result.outputText + '\nreturn module.exports; })();\n'
    + server.replace(marker, 'bundledLedgerCore');
}

function writeBundle(destination) {
  if (!destination) throw new Error('Usage: node scripts/web-iq-usage-broker/build.cjs <git-ignored-output.cjs>');
  const output = path.resolve(destination);
  const relative = path.relative(root, output);
  if (relative.startsWith('..') || path.isAbsolute(relative) || path.extname(output) !== '.cjs') {
    throw new Error('Output must be a .cjs file in a git-ignored directory in this repository.');
  }
  try { execFileSync('git', ['check-ignore', '-q', '--', relative], { cwd: root, stdio: 'ignore' }); }
  catch { throw new Error('Output is not git-ignored; choose an ignored destination such as tasks/.'); }
  const bundle = buildBundle();
  fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
  fs.writeFileSync(output, bundle, { mode: 0o600 });
  return output;
}

module.exports = { buildBundle, writeBundle };

if (require.main === module) {
  try { process.stdout.write(`${writeBundle(process.argv[2])}\n`); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
