import React,{Suspense,lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {PublicSite} from './public';
import './style.css';
const Admin=lazy(()=>import('./admin'));
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="section"><h1>Something didn’t load.</h1><p>Please refresh the page and try again.</p><a href="/">Back to APB Detailing</a></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary>{location.pathname.startsWith('/admin')?<Suspense fallback={<main className="section">Loading your workspace…</main>}><Admin/></Suspense>:<PublicSite/>}</ErrorBoundary></React.StrictMode>);
