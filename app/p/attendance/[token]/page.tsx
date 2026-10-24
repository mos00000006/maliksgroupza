import StaffClock from './staff-clock';
export const metadata={title:'Branch staff attendance',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){return <StaffClock token={(await params).token}/>;}
