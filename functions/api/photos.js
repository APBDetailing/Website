import {handled,assert,checkOrigin,limitedBody,webpDimensions,readJson,json} from '../_lib/security.js';
import {adminDb,checked} from '../_lib/db.js';
export const onRequestPost=handled(async({request,env})=>{
 checkOrigin(request,env);const db=await adminDb(request,env);
 const bytes=await limitedBody(request,530000);const form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData();
 const file=form.get('photo'),entry=form.get('entry_id'),service=form.get('service_id');
 assert(file instanceof File&&file.size<=512000&&file.type==='image/webp',400,'Please upload a compressed WebP photograph under 500 KB.');webpDimensions(new Uint8Array(await file.arrayBuffer()));
 assert((!!entry)!=(!!service),400,'Choose a vehicle or service.');
 if(service){
   const row=checked(await db.from('services').select('id,image_path').eq('id',service).single());
   // One deterministic object per service prevents orphan accumulation during concurrent replacements.
   const path=`services/${row.id}.webp`;
   checked(await db.storage.from('apb-media').upload(path,file,{contentType:'image/webp',upsert:true,cacheControl:'0'}));
   checked(await db.from('services').update({image_path:path}).eq('id',row.id));return json({path});
 }
 const reserved=checked(await db.rpc('reserve_photo',{p_entry:entry}));
 try{
   checked(await db.storage.from('apb-media').upload(reserved.path,file,{contentType:'image/webp',upsert:false,cacheControl:'0'}));
   const done=checked(await db.rpc('finish_photo',{p_id:reserved.id}));assert(done,409,'This vehicle was removed while the photograph was uploading.');
   return json({id:reserved.id});
 }catch(e){
   const cleanup=await db.storage.from('apb-media').remove([reserved.path]);
   if(!cleanup.error)await db.from('showcase_images').delete().eq('id',reserved.id);
   // Keep the pending slot if cleanup fails; owner can retry its delete in the admin.
   throw e;
 }
});
export const onRequestDelete=handled(async({request,env})=>{
 checkOrigin(request,env);const db=await adminDb(request,env),body=await readJson(request);
 if(body.service_id){const s=checked(await db.from('services').select('image_path').eq('id',body.service_id).single());if(s.image_path)checked(await db.storage.from('apb-media').remove([s.image_path]));checked(await db.from('services').update({image_path:null}).eq('id',body.service_id));return json({success:true});}
 const row=checked(await db.from('showcase_images').select('*').eq('id',body.id).single());
 checked(await db.rpc('prepare_delete_photo',{p_id:row.id}));
 checked(await db.storage.from('apb-media').remove([row.path]));
 checked(await db.from('showcase_images').delete().eq('id',row.id));return json({success:true});
});
