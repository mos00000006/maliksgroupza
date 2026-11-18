import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../app/phase-eight.css',import.meta.url),'utf8');

function extractHandler(context){
  const start=page.indexOf('  const openNotification = (item: HubNotification) => {');
  const end=page.indexOf('  const markAllRead = async () => {',start);
  assert.ok(start>0&&end>start,'notification handler exists');
  const code=page.slice(start,end).replace('(item: HubNotification)', '(item)').replaceAll(' as Task','');
  const dependencies=['setNotificationsOpen','setNotifications','fetch','loadNotifications','setActive','setSearch',
    'window','tasks','setReturnWorkspaceAfterTask','detail','flash','setSelected','setComments','setFiles'];
  return new Function(...dependencies,`${code}\nreturn openNotification;`)(...dependencies.map(key=>context[key]));
}

function harness(options={}){
  const events=[];
  let releaseRead;
  let notifications=[{id:25,task_id:17,read_at:''}];
  const task={id:17,title:'Stock counts instore and grv procedure'};
  const context={
    setNotificationsOpen:()=>events.push('close-inbox'),
    setNotifications:fn=>{notifications=fn(notifications);events.push('mark-read-local');},
    fetch:(url,init)=>{
      events.push('fetch:'+url);
      if(url==='/api/notifications'){
        assert.equal(init.method,'POST');
        assert.equal(JSON.parse(init.body).id,25);
        return new Promise(resolve=>{releaseRead=resolve;});
      }
      if(url==='/api/tasks/17')return Promise.resolve({ok:true,json:async()=>({task,comments:[],attachments:[]})});
      throw new Error('Unexpected fetch '+url);
    },
    loadNotifications:async()=>{events.push('refresh-inbox');},
    setActive:x=>events.push('navigate:'+x),
    setSearch:()=>{},window:{setTimeout:fn=>fn(),dispatchEvent:()=>{}},
    tasks:options.noCache?[]:[task],
    setReturnWorkspaceAfterTask:()=>{},
    detail:async t=>{assert.equal(t.id,17);events.push('open-task-panel');},
    flash:text=>events.push('flash:'+text),
    setSelected:()=>events.push('open-fetched-task'),
    setComments:()=>{},setFiles:()=>{},
  };
  return {events,context,task,open:extractHandler(context),getNotifications:()=>notifications,releaseRead:()=>releaseRead({ok:true})};
}

test('notification has a real, keyboard-accessible Open Task button with navy/gold styling',()=>{
  assert.match(page,/className="notificationOpenBtn"/);
  assert.match(page,/type="button"\s+className="notificationOpenBtn"\s+onClick=\{\(\) => openNotification\(item\)\}/);
  assert.match(page,/"Open Task"/);
  assert.match(styles,/\.notificationList \.notificationOpenBtn\s*\{/);
  assert.match(styles,/min-height:\s*38px/);
  assert.match(styles,/\.notificationList \.notificationOpenBtn:focus-visible/);
  assert.doesNotMatch(page,/<em>\s*\{item\.notification_type === "EmployeeAttendance"/);
});

test('opening a cached task does not wait for the mark-as-read request', async()=>{
  const h=harness();
  h.open({id:25,task_id:17,notification_type:'TaskCreated'});
  assert.deepEqual(h.events.slice(0,4),['close-inbox','mark-read-local','fetch:/api/notifications','open-task-panel']);
  assert.ok(h.getNotifications()[0].read_at,'read receipt shown instantly');
  assert.equal(h.events.includes('refresh-inbox'),false,'network request is deliberately unresolved');
  h.releaseRead();
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(h.events.includes('refresh-inbox'),'notification list refreshed after background read receipt');
});

test('task absent from initial list can still open from inbox with a direct fetch',async()=>{
  const h=harness({noCache:true});
  h.open({id:25,task_id:17,notification_type:'TaskAssigned'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(h.events.includes('fetch:/api/tasks/17'));
  assert.ok(h.events.includes('open-fetched-task'));
  h.releaseRead();
});

test('specials and attendance navigate immediately without waiting for server read receipt',()=>{
  const h=harness();
  h.open({id:25,notification_type:'EmployeeAttendance',task_id:0});
  assert.ok(h.events.includes('navigate:Employee Records'));
  h.releaseRead();
});
