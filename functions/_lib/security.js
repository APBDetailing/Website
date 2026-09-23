export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function assert(condition,status,message){if(!condition)throw new HttpError(status,message);}
export function config(env){assert(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY&&env.SUPABASE_SERVICE_ROLE_KEY,503,'This service is not connected yet. Please try again later.');}
export function checkOrigin(request,env){
 const origin=request.headers.get('Origin');const expected=env.SITE_URL?.replace(/\/$/,'');
 assert(expected&&origin===expected,403,'This request could not be verified. Please use the website form.');
}
export async function limitedBody(request,max=16000){
 assert(request.body,400,'Request is empty.');
 assert(Number(request.headers.get('content-length')||0)<=max,413,'The upload is too large.');
 const reader=request.body.getReader();let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'The upload is too large.');}chunks.push(value);}
 const all=new Uint8Array(size);let i=0;for(const chunk of chunks){all.set(chunk,i);i+=chunk.length;}return all;
}
export async function readJson(request,max=16000){try{return JSON.parse(new TextDecoder().decode(await limitedBody(request,max)));}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Please check the form and try again.');}}
export function validateEnquiry(value){
 assert(value&&typeof value==='object',400,'Please complete the form.');
 const field=(key,min,max)=>{const val=typeof value[key]==='string'?value[key].trim():'';assert(val.length>=min&&val.length<=max,400,`Please check your ${key.replace('_',' ')}.`);return val;};
 const name=field('name',1,100),email=field('email',3,254),telephone=field('telephone',7,30),vehicle=field('vehicle',0,150),message=field('message',10,5000),service_id=field('service_id',36,36);
 assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),400,'Please enter a valid email address.');
 assert(/^[+\d\s().-]+$/.test(telephone)&&telephone.replace(/\D/g,'').length>=7,400,'Please enter a valid telephone number.');
 assert(/^[0-9a-f-]{36}$/i.test(service_id),400,'Please choose a service.');
 assert(value.privacy_acknowledged===true,400,'Please acknowledge the privacy information.');
 assert(typeof value.token==='string'&&value.token.length>0&&value.token.length<=2048,400,'Please complete the security check.');
 assert(!value.website,400,'Unable to send this enquiry.');
 return {name,email,telephone,vehicle,message,service_id,privacy_acknowledged:true};
}
// Parse WebP dimensions without a heavyweight image decoder in the edge function.
export function webpDimensions(bytes){
 const tag=(n)=>String.fromCharCode(...bytes.slice(n,n+4));
 assert(bytes.length>=30&&tag(0)==='RIFF'&&tag(8)==='WEBP',400,'Please upload an optimised WebP photograph.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert(view.getUint32(4,true)+8===bytes.length,400,'The photograph is incomplete.');
 let canvas=null,frame=null;
 for(let i=12;i+8<=bytes.length;){const kind=tag(i),len=view.getUint32(i+4,true),p=i+8;assert(p+len<=bytes.length,400,'The photograph is incomplete.');let w,h;
  assert(kind!=='ANIM'&&kind!=='ANMF',400,'Animated images are not supported.');
  if(kind==='VP8X'&&len>=10){w=1+(bytes[p+4]|bytes[p+5]<<8|bytes[p+6]<<16);h=1+(bytes[p+7]|bytes[p+8]<<8|bytes[p+9]<<16);assert(!(bytes[p]&2),400,'Animated images are not supported.');}
  else if(kind==='VP8 '&&len>=10){assert(bytes[p+3]===0x9d&&bytes[p+4]===1&&bytes[p+5]===0x2a,400,'Invalid photograph.');w=view.getUint16(p+6,true)&0x3fff;h=view.getUint16(p+8,true)&0x3fff;}
  else if(kind==='VP8L'&&len>=5){assert(bytes[p]===0x2f,400,'Invalid photograph.');const bits=view.getUint32(p+1,true);w=(bits&0x3fff)+1;h=((bits>>>14)&0x3fff)+1;}
  if(w&&h){assert(w<=1920&&h<=1920,400,'Please resize the photograph to 1920 pixels or less.');if(kind==='VP8X')canvas={width:w,height:h};else{assert(!frame,400,'Use a single still photograph.');frame={width:w,height:h};}}i=p+len+(len%2);
 }
 assert(frame&&(!canvas||(canvas.width===frame.width&&canvas.height===frame.height)),400,'Could not read the photograph.');return frame;
}
export function handled(handler){return async context=>{try{return await handler(context);}catch(e){if(!(e instanceof HttpError))console.error('APB request failed',e?.code||e?.name||'unknown');return json({error:e instanceof HttpError?e.message:'Something went wrong. Please try again shortly.'},e.status||503);}};}
