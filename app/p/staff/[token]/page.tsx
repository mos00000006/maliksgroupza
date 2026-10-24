import StaffVerificationPage from './staff-verification-page';
export const metadata={title:'Staff Employment Verification',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){const{token}=await params;return <StaffVerificationPage token={token}/>;}
