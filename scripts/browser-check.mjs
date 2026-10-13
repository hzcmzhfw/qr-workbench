import {chromium} from 'playwright';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
const profile=await mkdtemp(path.join(tmpdir(),'qr-check-')),extension=path.resolve('extension');
const context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chromium',args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
try{
const page=await context.newPage();await page.goto('https://example.com');
// Manifest popup-only extensions have no service worker: find the installed ID via chrome://extensions.
const manager=await context.newPage();await manager.goto('chrome://extensions');
const extensionId=await manager.evaluate(()=>document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').id);
await manager.close();
const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/index.html`);await popup.locator('#content').fill('https://example.com/中文');await popup.waitForTimeout(400);assert.equal(await popup.locator('#preview canvas').count(),1);
const downloadPromise=popup.waitForEvent('download');await popup.locator('#download').click();const download=await downloadPromise;const file=await download.path();
await popup.locator('#scan-tab').click();await popup.locator('#file').setInputFiles({name:'qr.png',mimeType:'image/png',buffer:await (await import('node:fs/promises')).readFile(file)});await popup.waitForFunction(()=>document.getElementById('result').value.length>0);assert.equal(await popup.locator('#result').inputValue(),'https://example.com/中文');assert.ok(await popup.locator('#open-result').isVisible());
await popup.locator('#generate-tab').click();await popup.locator('#content').fill('中文😀'.repeat(700));await popup.waitForTimeout(500);assert.ok(await popup.locator('#preview canvas').count()>1);assert.equal(await popup.locator('#download').textContent(),'下载全部 ZIP');
const zipDownload=popup.waitForEvent('download');await popup.locator('#download').click();const zipPath=await (await zipDownload).path();
await popup.locator('#scan-tab').click();await popup.locator('#file').setInputFiles({name:'parts.zip',mimeType:'application/zip',buffer:await (await import('node:fs/promises')).readFile(zipPath)});await popup.waitForFunction(()=>document.getElementById('status').textContent.startsWith('识别完成'),{},{timeout:30000});assert.equal(await popup.locator('#result').inputValue(),'中文😀'.repeat(700));assert.ok((await popup.locator('#status').textContent()).includes('分片已还原'));
const {zipSync}=await import('fflate');const png=await (await import('node:fs/promises')).readFile(file);await popup.locator('#file').setInputFiles({name:'mixed.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'nested/ok.png':png,'bad.png':new Uint8Array([1,2,3]),'notes.txt':new Uint8Array([1])}))});await popup.waitForFunction(()=>document.getElementById('status').textContent.startsWith('识别完成'));assert.equal(await popup.locator('#batch-results article').count(),2);assert.ok((await popup.locator('#status').textContent()).includes('成功 1 / 2'));
await popup.locator('#generate-tab').click();
await popup.locator('#content').fill('https://example.com/');await popup.waitForTimeout(400);await popup.setViewportSize({width:480,height:600});await popup.screenshot({path:'dist/popup-preview.png'});
console.log('隔离扩展浏览器验证通过：编辑、PNG 下载、图片识别、ZIP 上传分片还原、混合包逐图结果、布局');
}finally{await context.close();await rm(profile,{recursive:true,force:true});}
