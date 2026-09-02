// Isolated source-function tests: never import db.ts or initialize persistence.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
const source=ts.createSourceFile('db.ts',fs.readFileSync(path.join(root,'src/server/db.ts'),'utf8'),ts.ScriptTarget.Latest,true);
const names=['createUser','updateUser'];
const selected=source.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));
assert.equal(selected.length,2);
const code=ts.transpileModule(selected.map(n=>n.getText(source).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function setup(postgres=false){
 const state={saved:0,queries:0,fail:false};
 const context={crypto:{randomUUID:()=> 'test-id'},normalizeEmail:x=>x.toLowerCase(),validatePasswordPolicy:p=>({valid:typeof p==='string'&&p.length>=8,error:'invalid'}),hashPassword:()=>({hash:'test-hash',salt:'test-salt'}),isPostgresConnected:postgres,pgPool:{query:async()=>{state.queries++;if(state.fail)throw Error('sensitive-sql-details');return {rowCount:1};}},memoryDb:{users:[]},saveLocalFileDb:()=>{state.saved++;},getUserById:async id=>context.memoryDb.users.find(u=>u.id===id)||null,isLastActiveSuperadmin:async()=>false,console:{error:()=>{throw Error('Unexpected sensitive error logging');}}};
 vm.createContext(context);vm.runInContext(code,context);return {context,state};
}
(async()=>{
 let count=0;
 for(const invalid of [undefined,'',123]) { const {context:c,state:s}=setup(); await assert.rejects(()=>c.createUser({username:'qa',password:invalid,rol:'profesional'})); assert.equal(s.saved,0);assert.equal(c.memoryDb.users.length,0);count++; }
 {const {context:c,state:s}=setup();const u=await c.createUser({username:'qa',password:'Synthetic!7',rol:'profesional'});assert.equal('password' in u,false);assert.equal('passwordHash' in u,false);assert.equal('password' in c.memoryDb.users[0],false);assert.equal(s.saved,1);count++;}
 {const {context:c,state:s}=setup();c.memoryDb.users.push({id:'qa',password:'old-plaintext',nombre:'Keep',passwordHash:'old',salt:'old'});await c.updateUser('qa',{password:'Synthetic!7',mustChangePassword:true});const u=c.memoryDb.users[0];assert.equal('password' in u,false);assert.equal(u.passwordHash,'test-hash');assert.equal(u.nombre,'Keep');assert.equal(u.mustChangePassword,true);assert.equal(s.saved,1);count++;}
 {const {context:c}=setup();c.memoryDb.users.push({id:'qa',password:'old-plaintext',passwordHash:'old',salt:'old'});await c.updateUser('qa',{nombre:'Updated'});assert.equal('password' in c.memoryDb.users[0],false);assert.equal(c.memoryDb.users[0].passwordHash,'old');count++;}
 for(const op of ['create','update']){const {context:c,state:s}=setup(true);s.fail=true;c.memoryDb.users.push({id:'qa',nombre:'Keep',passwordHash:'old',salt:'old'});const before=JSON.stringify(c.memoryDb.users);await assert.rejects(()=>op==='create'?c.createUser({username:'qa',password:'Synthetic!7',rol:'profesional'}):c.updateUser('qa',{password:'Synthetic!7'}),e=>!e.message.includes('sensitive-sql-details')&&!e.message.includes('Unexpected'));assert.equal(JSON.stringify(c.memoryDb.users),before);assert.equal(s.saved,0);assert.equal(s.queries,1);count++;}
 console.log('PASS '+count+' isolated credential persistence cases; no database, disk writes or network');
})().catch(e=>{console.log('FAIL '+e.name);process.exitCode=1;});
