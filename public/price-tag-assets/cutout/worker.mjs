import * as ort from './ort.wasm.min.mjs';
ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths=new URL('./',import.meta.url).href;
let session;
self.onmessage=async({data:{id,pixels}})=>{
 try{
  session??=ort.InferenceSession.create(new URL('./u2netp.onnx',import.meta.url).href,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  const model=await session, size=320*320, tensor=new Float32Array(size*3);
  let maximum=1;for(let i=0;i<pixels.length;i+=4)maximum=Math.max(maximum,pixels[i],pixels[i+1],pixels[i+2]);
  const mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let c=0;c<3;c++)for(let p=0;p<size;p++)tensor[c*size+p]=(pixels[p*4+c]/maximum-mean[c])/std[c];
  const result=await model.run({[model.inputNames[0]]:new ort.Tensor('float32',tensor,[1,3,320,320])});
  const mask=result[model.outputNames[0]].data;
  let min=Infinity,max=-Infinity;for(const value of mask){min=Math.min(min,value);max=Math.max(max,value);}
  if(max-min<1e-6)throw new Error('The product could not be separated from its background.');
  const alpha=new Uint8ClampedArray(size);
  for(let i=0;i<size;i++)alpha[i]=Math.round(Math.max(0,Math.min(1,((mask[i]-min)/(max-min)-.45)/.12))*255);
  self.postMessage({id,alpha},[alpha.buffer]);
 }catch(error){session=undefined;self.postMessage({id,error:error.message||'Product background detection failed.'});}
};
