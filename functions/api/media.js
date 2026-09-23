import {createClient} from '@supabase/supabase-js';
import {handled,assert} from '../_lib/security.js';
export const onRequestGet=handled(async({request,env})=>{
 assert(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY,503,'Photographs are unavailable.');
 const path=new URL(request.url).searchParams.get('path');assert(path&&/^(vehicles\/[0-9a-f-]+\/[0-9a-f-]+|services\/[0-9a-f-]+)\.webp$/.test(path),404,'Photograph not found.');
 const db=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
 const {data,error}=await db.storage.from('apb-media').download(path);assert(!error&&data,404,'Photograph not found.');
 return new Response(data,{headers:{'Content-Type':'image/webp','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
});
