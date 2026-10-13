import {readFile,access} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('extension/manifest.json','utf8'));
for(const file of [manifest.action.default_popup,'app.js','style.css',manifest.icons['128']])await access('extension/'+file);
if(manifest.manifest_version!==3)throw Error('Expected Manifest V3');
console.log('插件文件与 Manifest 验证通过');
