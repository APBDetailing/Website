/** Decode one image at a time to limit memory on phones. Re-encoding removes EXIF/GPS metadata. */
export async function compressPhoto(file:File,onProgress:(message:string)=>void=()=>{}):Promise<Blob>{
 if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)&&!(/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)))throw new Error('Choose a JPEG, PNG, WebP or a phone photo your browser can open.');
 if(file.size>60*1024*1024)throw new Error('This photograph is over 60 MB. Export a smaller copy from your phone first.');
 onProgress('Opening photograph…');let source:ImageBitmap|HTMLImageElement;let url='';
 try{
  try{source=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{
   url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();source=img;
  }
 }catch{if(url)URL.revokeObjectURL(url);throw new Error('This photograph could not be opened. For HEIC photos, export a JPEG copy from Photos and try again. Nothing was uploaded.');}
 try{
  const width=source instanceof HTMLImageElement?source.naturalWidth:source.width,height=source instanceof HTMLImageElement?source.naturalHeight:source.height;
  if(!width||!height)throw new Error('The photograph is empty.');
  let ratio=Math.min(1,1920/Math.max(width,height));const canvas=document.createElement('canvas');
  const encode=(quality:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?.type==='image/webp'?resolve(b):reject(new Error('Your browser cannot create WebP photos. Please use an up-to-date browser. Nothing was uploaded.')),'image/webp',quality));
  for(let pass=0;pass<4;pass++){
   canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your phone could not process this photograph. Try closing other tabs.');
   ctx.drawImage(source,0,0,canvas.width,canvas.height);
   onProgress(`Optimising ${canvas.width} × ${canvas.height} photograph…`);
   for(const quality of [.9,.84,.78,.72]){const blob=await encode(quality);if(blob.size<=500000){canvas.width=canvas.height=1;return blob;}}
   // Preserve detail with moderate quality, then modestly reduce dimensions if exceptionally complex.
   ratio*=.85;
  }
  throw new Error('This photograph could not be compressed safely. Please export a smaller copy and try again. Nothing was uploaded.');
 }finally{if('close' in source)source.close();if(url)URL.revokeObjectURL(url);}
}
