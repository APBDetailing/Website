export type Service = {id:string;name:string;description:string;enabled:boolean;display_order:number;image_path:string|null;price_mode:'request'|'fixed'|'from';price:number|null;pricing_description:string;show_price:boolean};
export type Settings = {id:number;telephone:string;email:string;address:string;show_address:boolean;service_area:string;opening_hours:string;facebook_url:string;instagram_url:string;whatsapp:string;show_prices:boolean};
export type Photo = {id:string;entry_id:string;slot:number;path:string;alt:string;role:'general'|'before'|'after';display_order:number;status:'pending'|'ready';url?:string};
export type Entry = {id:string;name:string;year:number|null;description:string;service_ids:string[];published:boolean;featured:boolean;display_order:number;featured_image_id:string|null;deleting:boolean;showcase_images:Photo[]};
export const defaults: Settings = {id:1,telephone:'',email:'',address:'',show_address:false,service_area:'Selby, North Yorkshire',opening_hours:'',facebook_url:'',instagram_url:'',whatsapp:'',show_prices:false};
export const services: Service[] = [
 ['Expert Hand Wash',"Professional exterior hand washing designed to remove dirt and grime while caring for the vehicle’s finish."],
 ['Paint Correction','Machine polishing and paint enhancement to improve the appearance of swirl marks, light scratches and paint imperfections.'],
 ['Ceramic Coating','Protective coatings designed to enhance gloss and make ongoing vehicle maintenance easier.'],
 ['Interior Deep Clean','Thorough interior cleaning covering upholstery, carpets, surfaces and difficult-to-reach areas.'],
 ['Wheel & Tyre Polish',"Wheel cleaning and tyre finishing to improve the appearance of the vehicle’s wheels and tyres."]
].map(([name,description],i)=>({id:`00000000-0000-4000-8000-00000000000${i+1}`,name,description,enabled:true,display_order:i,image_path:null,price_mode:'request',price:null,pricing_description:'',show_price:false}));
export function phone(value:string) { const n=value.replace(/[\s().-]/g,''); return /^\+?[1-9]\d{7,14}$/.test(n)?n:null; }
export function whatsapp(value:string,context='') { const n=phone(value); return n?`https://wa.me/${n.replace('+','')}?text=${encodeURIComponent("Hi APB Detailing, I'd like to enquire about getting my car detailed."+(context?' '+context:''))}`:null; }
export function safeSocial(value:string) { try {const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;} }
export function priceLabel(service:Service,settings:Settings) {return settings.show_prices&&service.show_price&&service.price_mode!=='request'&&service.price!==null?`${service.price_mode==='from'?'From ':''}${new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(service.price)}`:'Price on request';}
