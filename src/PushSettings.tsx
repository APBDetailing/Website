import {useEffect,useState} from 'react';
import {api} from './client';
type Device={installation_id:string;token:string};
type Bridge={postMessage:(message:string)=>void;onmessage:((event:{data:string})=>void)|null};
declare global {interface Window {APBNotifications?:Bridge}}
const key='apb-push-installation';
export async function disconnectPush(){
 const installation_id=localStorage.getItem(key);
 if(installation_id)await api('push-device',{installation_id},'DELETE');
 window.APBNotifications?.postMessage('disable');localStorage.removeItem(key);
}
export default function PushSettings(){
 const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[available,setAvailable]=useState(false);
 useEffect(()=>{
  const bridge=window.APBNotifications;if(!bridge)return;setAvailable(true);let live=true;
  bridge.onmessage=async event=>{try{
   const value=JSON.parse(event.data) as Device&{error?:string};if(value.error)throw new Error(value.error);
   await api('push-device',value);localStorage.setItem(key,value.installation_id);bridge.postMessage('registered');if(live)setNotice('Phone alerts connected. New enquiries will open this inbox.');
  }catch(error){if(live)setNotice(error instanceof Error?error.message:'Could not enable alerts.');}finally{if(live)setBusy(false);}};
  // Renew a previously enabled installation after token rotation or app update.
  const renew=()=>{if(localStorage.getItem(key)){setBusy(true);bridge.postMessage('renew');}};
  renew();window.addEventListener('apb-resume',renew);
  return()=>{live=false;bridge.onmessage=null;window.removeEventListener('apb-resume',renew);};
 },[]);
 if(!available)return null;
 return <section className="admin-card"><h2>Phone notifications</h2><p>Get an alert with the customer’s name and requested service. Tap it to open Messages.</p><div className="actions"><button className="button" disabled={busy} onClick={()=>{setBusy(true);setNotice('Connecting…');window.APBNotifications?.postMessage('request');}}>Enable phone alerts</button><button className="button secondary" disabled={busy} onClick={async()=>{setBusy(true);try{await disconnectPush();setNotice('Phone alerts turned off for this device.');}catch(e){setNotice(e instanceof Error?e.message:'Could not disconnect. Try again.');}finally{setBusy(false);}}}>Turn off alerts</button></div><p role="status">{notice}</p></section>;
}
