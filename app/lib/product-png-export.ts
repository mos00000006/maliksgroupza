export const PRODUCT_PNG_UPLOAD_BYTES=600*1024;
// PNG quality parameters do not reduce file size. Reduce dimensions instead, preserving alpha and aspect ratio.
export async function exportProductPng(source:HTMLCanvasElement,maxBytes=PRODUCT_PNG_UPLOAD_BYTES){
  if(!Number.isFinite(maxBytes)||maxBytes<1024)throw new Error('Invalid picture size limit.');
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot resize product pictures.');
  context.drawImage(source,0,0);
  for(let attempt=0;attempt<20;attempt++){
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG conversion failed.')),'image/png'));
    if(blob.size<=maxBytes)return {blob,dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
    const width=Math.max(1,Math.floor(canvas.width*.8)),height=Math.max(1,Math.floor(canvas.height*.8));
    if(width===canvas.width&&height===canvas.height)break;
    canvas.width=width;canvas.height=height;context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,width,height);
  }
  throw new Error('The picture could not be made small enough to upload. Please choose another PNG.');
}
