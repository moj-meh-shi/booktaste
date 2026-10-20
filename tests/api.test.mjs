import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/recommend.js';
const input={first:'بوف کور',second:'مسخ',level:'l',exclude:[]};
const pick=(i=0)=>({title_fa:'کتاب '+i,title_orig:'Book '+i,author:'نویسنده',type:'علمی',stars:5,fa_published:'unsure',from_first:'تنهایی',from_second:'بیگانگی',why:'پیوند موضوعی'});
const good=()=>({first:{known:true,note:'صادق هدایت؛ تنهایی'},second:{known:true,note:'فرانتس کافکا؛ بیگانگی'},picks:Array.from({length:6},(_,i)=>pick(i))});
async function call(body=input,run=async()=>({response:good()}),headers={}){return onRequestPost({request:new Request('https://booktaste.pages.dev/api/recommend',{method:'POST',headers,body:typeof body==='string'?body:JSON.stringify(body)}),env:run?{AI:{run}}:{}});}
async function data(r){return JSON.parse((await r.json()).response);}
test('six valid recommendations, object format',async()=>{const r=await call();assert.equal(r.status,200);assert.equal((await data(r)).picks.length,6);});
test('string and fenced output',async()=>{for(const v of [JSON.stringify(good()),'```json\n'+JSON.stringify(good())+'\n```'])assert.equal((await data(await call(input,async()=>({response:v})))).picks.length,6);});
test('malformed and invalid bodies',async()=>{for(const b of ['{',null,[],{}, {...input,first:''},{...input,first:'x'.repeat(121)},{...input,exclude:[null]}])assert.equal((await call(b)).status,400);});
test('Persian/Arabic spelling and whitespace duplicates rejected',async()=>{assert.equal((await call({...input,first:'كيمياگر',second:' کیمیاگر '})).status,400);});
test('body size cap',async()=>assert.equal((await call(' '.repeat(22001))).status,413));
test('missing binding',async()=>assert.equal((await call(input,null)).status,503));
test('cross origin rejected',async()=>assert.equal((await call(input,undefined,{Origin:'https://other.example'})).status,403));
test('same origin accepted',async()=>assert.equal((await call(input,undefined,{Origin:'https://booktaste.pages.dev'})).status,200));
test('unknown input accepted without forced invention or retry',async()=>{let n=0;const r=await call(input,async()=>{n++;return {response:{...good(),first:{known:false,note:'نام نویسنده را بنویس'},picks:[]}}});assert.equal((await data(r)).picks.length,0);assert.equal(n,1);});
test('excludes input, previously read and duplicate spellings',async()=>{const g=good();g.picks=[{...pick(),title_fa:'بوف کور'},{...pick(1),title_fa:'مسخ'},pick(2),{...pick(3),title_fa:'کيمياگر'},{...pick(4),title_fa:'کیمیاگر'},pick(5)];const d=await data(await call({...input,exclude:['کتاب 2']},async()=>({response:g})));assert.deepEqual(d.picks.map(x=>x.title_fa),['کيمياگر','کتاب 5']);});
test('reject incomplete, low confidence and invalid categories',async()=>{const g=good();g.picks=[{...pick(),author:''},{...pick(1),from_second:''},{...pick(2),stars:2},{...pick(3),type:'bogus'},{...pick(4),title_fa:'English'},pick(5)];assert.equal((await data(await call(input,async()=>({response:g})))).picks.length,1);});
test('invalid output retried at most once',async()=>{let n=0;assert.equal((await call(input,async()=>{n++;return {response:'broken'}})).status,502);assert.equal(n,2);});
test('repair returns full batch',async()=>{let n=0;const r=await call(input,async()=>({response:++n===1?{...good(),picks:[pick()]}:good()}));assert.equal((await data(r)).picks.length,6);assert.equal(n,2);});
test('provider errors are not retried',async()=>{let n=0;assert.equal((await call(input,async()=>{n++;throw new Error('provider')})).status,503);assert.equal(n,1);});
test('quota error is actionable',async()=>assert.equal((await call(input,async()=>{throw new Error('daily neuron quota exceeded')})).status,429));
test('partial valid output survives failed repair',async()=>{let n=0;assert.equal((await data(await call(input,async()=>{if(++n===2)throw Error();return {response:{...good(),picks:[pick()]}}}))).picks.length,1);});
test('legacy frontend supported',async()=>assert.equal((await call({prompt:'کتاب اول: بوف کور\nکتاب دوم: مسخ\n'})).status,200));
test('GET not supported',()=>assert.equal(onRequestGet().status,405));
