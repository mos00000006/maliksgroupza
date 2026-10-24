import type {TagBrand} from './price-tags';
export type StaffIdDetails={name:string;role:string;department:string;employeeId:string;branch:string;expiry:string;startDate:string};
export type StaffIdRecord=StaffIdDetails&{token:string;brand:TagBrand;active:boolean;photoZoom:number;photoPosition:number;photoUrl:string;version:number;updatedAt:string};
export type StaffVerification={brand:TagBrand;status:'active'|'inactive'|'expired'|'pending';checkedAt:string;employee?:StaffIdDetails&{photoUrl:string;photoZoom:number;photoPosition:number};updatedAt?:string};
export const STAFF_TOKEN=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function parseStaffId(body:Record<string,unknown>){
 if(body.brand!=='powerbuild'&&body.brand!=='busterbuild')throw new Error('Choose a brand.');
 const text=(key:string,max:number,required=false)=>{const value=String(body[key]??'').trim();if(value.length>max||(required&&!value))throw new Error(`Check ${key}.`);return value;};
 const date=(key:string)=>{const value=text(key,10);if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value<'1900-01-01'||value>'2100-12-31'))throw new Error(`Check ${key}.`);return value;};
 const startDate=date('startDate'),expiry=date('expiry');if(startDate&&expiry&&expiry<startDate)throw new Error('Expiry must be on or after the employment start date.');
 if(typeof body.active!=='boolean')throw new Error('Choose the employment verification status.');
 const photoZoom=Number(body.photoZoom),photoPosition=Number(body.photoPosition);if(!Number.isFinite(photoZoom)||photoZoom<100||photoZoom>200||!Number.isFinite(photoPosition)||photoPosition<0||photoPosition>100)throw new Error('Check the photo crop.');
 return{brand:body.brand as TagBrand,name:text('name',70,true),employeeId:text('employeeId',32,true),role:text('role',60),department:text('department',60),branch:text('branch',60),startDate,expiry,active:body.active,photoZoom,photoPosition};
}
export function staffIdRecord(row:Record<string,unknown>):StaffIdRecord{return{token:String(row.token),brand:row.brand as TagBrand,name:String(row.name),employeeId:String(row.employee_id),role:String(row.role),department:String(row.department),branch:String(row.branch),startDate:String(row.start_date),expiry:String(row.expiry),active:Boolean(row.active),photoZoom:Number(row.photo_zoom),photoPosition:Number(row.photo_position),photoUrl:`/api/price-tags/staff-ids/photo?token=${row.token}&v=${encodeURIComponent(String(row.updated_at))}`,version:Number(row.version),updatedAt:String(row.updated_at)};}
export function verificationStatus(row:Record<string,unknown>,now=new Date()):StaffVerification['status']{
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const part=(type:string)=>parts.find(p=>p.type===type)!.value;const today=`${part('year')}-${part('month')}-${part('day')}`;
 if(Number(row.active)!==1)return'inactive';if(row.start_date&&String(row.start_date)>today)return'pending';if(row.expiry&&String(row.expiry)<today)return'expired';return'active';
}
export function publicStaffId(row:Record<string,unknown>,now=new Date()):StaffVerification{
 const record=staffIdRecord(row),status=verificationStatus(row,now);
 return{brand:record.brand,status,checkedAt:now.toISOString(),...(status==='active'?{employee:{name:record.name,employeeId:record.employeeId,role:record.role,department:record.department,branch:record.branch,startDate:record.startDate,expiry:record.expiry,photoUrl:`/api/public-price-tags/staff/${record.token}/photo`,photoZoom:record.photoZoom,photoPosition:record.photoPosition},updatedAt:record.updatedAt}:{})};
}
