// Run locally using environment variables. Never deploy this helper or commit credentials.
import {createClient} from '@supabase/supabase-js';
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,APB_OWNER_EMAIL,APB_OWNER_PASSWORD,APB_OWNER_USER_ID}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!APB_OWNER_PASSWORD||APB_OWNER_PASSWORD.length<12)throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and APB_OWNER_PASSWORD (at least 12 characters).');
const db=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
if(process.argv.includes('--reset')){
 if(!APB_OWNER_USER_ID)throw new Error('Set the existing owner’s APB_OWNER_USER_ID.');
 const {data:admin,error:lookup}=await db.from('admin_users').select('user_id').eq('user_id',APB_OWNER_USER_ID).single();if(lookup||!admin)throw new Error('This user is not an authorised administrator.');
 const {error}=await db.auth.admin.updateUserById(APB_OWNER_USER_ID,{password:APB_OWNER_PASSWORD});if(error)throw error;
 console.log('Owner password changed. No credentials have been printed.');
}else{
 if(!APB_OWNER_EMAIL)throw new Error('Set APB_OWNER_EMAIL.');
 const {data,error}=await db.auth.admin.createUser({email:APB_OWNER_EMAIL,password:APB_OWNER_PASSWORD,email_confirm:true});if(error)throw error;
 const {error:grant}=await db.from('admin_users').insert({user_id:data.user.id});if(grant)throw new Error('User created but authorisation failed. Add its user ID to admin_users using the dashboard; do not create a duplicate account.');
 console.log('Owner account created and authorised. No credentials have been printed.');
}
