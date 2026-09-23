import {handled,checkOrigin,readJson,json} from '../_lib/security.js';
import {adminDb,checked} from '../_lib/db.js';
export const onRequestDelete=handled(async({request,env})=>{
 checkOrigin(request,env);const db=await adminDb(request,env),body=await readJson(request);
 checked(await db.rpc('begin_delete_entry',{p_entry:body.id}));
 const photos=checked(await db.from('showcase_images').select('path').eq('entry_id',body.id));
 if(photos.length)checked(await db.storage.from('apb-media').remove(photos.map(p=>p.path)));
 checked(await db.from('showcase_entries').delete().eq('id',body.id));
 // A concurrent upload sees finish_photo=false and removes its own object.
 return json({success:true});
});
