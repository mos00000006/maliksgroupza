export const ASSESSMENT_TOKEN=/^[a-f0-9]{64}$/;
export function assessmentPublicRequest(request:Request){const path=new URL(request.url).pathname;return (/^\/p\/assessment(?:\/[a-f0-9]{64})?\/?$/.test(path)&&['GET','HEAD'].includes(request.method))||(/^\/api\/public-price-tags\/assessments\/[a-f0-9]{64}\/?$/.test(path)&&['GET','POST','HEAD'].includes(request.method));}

// Apply assessment-specific headers after the existing Worker has finished processing.
export function assessmentResponse(request:Request,response:Response){
 const path=new URL(request.url).pathname;
 const camera=/^\/p\/assessment\/[a-f0-9]{64}\/?$/.test(path);
 if(!camera&&!/^\/p\/assessment\/?$/.test(path)&&!/^\/assessments\/?$/.test(path))return response;
 const result=new Response(response.body,response);
 if(camera&&response.ok&&['GET','HEAD'].includes(request.method)){
  const policy=result.headers.get('permissions-policy')||'microphone=()';
  result.headers.set('permissions-policy',/\bcamera=\([^)]*\)/.test(policy)?policy.replace(/\bcamera=\([^)]*\)/,'camera=(self)'):policy+', camera=(self)');
 }
 const policy=result.headers.get('content-security-policy');
 if(policy){const media=/media-src\s+([^;]*)(?:;|$)/;result.headers.set('content-security-policy',media.test(policy)?policy.replace(media,(_match,sources:string)=>'media-src '+Array.from(new Set(sources.split(/\s+/).filter(s=>s&&s!=="'none'").concat(["'self'",'blob:']))).join(' ')+';'):policy+(policy.trim().endsWith(';')?'':' ;')+" media-src 'self' blob:;");}
 result.headers.set('referrer-policy','no-referrer');
 return result;
}
