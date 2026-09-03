// Executes the real PUT /api/users/:id handler extracted from server.ts. No DB, disk or network.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'node_modules/typescript'));
const src=ts.createSourceFile('server.ts',fs.readFileSync(path.join(root,'server.ts'),'utf8'),ts.ScriptTarget.Latest,true);
let handler;function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(src)==='app.put'&&n.arguments[0]?.text==='/api/users/:id')handler=n.arguments.at(-1);ts.forEachChild(n,visit);}visit(src);assert.ok(handler);
const code=ts.transpileModule('globalThis.handler='+handler.getText(src),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
async function run(body){let captured,status=200,payload,calls=0;const ctx={updateUser:async(id,data)=>{calls++;captured=data;return {id,...data};},console:{error(){}}};vm.createContext(ctx);vm.runInContext(code,ctx);const res={status(n){status=n;return this;},json(p){payload=p;return this;}};await ctx.handler({body,params:{id:'u1'}},res);return {captured,status,payload,calls};}
(async()=>{let count=0;
 for(const body of [{password:'X'},{passwordHash:'X'},{salt:'X'},{mustChangePassword:false}]){const r=await run(body);assert.equal(r.status,400);assert.equal(r.calls,0);count++;}
 const ok=await run({nombre:' Nuevo ',rol:'admin',unexpected:'discard'});assert.equal(ok.status,200);assert.equal(ok.calls,1);assert.equal(ok.captured.nombre,'Nuevo');assert.equal('unexpected' in ok.captured,false);count++;
 console.log('PASS '+count+' real user profile handler cases; no database, disk or network');
})().catch(e=>{console.log('FAIL '+e.name+': '+e.message);process.exitCode=1;});
