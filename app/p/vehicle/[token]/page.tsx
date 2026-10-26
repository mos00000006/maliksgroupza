import DriverPage from './driver-page';
export const metadata={title:'Company vehicle logbook',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){return <DriverPage token={(await params).token}/>;}
