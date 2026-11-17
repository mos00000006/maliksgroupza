// Department access is enforced on the server, never in the browser.
const MANAGEMENT = new Set(['Owner / Admin','Developer / Technical Admin','Store Manager','Regional Manager']);
const DEPARTMENT_ROLES = {
  pos: new Set(['Sales / Tills','Sales','Floor Sales','Sales Manager']),
  tills: new Set(['Sales / Tills','Cashier','Till Operator']),
  cashoffice: new Set(['Cash Office','Cash Office Clerk','Cash Office Manager','Cash Office Supervisor','Finance Manager']),
  dispatch: new Set(['Dispatch','Dispatcher','Dispatch Head','Dispatch Manager','Checker','Driver']),
};
export const APPS = Object.freeze(['pos','tills','cashoffice','dispatch','management','member']);
// One account/password across every Maliks Worker. Per-origin session cookies remain separate.
// Sales + Maliks Quote both map to 'pos' inside the private Core API.
export const APP_LOGIN_TARGETS = Object.freeze([
  {id:'management',label:'Maliks POS Professional',url:'https://maliks-pos.moyanamoses006.workers.dev/'},
  {id:'pos',label:'Maliks Sales + Quote',url:'https://maliks-sales.moyanamoses006.workers.dev/'},
  {id:'tills',label:'Maliks Tills',url:'https://maliks-tills.moyanamoses006.workers.dev/'},
  {id:'cashoffice',label:'Maliks Cash Office',url:'https://maliks-cash-office.moyanamoses006.workers.dev/'},
  {id:'dispatch',label:'Maliks Dispatch',url:'https://maliks-dispatch.moyanamoses006.workers.dev/'},
  {id:'member',label:'Maliks Member Team',url:'https://maliks-member-team.moyanamoses006.workers.dev/'}
]);
// Migration-safe: pre-existing staff retain their original role-based permissions
// until an administrator explicitly saves a six-app access matrix.
export async function attachAppPermissions(db,member){
  if(!member||!Number.isSafeInteger(member.id))return member;
  try {
    const {results}=await db.prepare('SELECT app,allowed FROM maliks_member_app_access WHERE member_id=?')
      .bind(member.id).all();
    member.app_permissions=results||[];
  }catch(e){
    if(!/no such table: maliks_member_app_access/i.test(String(e?.message||e)))throw e;
    member.app_permissions=[];
  }
  return member;
}

const MANAGEMENT_ONLY = new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager','Stock Controller','Warehouse Manager','Warehouse Management','Purchasing Manager','Buyer','Finance Manager','Creditors Clerk','Debtors Clerk','Credit Controller','Receiving Clerk','Receiving Manager','Receiving Supervisor','Receiving','GRV Clerk']);
export function canUseApp(member, app) {
  if (!APPS.includes(app) || !member || Number(member.active) !== 1) return false;
  // Technical and Owner admins are fully entitled across all Maliks Workers;
  // no browser-supplied role or application checkbox can create this privilege.
  if (['Developer / Technical Admin','Owner / Admin'].includes(member.role)) return true;
  const eligibleMember=['Operations Manager','Store Manager','Regional Manager'].includes(member.role);
  // Member Team administration still requires an actual management job role.
  if (app==='member'&&!eligibleMember) return false;
  if (Array.isArray(member.app_permissions)) {
    const override=member.app_permissions.find(x=>x?.app===app);
    if(override!==undefined)return Number(override.allowed)===1;
  }
  if (app === 'member') return eligibleMember;
  if (app === 'management') return MANAGEMENT_ONLY.has(member.role) || (member.role === 'Executive / EXCO' && member.access_scope === 'Full company');
  if (MANAGEMENT.has(member.role)) return true;
  if (member.role === 'Executive / EXCO' && member.access_scope === 'Full company') return true;
  return DEPARTMENT_ROLES[app].has(member.role);
}

export function allowedBranches(member, branches) {
  if (!member) return [];
  const fullCompany = ['Owner / Admin','Developer / Technical Admin'].includes(member.role) ||
    (member.role === 'Executive / EXCO' && member.access_scope === 'Full company');
  if (fullCompany) return [...branches];
  let selected = [];
  try {
    const parsed=JSON.parse(member.workspace_access || '[]');
    if (Array.isArray(parsed)) selected=parsed.filter(x => typeof x === 'string').map(x=>x.trim()).filter(Boolean);
  } catch { /* deny all malformed assignments */ }
  // Match Hub semantics: when no explicit workspace is assigned, department is the fallback.
  const effective = selected.length ? (member.access_scope === 'Assigned workspace' ? selected.slice(0,1) : selected) : [member.department].filter(Boolean);
  const keys=new Set(effective.map(x=>x.toLowerCase()));
  return branches.filter(branch=>keys.has(branch.toLowerCase()));
}
export function matchingBranch(branches, branch) {
  if (typeof branch !== 'string' || !branch.trim()) return branches.length === 1 ? branches[0] : null;
  return branches.find(x=>x.toLowerCase()===branch.trim().toLowerCase()) || null;
}
export function limitSearch(q) {
  if (typeof q !== 'string' || q.length > 100) return null;
  return q.trim();
}
