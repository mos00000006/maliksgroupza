export const ASSESSMENT_TOKEN=/^[a-f0-9]{64}$/;
export function assessmentPublicRequest(request:Request){const path=new URL(request.url).pathname;return (/^\/p\/assessment(?:\/[a-f0-9]{64})?\/?$/.test(path)&&['GET','HEAD'].includes(request.method))||(/^\/api\/public-price-tags\/assessments\/[a-f0-9]{64}\/?$/.test(path)&&['GET','POST','HEAD'].includes(request.method));}
