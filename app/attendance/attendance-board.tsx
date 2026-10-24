'use client';
import {useState} from 'react';
import styles from './attendance.module.css';
type Person={id:string;employee_number:string;first_name:string;last_name:string;job_title:string;status:string;state:string;last_event:string|null;employee_active:number|null;employee_workspace:string|null};
type ClockEvent={account_id:string;action:string;occurred_at:string;location_status:string};
const labels:Record<string,string>={in:'At work',break:'On break',out:'Clocked out',waiting:'Not clocked yet',pending:'Awaiting approval',blocked:'Clocking disabled'};
const dateInSA=(value:string)=>new Date(new Date(value).getTime()+7200000).toISOString().slice(0,10);
const time=(value:string|undefined)=>value?new Date(value).toLocaleTimeString('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}):'—';
export function attendanceState(person:Person,workspace:string){if(person.status==='pending')return 'pending';if(person.status!=='approved'||person.employee_active===0||(person.employee_workspace&&person.employee_workspace!==workspace))return 'blocked';if(!person.last_event)return 'waiting';return ['in','break','out'].includes(person.state)?person.state:'waiting';}
export default function AttendanceBoard({accounts,events,workspace,date}:{accounts:Person[];events:ClockEvent[];workspace:string;date:string}){
 const [filter,setFilter]=useState('all'),[search,setSearch]=useState('');
 const today=dateInSA(new Date().toISOString());
 const counts=(state:string)=>accounts.filter(a=>attendanceState(a,workspace)===state).length;
 const shown=accounts.filter(a=>(filter==='all'||attendanceState(a,workspace)===filter)&&[a.first_name,a.last_name,a.employee_number,a.job_title].join(' ').toLowerCase().includes(search.toLowerCase().trim()));
 const tiles=[{key:'in',label:'At work',hint:'Clocked in',icon:'↗'},{key:'out',label:'Clocked out',hint:'Shift ended',icon:'↙'},{key:'break',label:'On break',hint:'Taking a break',icon:'Ⅱ'},{key:'waiting',label:'Not clocked yet',hint:'No clock history',icon:'◷'},{key:'pending',label:'To approve',hint:'New registrations',icon:'+'}];
 return <div className={styles.board}>
  <div className={styles.boardHero}><div><span className={styles.boardEyebrow}>YOUR PEOPLE · YOUR BRANCH</span><h2>Who’s on the floor?</h2><p>{workspace}</p></div><div className={styles.live}><span/> Updates every 15 seconds<small>Latest recorded staff status</small></div></div>
  <div className={styles.metrics}>{tiles.map(t=><button key={t.key} aria-pressed={filter===t.key} className={`${styles.metric} ${styles[t.key]} ${filter===t.key?styles.chosen:''}`} onClick={()=>setFilter(filter===t.key?'all':t.key)}><span className={styles.metricIcon}>{t.icon}</span><strong>{counts(t.key)}</strong><span>{t.label}</span><small>{t.hint}</small></button>)}</div>
  <div className={styles.boardToolbar}><div><h3>Staff attendance</h3><p>Current status · clock times for {date===today?'today':date}</p></div><label className={styles.staffSearch}><span>Search staff</span><input type="search" placeholder="Name, employee no. or position" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
  <div className={styles.filterBar}>{['all','in','out','break','waiting','pending','blocked'].map(key=><button key={key} aria-pressed={filter===key} className={filter===key?styles.activeFilter:''} onClick={()=>setFilter(key)}>{key==='all'?'All staff':labels[key]}</button>)}</div>
  <div className={styles.staffGrid}>{shown.map(a=>{
   const state=attendanceState(a,workspace),history=events.filter(e=>e.account_id===a.id).sort((x,y)=>x.occurred_at.localeCompare(y.occurred_at));
   const firstIn=history.find(e=>e.action==='in'),lastOut=history.filter(e=>e.action==='out').at(-1),review=history.some(e=>e.location_status!=='inside');
   const stale=(state==='in'||state==='break')&&a.last_event&&dateInSA(a.last_event)!==today;
   return <article className={`${styles.staffCard} ${styles[state]}`} key={a.id}>
    <div className={styles.personTop}><span className={styles.personAvatar}>{(a.first_name[0]||'')+(a.last_name[0]||'')}</span><span className={styles.personStatus}><i/>{labels[state]}</span></div>
    <h4>{a.first_name} {a.last_name}</h4><p className={styles.personRole}>{a.job_title||'Staff member'}</p><span className={styles.employeeNumber}>{a.employee_number}</span>
    <div className={styles.clockPair}><div><span>FIRST CLOCK IN</span><b>{time(firstIn?.occurred_at)}</b></div><div><span>LATEST CLOCK OUT</span><b>{time(lastOut?.occurred_at)}</b></div></div>
    <div className={styles.cardFoot}>{a.last_event?<span>Last action {time(a.last_event)} · {dateInSA(a.last_event)===today?'today':dateInSA(a.last_event)}</span>:<span>{state==='pending'?'Manager approval needed':'No clock action recorded'}</span>}{review&&<strong>Location review</strong>}</div>
    {stale&&<p className={styles.staleNotice}>Previous-day status — check missed clock-out.</p>}
   </article>;
  })}</div>
  {!shown.length&&<div className={styles.boardEmpty}><b>{accounts.length?'No staff match this view':'Your team will appear here'}</b><p>{accounts.length?'Try another status or search term.':'Print the branch QR, then approve staff registrations to get started.'}</p></div>}
  <p className={styles.boardNote}>Status reflects the last clock action, not continuous presence. “Not clocked yet” means no clock history; it does not mean absent. Clock times above use the selected date and South African time.</p>
 </div>;
}
