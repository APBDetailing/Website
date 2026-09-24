const encode=value=>btoa(typeof value==='string'?value:String.fromCharCode(...new Uint8Array(value))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export async function firebaseAccess(account,fetcher=fetch){
 if(account.project_id!=='apb-owner-studio'||!account.client_email||!account.private_key)throw new Error('FirebaseConfiguration');
 const now=Math.floor(Date.now()/1000);
 const header=encode(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const body=encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const bytes=Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(header+'.'+body));
 const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:header+'.'+body+'.'+encode(signature)}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('FirebaseAuthentication');const result=await response.json();if(!result.access_token)throw new Error('FirebaseAuthentication');return result.access_token;
}
export function pushPayload(token,enquiry){return {message:{token,data:{enquiry_id:String(enquiry.id),title:'New APB enquiry',body:`${enquiry.name} · ${enquiry.service_name}`.slice(0,180)},android:{priority:'high',ttl:'3600s',collapse_key:String(enquiry.id)}}};}
export async function notifyEnquiry(db,env,enquiry,fetcher=fetch){
 if(!env.FIREBASE_SERVICE_ACCOUNT_JSON)return;
 const {data:devices,error}=await db.from('push_devices').select('installation_id,token').order('updated_at',{ascending:false}).limit(20);
 if(error)throw new Error('PushDeviceLookup');if(!devices?.length)return;
 const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON),access=await firebaseAccess(account,fetcher);
 await Promise.all(devices.map(async device=>{
  const url=`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const options={method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify(pushPayload(device.token,enquiry))};
  let response=await fetcher(url,{...options,signal:AbortSignal.timeout(8000)});
  if(response.status>=500)response=await fetcher(url,{...options,signal:AbortSignal.timeout(8000)});
  if(response.ok)return;
  const result=await response.json().catch(()=>({}));
  if(result.error?.details?.some(d=>d.errorCode==='UNREGISTERED')){
   await db.from('push_devices').delete().eq('installation_id',device.installation_id).eq('token',device.token);return;
  }
  // No customer details, tokens or private credentials in logs.
  console.error('APB push delivery failed',response.status);
 }));
}
