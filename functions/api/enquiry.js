import {handled,checkOrigin,readJson,validateEnquiry,assert,json} from '../_lib/security.js';
import {serverDb,checked} from '../_lib/db.js';
export const onRequestPost=handled(async({request,env})=>{
 checkOrigin(request,env);const value=await readJson(request),enquiry=validateEnquiry(value);
 assert(env.TURNSTILE_SECRET_KEY&&env.RATE_LIMIT_SALT?.length>=32,503,'The enquiry form is temporarily unavailable. Please try again later.');
 const db=serverDb(env),ip=request.headers.get('CF-Connecting-IP');assert(ip,503,'Unable to verify this request.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.RATE_LIMIT_SALT+ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const allowed=checked(await db.rpc('consume_rate_limit',{p_key:`ip:${hash}`,p_seconds:900,p_limit:5}));
 assert(allowed,429,'Too many attempts. Please wait 15 minutes before trying again.');
 const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:value.token,remoteip:ip}),signal:AbortSignal.timeout(10000)});
 assert(verify.ok,503,'The security check is unavailable. Please try again shortly.');const result=await verify.json();
 assert(result.success&&result.action==='quote'&&result.hostname===new URL(env.SITE_URL).hostname,400,'The security check expired. Please try again.');
 const {data:service}=await db.from('services').select('name').eq('id',enquiry.service_id).eq('enabled',true).maybeSingle();assert(service,400,'Please choose an available service.');
 checked(await db.from('enquiries').insert({...enquiry,service_name:service.name}));return json({success:true});
});
