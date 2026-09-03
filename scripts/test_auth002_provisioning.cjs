// Executes the real POST /api/users handler extracted from server.ts. No DB, disk or network.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'node_modules/typescript'));
const src=ts.createSourceFile('server.ts',fs.readFileSync(path.join(root,'server.ts'),'utf8'),ts.ScriptTarget.Latest,true);
let handler;function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(src)==='app.post'&&n.arguments[0]?.text==='/api/users')handler=n.arguments.at(-1);ts.forEachChild(n,visit);}visit(src);assert.ok(handler);
const code=ts.transpileModule('globalThis.handler='+handler.getText(src),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
async function run(body,temp='Fixture!8'){let captured,status=200,payload;const ctx={getUsers:async()=>[],generateProposedUsername:()=> 'sfixture',getEmployeeDefaultTempPassword:()=>temp,createUser:async data=>{captured=data;return {id:'u1',...data};},console:{error(){}}};vm.createContext(ctx);vm.runInContext(code,ctx);const res={status(n){status=n;return this;},json(p){payload=p;return this;}};await ctx.handler({body},res);return {captured,status,payload};}
(async()=>{let count=0;
 for(const body of [
  {nombre:'Synthetic Fixture',rol:'empleado'},
  {nombre:'Synthetic Fixture',rol:'empleado',password:'Explicit!8'},
  {nombre:'Synthetic Fixture',rol:'empleado',password:'Explicit!8',mustChangePassword:false}
 ]){const r=await run(body);assert.equal(r.status,201);assert.equal(r.captured.mustChangePassword,true);assert.equal(r.payload.mustChangePassword,true);count++;}
 const missing=await run({nombre:'Synthetic Fixture',rol:'empleado'},null);assert.equal(missing.status,400);assert.equal(missing.captured,undefined);count++;
 console.log('PASS '+count+' real provisioning handler cases; no database, disk or network');
})().catch(e=>{console.log('FAIL '+e.name+': '+e.message);process.exitCode=1;});
