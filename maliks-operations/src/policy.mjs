// Department access is enforced on the server, never in the browser.
const MANAGEMENT = new Set(['Owner / Admin','Developer / Technical Admin','Store Manager','Regional Manager']);
const DEPARTMENT_ROLES = {
  pos: new Set(['Sales / Tills','Sales','Floor Sales','Sales Manager']),
  tills: new Set(['Sales / Tills','Cashier','Till Operator']),
  cashoffice: new Set(['Cash Office','Cash Office Clerk','Cash Office Manager','Cash Office Supervisor','Finance Manager']),
  dispatch: new Set(['Dispatch','Dispatcher','Dispatch Head','Dispatch Manager','Checker','Driver']),
};
export const APPS = Object.freeze(['pos','tills','cashoffice','dispatch']);
export function canUseApp(member, app) {
  if (!DEPARTMENT_ROLES[app] || !member || Number(member.active) !== 1) return false;
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
