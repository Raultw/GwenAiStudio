// Isolated bootstrap control-flow tests; no database, disk, network or real secrets.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'node_modules/typescript'));
const text=fs.readFileSync(path.join(root,'src/server/db.ts'),'utf8');
const source=ts.createSourceFile('db.ts',text,ts.ScriptTarget.Latest,true);
const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='checkAndExecuteSuperadminBootstrap');assert.ok(fn);
const code=ts.transpileModule(fn.getText(source).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function setup({count=0,fail='',connectFail=false,withCredentials=true}={}){
 const calls=[];let released=0,poolQueries=0;
 const client={query:async(sql,args)=>{const q=sql.trim().replace(/\s+/g,' ');calls.push(q);if(fail&&q.startsWith(fail))throw Error('private-detail');if(q.startsWith('SELECT COUNT'))return {rows:[{count}]};return {rows:[]};},release:()=>released++};
 const ctx={bootstrapMutex:Promise.resolve(),isPostgresConnected:true,pgPool:{connect:async()=>{if(connectFail)throw Error('private-connect');return client;},query:async()=>{poolQueries++;throw Error('pool query forbidden');}},process:{env:{NODE_ENV:'production',...(withCredentials?{SUPERADMIN_BOOTSTRAP_USERNAME:'fixtureadmin',SUPERADMIN_BOOTSTRAP_PASSWORD:'Fixture!8',SUPERADMIN_BOOTSTRAP_DISPLAY_NAME:'Fixture'}:{})}},validatePasswordPolicy:()=>({valid:true}),hashPassword:()=>({hash:'fixture-hash',salt:'fixture-salt'}),crypto:{randomUUID:(()=>{let i=0;return()=>`id-${++i}`;})()},memoryDb:{users:[]},createUser:async()=>{throw Error('memory create forbidden')},createAuditLog:async()=>{throw Error('memory audit forbidden')},console:{log(){},warn(){},error(){}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);return {ctx,calls,released:()=>released,poolQueries:()=>poolQueries};
}
(async()=>{let passed=0;
 {const t=setup();await t.ctx.checkAndExecuteSuperadminBootstrap();assert.equal(t.calls[0],'BEGIN');assert.ok(t.calls[1].startsWith('SELECT pg_advisory_xact_lock'));assert.ok(t.calls[2].startsWith('SELECT COUNT'));assert.ok(t.calls.some(q=>q.startsWith('INSERT INTO users')));assert.ok(t.calls.some(q=>q.startsWith('INSERT INTO audit_logs')));assert.equal(t.calls.at(-1),'COMMIT');assert.equal(t.poolQueries(),0);assert.equal(t.released(),1);passed++;}
 {const t=setup({count:1});await t.ctx.checkAndExecuteSuperadminBootstrap();assert.equal(t.calls.some(q=>q.startsWith('INSERT')),false);assert.equal(t.calls.at(-1),'COMMIT');assert.equal(t.released(),1);passed++;}
 {const t=setup({fail:'INSERT INTO audit_logs'});await assert.rejects(()=>t.ctx.checkAndExecuteSuperadminBootstrap(),/bootstrap/);assert.ok(t.calls.includes('ROLLBACK'));assert.equal(t.calls.includes('COMMIT'),false);assert.equal(t.released(),1);passed++;}
 {const t=setup({connectFail:true});await assert.rejects(()=>t.ctx.checkAndExecuteSuperadminBootstrap(),/bootstrap/);assert.equal(t.calls.length,0);assert.equal(t.released(),0);passed++;}
 {const t=setup({withCredentials:false});await t.ctx.checkAndExecuteSuperadminBootstrap();assert.equal(t.calls.some(q=>q.startsWith('INSERT')),false);assert.equal(t.calls.at(-1),'COMMIT');passed++;}
 const initStart=text.indexOf('export async function initDatabase');const initEnd=text.indexOf('export async function getServices');const init=text.slice(initStart,initEnd),pgBootstrap=init.lastIndexOf('await checkAndExecuteSuperadminBootstrap()');assert.ok(init.indexOf('isPostgresConnected = true')<pgBootstrap);assert.ok(init.lastIndexOf('client.release()',pgBootstrap)<pgBootstrap);passed++;
 console.log('PASS '+passed+' bootstrap transaction/control-flow cases; PostgreSQL mocked, no database/disk/network');
})().catch(e=>{console.log('FAIL '+e.name+': '+e.message);process.exitCode=1;});
