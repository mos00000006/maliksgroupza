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
  const result=removeBackground?removeWhiteEdge(pixels.data,canvas.width,canvas.height):{removed:0,protectedWhiteProduct:false};
  let hasTransparency=false;for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<255){hasTransparency=true;break;}
  context.putImageData(pixels,0,0);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("PNG conversion failed.")),"image/png"));
  return {blob,dataUrl:canvas.toDataURL("image/png"),hasTransparency,...result};
}
