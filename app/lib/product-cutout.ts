import {productMask} from "./product-segmentation";
// Remove only near-white pixels connected to the outside of a product image.
// Interior white areas remain untouched. Detailed/white products can use a supplied PNG.
export function removeWhiteEdge(data: Uint8ClampedArray,width:number,height:number) {
  const count=width*height;const visited=new Uint8Array(count);const queue=new Uint32Array(count);let head=0,tail=0,opaque=0;
  for(let p=0;p<count;p++)if(data[p*4+3]>0)opaque++;
  const add=(p:number)=>{
    if(visited[p])return;visited[p]=1;const i=p*4;
    if(data[i+3]<8||(Math.min(data[i],data[i+1],data[i+2])>=242&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=15))queue[tail++]=p;
  };
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
  for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);if(x>0)add(p-1);if(x<width-1)add(p+1);if(y>0)add(p-width);if(y<height-1)add(p+width);}
  let removed=0;for(let k=0;k<tail;k++)if(data[queue[k]*4+3]>0)removed++;
  // Avoid blanking out very pale products or an entirely white source picture.
  if(opaque>0&&removed/opaque>.8)return {removed:0,protectedWhiteProduct:true};
  for(let k=0;k<tail;k++)data[queue[k]*4+3]=0;
  return {removed,protectedWhiteProduct:false};
}
export async function prepareProductPng(url:string|Blob,removeBackground=true) {
  let source:Blob;
  if(url instanceof Blob)source=url;else{const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error("The product picture could not load. Upload a transparent PNG below.");source=await response.blob();}
if(!source.type.startsWith("image/"))throw new Error("The source did not return a product picture.");
  const bitmap=await createImageBitmap(source);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext("2d",{willReadFrequently:true});if(!context){bitmap.close();throw new Error("This browser cannot prepare product pictures.");}
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  // Already isolated PNGs keep their supplied alpha. Opaque images in every category use the model.
  let transparent=0;for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<8)transparent++;
  if(removeBackground&&transparent<pixels.width*pixels.height*.01){
    const input=document.createElement("canvas");input.width=input.height=320;
    const sample=input.getContext("2d")!;sample.fillStyle="#fff";sample.fillRect(0,0,320,320);sample.drawImage(canvas,0,0,320,320);
    const alpha=await productMask(sample.getImageData(0,0,320,320).data);
    const maskPixels=sample.createImageData(320,320);for(let p=0;p<alpha.length;p++){maskPixels.data[p*4]=maskPixels.data[p*4+1]=maskPixels.data[p*4+2]=255;maskPixels.data[p*4+3]=alpha[p];}
    sample.putImageData(maskPixels,0,0);
    context.globalCompositeOperation="destination-in";context.drawImage(input,0,0,canvas.width,canvas.height);context.globalCompositeOperation="source-over";
  }
  // Trim the removed canvas and leave a small transparent margin around the actual product.
  const output=context.getImageData(0,0,canvas.width,canvas.height);
  // Clear white residue connected to the removed outside, without erasing enclosed white product details.
  if(removeBackground){removeWhiteEdge(output.data,canvas.width,canvas.height);context.putImageData(output,0,0);}
  let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(output.data[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<left||bottom<top)throw new Error("No product was detected. Retry or upload a transparent PNG.");
  const trimmed=document.createElement("canvas");trimmed.width=right-left+5;trimmed.height=bottom-top+5;
  trimmed.getContext("2d")!.drawImage(canvas,left,top,right-left+1,bottom-top+1,2,2,right-left+1,bottom-top+1);
  canvas.width=trimmed.width;canvas.height=trimmed.height;context.drawImage(trimmed,0,0);
  const hasTransparency=true;const result={removed:0,protectedWhiteProduct:false};
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("PNG conversion failed.")),"image/png"));
  return {blob,dataUrl:canvas.toDataURL("image/png"),hasTransparency,...result};
}
