export async function priceTagResponse(response:Response,fallback:string):Promise<Record<string,unknown>>{
  const text=await response.text();
  if(response.status===413||/^payload too large\s*$/i.test(text.trim()))throw new Error('The product picture is too large to upload. It will be resized automatically; please try Generate price tag again.');
  let result:Record<string,unknown>={};
  if(text){try{const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();result=value;}catch{throw new Error(response.ok?'The server returned an unexpected response. Please try again.':fallback);}}
  if(!response.ok)throw new Error(typeof result.error==='string'?result.error:fallback);
  return result;
}
