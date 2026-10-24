import {getHubMember,type HubMember} from './access';
export function canReviewAssessment(member:HubMember|null|undefined){return Boolean(member&&(member.access_scope==='Full company'||member.role==='Human Resource (HR)'));}
export async function assessmentMember(){const member=await getHubMember({allowEmployeeRecordsOnly:true,allowBuyerAccess:true,allowStockOrdersAccess:true});return canReviewAssessment(member)?member:null;}
