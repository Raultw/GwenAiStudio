const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const fs = require('node:fs');

// Transpile clientMatching.ts to get generateProposedUsername
const cmSource = ts.createSourceFile('clientMatching.ts', fs.readFileSync('src/server/clientMatching.ts', 'utf8'), ts.ScriptTarget.ES2022, true);
const cmFn = cmSource.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'generateProposedUsername');
assert.ok(cmFn, 'generateProposedUsername must be declared in clientMatching.ts');

const normTextFn = cmSource.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'normalizeText');
assert.ok(normTextFn, 'normalizeText must be declared in clientMatching.ts');

const cmCode = ts.transpileModule(
  normTextFn.getText(cmSource).replace(/^export /, '') + '\n' +
  cmFn.getText(cmSource).replace(/^export /, ''),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
).outputText;

const cmCtx = {};
vm.createContext(cmCtx);
vm.runInContext(cmCode, cmCtx);
const { generateProposedUsername } = cmCtx;

// 1. Test generateProposedUsername
console.log('--- Testing generateProposedUsername ---');
assert.equal(generateProposedUsername('Gwen', 'Nails'), 'gnails');
assert.equal(generateProposedUsername('María', 'Gómez'), 'mgomez');
assert.equal(generateProposedUsername('María Belén', 'Gómez Pérez'), 'mgomezperez');
assert.equal(generateProposedUsername('Gwen', 'Nails', ['gnails']), 'gnails1');
assert.equal(generateProposedUsername('Gwen', 'Nails', ['gnails', 'gnails1']), 'gnails2');
assert.equal(generateProposedUsername('Gwen', ''), 'gwen');
assert.equal(generateProposedUsername('', 'Nails'), 'nails');
assert.equal(generateProposedUsername('', '', ['empleado']), 'empleado1');
console.log('✓ generateProposedUsername passed all 8 cases');

// 2. Test authenticateAndCreateSession logic via isolated AST transpile
console.log('--- Testing authenticateAndCreateSession isolated logic ---');
const dbSource = ts.createSourceFile('db.ts', fs.readFileSync('src/server/db.ts', 'utf8'), ts.ScriptTarget.ES2022, true);
const authSessionFn = dbSource.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'authenticateAndCreateSession');
assert.ok(authSessionFn, 'authenticateAndCreateSession must be declared');

const code = ts.transpileModule(authSessionFn.getText(dbSource).replace(/^export /, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;

function createAuthContext(userOverrides = {}) {
  const salt = 'testsalt12345678';
  const validPass = 'Valid!Pass123';
  const passwordHash = crypto.scryptSync(validPass, salt, 64).toString('hex');

  const testUser = {
    id: 'user-test-1',
    username: 'testemp',
    email: 'test@gwennails.com',
    passwordHash,
    salt,
    rol: 'empleado',
    activo: true,
    nombre: 'Test Employee',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...userOverrides
  };

  const memoryDb = {
    users: [testUser],
    sessions: []
  };

  const writtenFiles = [];
  const mockFs = {
    existsSync: () => true,
    mkdirSync: () => {},
    openSync: () => 1,
    writeFileSync: (fd, content) => { writtenFiles.push(content); },
    closeSync: () => {},
    renameSync: () => {},
    unlinkSync: () => {}
  };

  const ctx = {
    isPostgresConnected: false,
    pgPool: null,
    memoryDb,
    DATA_DIR: 'test_data',
    DATA_FILE: 'test_data/gwen_db.json',
    fs: mockFs,
    path: { join: (...args) => args.join('/') },
    crypto,
    normalizeEmail: x => String(x).toLowerCase().trim(),
    verifyPassword: (pass, s, expectedHash) => {
      const h = crypto.scryptSync(pass, s, 64).toString('hex');
      return h === expectedHash;
    },
    generateSessionToken: () => 'test-raw-token-' + crypto.randomBytes(8).toString('hex'),
    hashSessionToken: (tok) => crypto.createHash('sha256').update(tok).digest('hex')
  };

  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, validPass, testUser, writtenFiles };
}

(async () => {
  // 2a. Successful authentication
  {
    const { ctx, validPass, testUser, writtenFiles } = createAuthContext();
    const res = await ctx.authenticateAndCreateSession('testemp', validPass);
    assert.equal(res.success, true);
    assert.equal(res.user.id, testUser.id);
    assert.equal(res.user.username, 'testemp');
    assert.equal(res.user.mustChangePassword, true);
    assert.equal(res.user.passwordHash, undefined);
    assert.equal(res.user.salt, undefined);
    assert.ok(res.session);
    assert.ok(res.rawToken);
    assert.equal(ctx.memoryDb.sessions.length, 1);
    assert.equal(writtenFiles.length, 1);
  }

  // 2b. Invalid password
  {
    const { ctx } = createAuthContext();
    const res = await ctx.authenticateAndCreateSession('testemp', 'Wrong!Password');
    assert.equal(res.success, false);
    assert.equal(res.error, 'Usuario o contraseña incorrectos.');
    assert.equal(ctx.memoryDb.sessions.length, 0);
  }

  // 2c. Inactive user
  {
    const { ctx, validPass } = createAuthContext({ activo: false });
    const res = await ctx.authenticateAndCreateSession('testemp', validPass);
    assert.equal(res.success, false);
    assert.equal(res.error, 'Usuario o contraseña incorrectos.');
    assert.equal(ctx.memoryDb.sessions.length, 0);
  }

  // 2d. Non-existent user
  {
    const { ctx, validPass } = createAuthContext();
    const res = await ctx.authenticateAndCreateSession('nonexistent', validPass);
    assert.equal(res.success, false);
    assert.equal(res.error, 'Usuario o contraseña incorrectos.');
    assert.equal(ctx.memoryDb.sessions.length, 0);
  }

  // 2e. Login by email
  {
    const { ctx, validPass, testUser } = createAuthContext();
    const res = await ctx.authenticateAndCreateSession('TEST@GWENNAILS.COM', validPass);
    assert.equal(res.success, true);
    assert.equal(res.user.id, testUser.id);
  }

  console.log('✓ authenticateAndCreateSession passed all 5 cases');

  console.log('ALL AUTH-002 SUITE TESTS PASSED SUCCESSFULLY');
})().catch(err => {
  console.error('FAIL in test_auth002_full_suite:', err);
  process.exit(1);
});
