// Isolated control-flow tests. The source function is extracted; no DB, disk or network.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'node_modules/typescript'));
const source=ts.createSourceFile('db.ts',fs.readFileSync(path.join(root,'src/server/db.ts'),'utf8'),ts.ScriptTarget.Latest,true);
const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='updateUser');assert.ok(fn);
const code=ts.transpileModule(fn.getText(source).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function setup({pg=true,count=2,fail='' }={}){
 const calls=[];let released=0,poolQueries=0,saved=0;
 const row={id:'a',username:'admina',email:null,rol:'superadmin',profesional_id:null,activo:true,nombre:'A',must_change_password:false,created_at:'2026-01-01',updated_at:'2026-01-01'};
 const client={query:async(sql,args)=>{const q=sql.trim().replace(/\s+/g,' ');calls.push(q);if(fail&&q.startsWith(fail))throw Error('private-detail');if(q.startsWith('SELECT id,'))return {rows:[row]};if(q.startsWith('SELECT COUNT'))return {rows:[{count}]};if(q.startsWith('UPDATE users'))return {rows:[{...row,rol:args[3]||row.rol,activo:args[5]??row.activo}]};return {rows:[]};},release:()=>released++};
 const ctx={isPostgresConnected:pg,pgPool:{connect:async()=>client,query:async()=>{poolQueries++;throw Error('pool query forbidden');}},normalizeEmail:x=>x.toLowerCase(),memoryDb:{users:[{id:'a',username:'admina',rol:'superadmin',activo:true,passwordHash:'h',salt:'s'},{id:'b',username:'adminb',rol:'superadmin',activo:true,passwordHash:'h',salt:'s'}]},saveLocalFileDb:()=>saved++,getUserById:async id=>{const u=ctx.memoryDb.users.find(x=>x.id===id);if(!u)return null;const {passwordHash,salt,...safe}=u;return safe;},bootstrapMutex:Promise.resolve()};
 vm.createContext(ctx);vm.runInContext(code,ctx);return {ctx,calls,released:()=>released,poolQueries:()=>poolQueries,saved:()=>saved};
}
(async()=>{let passed=0;
 {const t=setup({count:1});await assert.rejects(()=>t.ctx.updateUser('a',{activo:false}),/último superadministrador/);assert.ok(t.calls.includes('ROLLBACK'));assert.equal(t.calls.some(q=>q.startsWith('UPDATE users')),false);assert.equal(t.released(),1);passed++;}
 {const t=setup({count:2}),before=JSON.stringify(t.ctx.memoryDb);const out=await t.ctx.updateUser('a',{activo:false});assert.equal(out.activo,false);assert.deepEqual(t.calls.slice(0,4).map(q=>q.split(' ')[0]),['BEGIN','SELECT','SELECT','SELECT']);assert.ok(t.calls.some(q=>q.startsWith('SELECT pg_advisory_xact_lock')));assert.ok(t.calls.some(q=>q.startsWith('UPDATE users')));assert.equal(t.calls.at(-1),'COMMIT');assert.equal(t.poolQueries(),0);assert.equal(JSON.stringify(t.ctx.memoryDb),before);assert.equal(t.released(),1);passed++;}
 {const t=setup({count:2,fail:'UPDATE users'});await assert.rejects(()=>t.ctx.updateUser('a',{rol:'admin'}),e=>e.message==='No se pudo actualizar el usuario.');assert.ok(t.calls.includes('ROLLBACK'));assert.equal(t.released(),1);passed++;}
 {const t=setup({count:1});await t.ctx.updateUser('a',{nombre:'Nuevo'});assert.equal(t.calls.some(q=>q.includes('advisory')),false);assert.equal(t.calls.some(q=>q.startsWith('SELECT COUNT')),false);passed++;}
 {const t=setup({pg:false});const results=await Promise.allSettled([t.ctx.updateUser('a',{activo:false}),t.ctx.updateUser('b',{activo:false})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.equal(t.ctx.memoryDb.users.filter(u=>u.rol==='superadmin'&&u.activo).length,1);assert.equal(t.saved(),1);passed++;}
 {const t=setup({pg:false});t.ctx.memoryDb.users=t.ctx.memoryDb.users.slice(0,1);await assert.rejects(()=>t.ctx.updateUser('a',{rol:'admin'}),/último superadministrador/);assert.equal(t.ctx.memoryDb.users[0].rol,'superadmin');assert.equal(t.saved(),0);passed++;}
 {const t=setup();await assert.rejects(()=>t.ctx.updateUser('a',{mustChangePassword:false}),/credenciales/);assert.equal(t.calls.length,0);passed++;}
 console.log('PASS '+passed+' atomic superadmin control-flow cases; PostgreSQL mocked, no database/disk/network');
})().catch(e=>{console.log('FAIL '+e.name+': '+e.message);process.exitCode=1;});
