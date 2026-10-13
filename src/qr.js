import qrcode from 'qrcode-generator';
qrcode.stringToBytes = text => Array.from(new TextEncoder().encode(text));
export const capacities = {L:2953,M:2331,Q:1663,H:1273};
export const byteCount = text => new TextEncoder().encode(text).length;
export function splitContent(text, level='M') {
  const limit=capacities[level];
  if (!limit) throw new Error('不支持的容错等级');
  if(byteCount(text)<=limit) return [text];
  let total=2;
  for(let attempt=0;attempt<20;attempt++) {
    const parts=[];let value='';let index=1;
    for(const char of text) {
      const header=`CHENSHOU-QR:${index}/${total}\n`;
      if(byteCount(header+value+char)>limit) {parts.push(header+value);index++;value='';}
      value+=char;
    }
    parts.push(`CHENSHOU-QR:${index}/${total}\n`+value);
    if(parts.length===total) return parts;
    total=parts.length;
  }
  throw new Error('内容过长，请减少内容');
}
export function matrix(text,level='M') {const qr=qrcode(0,level);qr.addData(text,'Byte');qr.make();return qr;}
export function safeUrl(text) {try {const url=new URL(text);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}}
export function drawQr(canvas,text,level,size) {
 const qr=matrix(text,level),count=qr.getModuleCount(),scale=Math.max(1,Math.floor(size/(count+8)));
 canvas.width=canvas.height=Math.max(size,(count+8)*scale);
 const offset=Math.floor((canvas.width-count*scale)/2);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';
 for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))ctx.fillRect(offset+col*scale,offset+row*scale,scale,scale);
}
