import {createClient} from '@supabase/supabase-js';
export async function onRequestGet({request,env,params}){
 const id=String(params.id);let row=null,unavailable=false;
 if(/^[0-9a-f-]{36}$/i.test(id)&&env.SUPABASE_URL&&env.SUPABASE_ANON_KEY){try{const db=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});const {data,error}=await db.from('showcase_entries').select('id,name,description').eq('id',id).eq('published',true).eq('deleting',false).abortSignal(AbortSignal.timeout(8000)).maybeSingle();row=data;unavailable=!!error;}catch{unavailable=true;}}
 const asset=await env.ASSETS.fetch(new Request(new URL('/index.html',request.url)));
 const response=new Response(asset.body,{status:row?200:unavailable?503:404,headers:asset.headers});
 response.headers.set('Cache-Control','no-store');
 if(!row){response.headers.set('X-Robots-Tag','noindex');return response;}
 const title=`${row.name} | APB Detailing, Selby`,description=(row.description||`Explore ${row.name} in the APB Detailing vehicle portfolio.`).slice(0,180);
 const origin=env.SITE_URL?.replace(/\/$/,'');
 return new HTMLRewriter().on('title',{element:e=>e.setInnerContent(title)}).on('meta[name="description"], meta[property="og:description"]',{element:e=>e.setAttribute('content',description)}).on('meta[property="og:title"]',{element:e=>e.setAttribute('content',title)}).on('meta[property="og:url"]',{element:e=>{if(origin)e.setAttribute('content',origin+'/work/'+row.id);}}).on('link[rel="canonical"]',{element:e=>{if(origin)e.setAttribute('href',`${origin}/work/${row.id}`);}}).transform(response);
}
