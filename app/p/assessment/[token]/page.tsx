import CandidateAssessment from './candidate-assessment';
export const metadata={referrer:'no-referrer',title:'Candidate assessment',robots:{index:false,follow:false}};
export default async function CandidatePage({params}:{params:Promise<{token:string}>}){return <CandidateAssessment token={(await params).token}/>;}
