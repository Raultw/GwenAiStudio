// Handler wiring test. Credential rules are tested in test_atomic_admin_reset.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'node_modules/typescript'));
const src=ts.createSourceFile('server.ts',fs.readFileSync(path.join(root,'server.ts'),'utf8'),ts.ScriptTarget.Latest,true);
let handler;function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(src)==='app.post'&&n.arguments[0]?.text==='/api/auth/password-change')handler=n.arguments.at(-1);ts.forEachChild(n,visit);}visit(src);assert.ok(handler);
const code=ts.transpileModule('const handler='+handler.getText(src),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
async function run(body,result='ok'){let count=0,status=200,payload;const ctx={changeOwnPassword:async(id,old,next)=>{count++;assert.equal(id,'session-user');if(result==='fail')throw Error('Controlled failure');return result==='missing'?null:{id};}};vm.createContext(ctx);vm.runInContext(code+';globalThis.runHandler=handler;',ctx);const res={status:n=>{status=n;return res;},json:p=>{payload=p;return res;}};await ctx.runHandler({body,user:{id:'session-user'}},res);return {count,status,payload};}
(async()=>{let passed=0;for(const value of [null,{},[],42,true,''])for(const field of ['currentPassword','newPassword']){const r=await run({currentPassword:'Old!7xxx',newPassword:'New!8xxx',[field]:value});assert.equal(r.status,400);assert.equal(r.count,0);passed++;}
for(const [mode,status] of [['ok',200],['missing',401],['fail',400]]){const r=await run({currentPassword:'Old!7xxx',newPassword:'New!8xxx',userId:'forged'},mode);assert.equal(r.status,status);assert.equal(r.count,1);assert.equal(r.payload.success===true,mode==='ok');passed++;}
console.log('PASS '+passed+' isolated endpoint wiring cases');})().catch(e=>{console.log('FAIL '+e.name);process.exitCode=1;});
