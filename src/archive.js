import {Unzip,UnzipInflate} from 'fflate';
const MB=1024*1024;
export function extractImages(data){
 if(data.length>20*MB)throw new Error('ZIP 超过 20 MB');
 if(data.length<4||data[0]!==80||data[1]!==75)throw new Error('不是有效的 ZIP 文件');
 const images=[];let entry_count=0,byte_count=0,pending_count=0;
 const unzip=new Unzip(file=>{
  if(++entry_count>1000)throw new Error('ZIP 文件条目过多');
  if(file.name.startsWith('__MACOSX/')||! /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name))return;
  if(images.length>=100)throw new Error('ZIP 最多支持 100 张图片');
  if(file.originalSize>20*MB)throw new Error('ZIP 中单张图片超过 20 MB');
  const item={file_name:file.name,image_data:null};images.push(item);pending_count++;
  let image_byte_count=0;const chunks=[];
  file.ondata=(error,chunk,final)=>{
   if(error)throw new Error('无法解压 ZIP：'+error.message);
   byte_count+=chunk.length;image_byte_count+=chunk.length;
   if(byte_count>50*MB||image_byte_count>20*MB){file.terminate();throw new Error('ZIP 解压内容过大（总计最多 50 MB，单图最多 20 MB）');}
   chunks.push(chunk);
   if(final){const result=new Uint8Array(image_byte_count);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}item.image_data=result;pending_count--;}
  };file.start();
 });
 unzip.register(UnzipInflate);
 for(let i=0;i<data.length;i+=1024)unzip.push(data.subarray(i,i+1024),i+1024>=data.length);
 if(pending_count)throw new Error('ZIP 内容不完整');
 if(!images.length)throw new Error('ZIP 中没有支持的图片（PNG/JPG/WebP/GIF/BMP）');
 return images.sort((a,b)=>a.file_name.localeCompare(b.file_name,undefined,{numeric:true}));
}
export function mergeFragments(texts){
 if(!texts.length)return null;
 const fragments=texts.map(text=>/^CHENSHOU-QR:(\d+)\/(\d+)\n([\s\S]*)$/.exec(text));
 if(!fragments.some(Boolean))return null;
 if(fragments.some(item=>!item))throw new Error('含普通二维码或识别失败，无法自动合并分片');
 const total=Number(fragments[0][2]),ordered=new Map();
 for(const part of fragments){const index=Number(part[1]);if(Number(part[2])!==total||index<1||index>total)throw new Error('分片组或编号不一致');if(ordered.has(index))throw new Error('存在重复分片，无法自动合并');ordered.set(index,part[3]);}
 if(total!==ordered.size)throw new Error(`分片不完整：需要 ${total} 片，识别到 ${ordered.size} 片`);
 return Array.from({length:total},(_,index)=>ordered.get(index+1)).join('');
}
