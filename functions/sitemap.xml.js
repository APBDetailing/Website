import {createClient} from '@supabase/supabase-js';
const escape=s=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export async function onRequestGet({env}){
 if(!env.SITE_URL)return new Response('Sitemap not configured',{status:503});
 const origin=env.SITE_URL.replace(/\/$/,'');let entries=[];
 if(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY){try{const db=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});const {data}=await db.from('showcase_entries').select('id').eq('published',true).eq('deleting',false).abortSignal(AbortSignal.timeout(5000));entries=data||[];}catch{}}
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...entries.map(e=>`/work/${e.id}`)].map(p=>`<url><loc>${escape(origin+p)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
}
