import {createClient} from '@supabase/supabase-js';
import {assert,config} from './security.js';
export function serverDb(env){config(env);return createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function adminDb(request,env){const db=serverDb(env);const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];assert(token,401,'Please log in.');const {data,error}=await db.auth.getUser(token);assert(!error&&data.user,401,'Your session has expired. Please log in again.');const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();assert(admin,403,'This account is not authorised.');return db;}
export function checked(result){if(result.error)throw result.error;return result.data;}
