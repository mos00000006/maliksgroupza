import type {IdOrientation} from './staff-id-export';
export const STAFF_ID_A4={widthMm:210,heightMm:297,pixelsWide:2480,pixelsHigh:3508} as const;
export const STAFF_ID_A4_CAPACITY=6 as const;
export type StaffIdSheetSlot={index:number;row:number;col:number;xMm:number;yMm:number;widthMm:number;heightMm:number};
export function staffIdSheetSlots(orientation:IdOrientation,mirror=false):StaffIdSheetSlot[]{
 const widthMm=orientation==='portrait'?53.98:85.60;
 const heightMm=orientation==='portrait'?85.60:53.98;
 const colGap=12,rowGap=orientation==='portrait'?8:12;
 const xStart=(STAFF_ID_A4.widthMm-2*widthMm-colGap)/2;
 const yStart=(STAFF_ID_A4.heightMm-3*heightMm-2*rowGap)/2;
 return Array.from({length:STAFF_ID_A4_CAPACITY},(_,index)=>{
   const row=Math.floor(index/2),col=(index%2)^(mirror?1:0);
   return {index,row,col,xMm:Number((xStart+col*(widthMm+colGap)).toFixed(4)),yMm:Number((yStart+row*(heightMm+rowGap)).toFixed(4)),widthMm,heightMm};
 });
}
