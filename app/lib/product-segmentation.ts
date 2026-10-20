// The model and runtime are served by this Hub; product pixels never leave the browser.
let worker:Worker|null=null;
let serial=Promise.resolve();
let sequence=0;
export function productMask(pixels:Uint8ClampedArray):Promise<Uint8ClampedArray>{
  const result=serial.then(()=>new Promise<Uint8ClampedArray>((resolve,reject)=>{
    const id=++sequence;
    worker??=new Worker('/price-tag-assets/cutout/worker.mjs',{type:'module'});
    const active=worker;
    const cleanup=()=>{clearTimeout(timer);active.removeEventListener('message',message);active.removeEventListener('error',failed);};
    const failed=()=>{cleanup();active.terminate();worker=null;reject(new Error('Background removal could not start. Retry, or upload a transparent PNG.'));};
    const message=(event:MessageEvent)=>{if(event.data.id!==id)return;cleanup();if(event.data.error)reject(new Error(event.data.error));else resolve(event.data.alpha);};
    const timer=setTimeout(failed,120000);
    active.addEventListener('message',message);active.addEventListener('error',failed);
    active.postMessage({id,pixels},[pixels.buffer]);
  }));
  serial=result.then(()=>undefined,()=>undefined);return result;
}
