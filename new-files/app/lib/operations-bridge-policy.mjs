/** Pure, read-only operations overview access policy. No rights to post documents. */
export const OPERATIONS_OVERVIEW_ROLES=Object.freeze([
  'Owner / Admin','Developer / Technical Admin','Executive / EXCO',
  'Regional Manager','Store Manager','Department Manager',
]);
export function canSeeOperationsOverview(member){
  return Boolean(member&&OPERATIONS_OVERVIEW_ROLES.includes(member.role));
}
export function visibleOperationsBranches(workspaces,allowed){
  const active=workspaces.filter(x=>x.active===1&&typeof x.name==='string'&&x.name.trim()).map(x=>x.name);
  if(allowed===null)return Array.from(new Set(active));
  if(!Array.isArray(allowed))return [];
  const allowedSet=new Set(allowed.map(name=>String(name).trim().toLowerCase()));
  return Array.from(new Set(active.filter(name=>allowedSet.has(name.trim().toLowerCase()))));
}
export function resolveOperationsBranch(visible,requested){
  if(!requested)return null; // Null = all assigned branches, never all group branches.
  if(typeof requested!=='string'||requested.length>160)return undefined;
  return visible.find(name=>name.toLowerCase()===requested.trim().toLowerCase());
}
export function operationsOverviewCounts(rows){
  const byStatus={};let total=0,latestAt=null;
  for(const row of rows){
    const count=Number(row.n);
    if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid count');
    total+=count;
    const status=String(row.status||'UNKNOWN').slice(0,64);
    byStatus[status]=(byStatus[status]||0)+count;
    if(row.last_at&&(!latestAt||row.last_at>latestAt))latestAt=row.last_at;
  }
  return {total,by_status:byStatus,last_at:latestAt};
}
