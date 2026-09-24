import {handled,checkOrigin,readJson,assert,json} from '../_lib/security.js';
import {adminDb,checked} from '../_lib/db.js';
async function handle({request,env}){
 checkOrigin(request,env);const db=await adminDb(request,env);
 const token=request.headers.get('Authorization').slice(7);
 const {data:{user},error}=await db.auth.getUser(token);assert(!error&&user,401,'Please log in again.');
 const value=await readJson(request);
 assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.installation_id),400,'Invalid device.');
 if(request.method==='DELETE'){
  checked(await db.from('push_devices').delete().eq('installation_id',value.installation_id).eq('user_id',user.id));return json({success:true});
 }
 assert(env.FIREBASE_SERVICE_ACCOUNT_JSON,503,'Phone notifications are not configured on the website yet.');
 let account;try{account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);}catch{}
 assert(account?.project_id==='apb-owner-studio'&&account?.private_key&&account?.client_email,503,'The website Firebase secret needs correcting.');
 assert(typeof value.token==='string'&&value.token.length>=20&&value.token.length<=4096,400,'Invalid notification token.');
 // Only owners may register. Re-registration replaces a rotated token for this installation.
 checked(await db.from('push_devices').upsert({installation_id:value.installation_id,user_id:user.id,token:value.token,updated_at:new Date().toISOString()},{onConflict:'installation_id'}));
 return json({success:true});
}
export const onRequestPost=handled(handle);
export const onRequestDelete=handled(handle);
