import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await build({entryPoints:['src/app.js'],bundle:true,outfile:'extension/app.js',minify:true,legalComments:'eof',target:'chrome110'});
await mkdir('extension/licenses',{recursive:true});
for(const name of ['jsqr','fflate'])await copyFile(`node_modules/${name}/LICENSE`,'extension/licenses/'+name+'.txt').catch(async()=>copyFile(`node_modules/${name}/LICENSE.txt`,'extension/licenses/'+name+'.txt'));

await copyFile('node_modules/qrcode-generator/qrcode.js','extension/licenses/qrcode-generator-source.js');
