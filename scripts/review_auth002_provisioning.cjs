// Read source only; no server import, database, network or file writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const ts = require(path.join(root, 'node_modules/typescript'));
const source = ts.createSourceFile('server.ts', fs.readFileSync(path.join(root, 'server.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
let handler;
function visit(n) {
  if (ts.isCallExpression(n) && n.expression.getText(source) === 'app.post' && n.arguments[0]?.text === '/api/users') handler = n.arguments.at(-1);
  ts.forEachChild(n, visit);
}
visit(source);
assert.ok(handler);
const js = ts.transpileModule('globalThis.handler = ' + handler.getText(source), {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
(async () => {
  let failures = 0;
  for (const suppliedPassword of [false, true]) {
    let captured, status = 200;
    const ctx = {
      getEmployeeDefaultTempPassword: () => 'Fixture!8',
      createUser: async data => { captured = data; return {id: 'fixture', ...data}; },
      console: {error() {}}
    };
    vm.createContext(ctx); vm.runInContext(js, ctx);
    const res = {status(n) {status = n; return this;}, json() {return this;}};
    const body = {username: 'fixture', nombre: 'Synthetic Employee', rol: 'empleado'};
    if (suppliedPassword) body.password = 'Fixture!8';
    await ctx.handler({body}, res);
    try {
      assert.equal(status, 201);
      assert.equal(captured.mustChangePassword, true);
      console.log('PASS forced first change, explicit password=' + suppliedPassword);
    } catch {
      failures++;
      console.log('FAIL forced first change, explicit password=' + suppliedPassword);
    }
  }
  process.exitCode = failures ? 1 : 0;
})().catch(() => { console.log('FAIL test harness'); process.exitCode = 1; });
