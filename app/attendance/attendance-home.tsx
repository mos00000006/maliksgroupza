'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import AttendancePanel from './attendance-panel';
import styles from './attendance.module.css';
export default function AttendanceHome(){const [stores,setStores]=useState<{name:string}[]>([]),[workspace,setWorkspace]=useState(''),[error,setError]=useState('');useEffect(()=>{let alive=true;fetch('/api/attendance',{cache:'no-store'}).then(async r=>{const b=await r.json() as {stores:{name:string}[];error?:string};if(!r.ok)throw Error(b.error);if(alive){setStores(b.stores);setWorkspace(b.stores[0]?.name||'');}}).catch(e=>alive&&setError(e.message));return()=>{alive=false;};},[]);return <main className={styles.shell}><div style={{maxWidth:1100,margin:'auto'}}><Link href="/">← Company Hub</Link><h1>Branch QR attendance</h1><p>{error}</p><label>Assigned branch <select value={workspace} onChange={e=>setWorkspace(e.target.value)}>{stores.map(s=><option key={s.name}>{s.name}</option>)}</select></label>{workspace&&<AttendancePanel key={workspace} workspace={workspace}/>}</div></main>;}
