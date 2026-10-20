// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE when using a system Chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
 let checks=0;
 try{for(const width of [320,360,390,768,1366]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve(__dirname,'../index.html'));
  await page.locator('#a').fill('بوف کور');await page.locator('#b').fill('مسخ');
  assert.equal(await page.locator('#go').isDisabled(),false);
  for(const theme of ['dark','light']){
   await page.locator('#theme').click();
   const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(dimensions.scroll<=dimensions.width,JSON.stringify({width,theme,...dimensions}));checks++;
  }
  await page.reload();await page.locator('#a').fill('کیمیاگر');await page.locator('#b').fill('كيمياگر');await page.locator('#go').click();
  assert.match(await page.locator('#out').innerText(),/متفاوت/);assert.deepEqual(errors,[]);
  console.log('PASS layout, theme, reload, validation at '+width+'px');await page.close();
 }}finally{await browser.close()}
 console.log(checks+' responsive theme combinations passed');
})().catch(e=>{console.error(e);process.exit(1)});
