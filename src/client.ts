import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key?createClient(url,key):null;
export const media=(path:string)=>`/api/media?path=${encodeURIComponent(path)}`;
export async function api(path:string,body:unknown,method='POST') {
 const {data}=await db!.auth.getSession();
 const result=await fetch(`/api/${path}`,{method,headers:{Authorization:`Bearer ${data.session?.access_token}`,...(!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:JSON.stringify(body)});
 const value=await result.json();if(!result.ok)throw new Error(value.error||'Something went wrong. Please try again.');return value;
}
