import {readFile,writeFile} from 'node:fs/promises';
import {loadEnv} from 'vite';
Object.assign(process.env,loadEnv('production',process.cwd(),'VITE_'));
const origin=process.env.VITE_SITE_URL?.replace(/\/$/,'');
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${origin?`Sitemap: ${origin}/sitemap.xml\n`:''}`);
if(origin)await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
if(origin){const url=new URL(origin);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('VITE_SITE_URL must use HTTPS.');const safe=origin.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');const html=await readFile('dist/index.html','utf8');await writeFile('dist/index.html',html.replace('</head>',`<link rel="canonical" href="${safe}/"/><meta property="og:url" content="${safe}/"/></head>`));}
