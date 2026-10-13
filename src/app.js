import jsQR from 'jsqr';
import {extractImages,mergeFragments} from './archive.js';
import {zipSync} from 'fflate';
import {splitContent,byteCount,capacities,drawQr,safeUrl} from './qr.js';
const $=id=>document.getElementById(id);let parts=[],scanToken=0,previewUrl;
const full=new URL(location.href).searchParams.has('full');document.body.className=full?'full':'popup';
function status(message){$('status').textContent=message;}
function render(){
 $('preview').replaceChildren();parts=[];$('download').disabled=true;$('part-info').textContent='';
 const text=$('content').value,level=$('level').value;
 $('capacity').textContent=`UTF-8 ${byteCount(text)} 字节 / 单码容量 ${capacities[level]} 字节`;
 if(!text.trim())return;
 try{parts=splitContent(text,level);if(parts.length>60)throw new Error('内容过长，请控制在 60 个分片以内');
 for(const part of parts){const canvas=document.createElement('canvas');drawQr(canvas,part,level,Number($('size').value));$('preview').append(canvas);}
 $('download').disabled=false;$('download').textContent=parts.length>1?'下载全部 ZIP':'下载 PNG';
 $('part-info').textContent=parts.length>1?`${parts.length} 个分片 · 按顺序去除 CHENSHOU-QR 首行后拼接还原。实际导出尺寸按整数模块对齐。`:`实际导出 ${$('preview').firstChild.width} × ${$('preview').firstChild.height} px（按整数模块对齐）`;
 }catch(error){parts=[];$('preview').replaceChildren();status('生成失败：'+error.message);}
}
let timer;for(const id of ['content','size','level'])$(id).addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{status('');render();},180);});
async function current(){try{if(!globalThis.chrome?.tabs)throw new Error('请在 Chrome 插件中使用当前网址');const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url)throw new Error('无法读取此页面网址，请手动输入');$('content').value=tab.url;render();}catch(error){status(error.message);}}
$('current').onclick=current;
$('expand').onclick=()=>{const url=new URL(chrome.runtime.getURL('index.html'));url.searchParams.set('full','1');url.searchParams.set('text',$('content').value);chrome.tabs.create({url:url.href});};
if(full){$('expand').hidden=true;$('content').value=new URL(location.href).searchParams.get('text')||'';render();}else current();
function switchTab(scan){$('generate').hidden=scan;$('scan').hidden=!scan;for(const [id,active] of [['generate-tab',!scan],['scan-tab',scan]]){$(id).classList.toggle('selected',active);$(id).setAttribute('aria-pressed',String(active));}status('');}
$('generate-tab').onclick=()=>switchTab(false);$('scan-tab').onclick=()=>switchTab(true);
async function copy(text){if(!text){status('暂无可复制内容');return;}try{await navigator.clipboard.writeText(text);status('已复制');}catch{status('复制失败，请选中文字后手动复制');}}
$('copy-content').onclick=()=>copy($('content').value);$('copy-result').onclick=()=>copy($('result').value);
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('download').onclick=async()=>{try{const canvases=[...$('preview').children];const blobs=await Promise.all(canvases.map(canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片导出失败')),'image/png'))));if(blobs.length===1)download(blobs[0],'qrcode.png');else{const files={};for(let i=0;i<blobs.length;i++)files[`qrcode-${String(i+1).padStart(3,'0')}.png`]=new Uint8Array(await blobs[i].arrayBuffer());download(new Blob([zipSync(files)]),'qrcode-parts.zip');}status('已发起下载');}catch(error){status(error.message);}};
async function decodeImage(file){
 let bitmap;
 try{bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000)throw new Error('图片尺寸过大，请缩小后重试');
 const canvas=document.createElement('canvas');
 for(const maxSize of [1200,2400]){const scale=Math.min(1,maxSize/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const found=jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});if(found)return found.data;}
 throw new Error('未找到二维码，请使用清晰、完整的二维码图片');
 }finally{bitmap?.close();}
}
function setResult(text){$('result').value=text;const link=safeUrl(text);$('open-result').hidden=!link;if(link)$('open-result').href=link;else $('open-result').removeAttribute('href');}
function showBatch(item){const row=document.createElement('article'),name=document.createElement('strong'),value=document.createElement('p');name.textContent=item.file_name;value.textContent=item.error_message||item.result_text;row.append(name,value);
 if(!item.error_message){const button=document.createElement('button');button.textContent='复制';button.onclick=()=>copy(item.result_text);row.append(button);const link=safeUrl(item.result_text);if(link){const anchor=document.createElement('a');anchor.href=link;anchor.textContent='打开链接 ↗';anchor.target='_blank';anchor.rel='noopener noreferrer';row.append(anchor);}}
 $('batch-results').append(row);
}
async function scan(file){const token=++scanToken;setResult('');$('batch-results').replaceChildren();$('scan-preview').hidden=true;if(previewUrl)URL.revokeObjectURL(previewUrl);
 if(!file){status('请选择图片或 ZIP 文件');return;}if(file.size>20*1024*1024){status('文件超过 20 MB，请压缩后重试');return;}
 const is_zip=/\.zip$/i.test(file.name)||['application/zip','application/x-zip-compressed'].includes(file.type);
 if(!is_zip&&!file.type.startsWith('image/')&&!/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)){status('请选择图片或 ZIP 文件');return;}
 status(is_zip?'正在本地解压 ZIP…':'正在本地识别…');
 try{
 if(!is_zip){const text=await decodeImage(file);if(token!==scanToken)return;previewUrl=URL.createObjectURL(file);$('scan-preview').src=previewUrl;$('scan-preview').hidden=false;setResult(text);status('识别成功，图片未上传');return;}
 const data=new Uint8Array(await file.arrayBuffer());if(token!==scanToken)return;const images=extractImages(data),results=[];
 for(let index=0;index<images.length;index++){
  if(token!==scanToken)return;status(`正在识别 ${index+1}/${images.length}：${images[index].file_name}`);
  await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanToken)return;
  const item={file_name:images[index].file_name,result_text:'',error_message:''};
  try{item.result_text=await decodeImage(new Blob([images[index].image_data]));}catch(error){item.error_message=error.message;}
  if(token!==scanToken)return;results.push(item);showBatch(item);images[index].image_data=null;
 }
 const success=results.filter(item=>!item.error_message);let merge_message='';
 try{const merged=mergeFragments(results.map(item=>item.error_message?'':item.result_text));if(merged!==null){setResult(merged);merge_message=' · 分片已还原';}else setResult(success.map(item=>`${item.file_name}\n${item.result_text}`).join('\n\n'));}
 catch(error){setResult(success.map(item=>`${item.file_name}\n${item.result_text}`).join('\n\n'));merge_message=' · '+error.message;}
 status(`识别完成：成功 ${success.length} / ${images.length}${merge_message}，文件未上传`);
 }catch(error){if(token===scanToken)status('识别失败：'+error.message);}
}
$('file').onchange=event=>scan(event.target.files[0]);$('drop').ondragover=event=>event.preventDefault();$('drop').ondrop=event=>{event.preventDefault();scan(event.dataTransfer.files[0]);};
document.addEventListener('paste',event=>{const file=[...event.clipboardData.items].find(item=>item.type.startsWith('image/'))?.getAsFile();if(file){event.preventDefault();switchTab(true);scan(file);}});
