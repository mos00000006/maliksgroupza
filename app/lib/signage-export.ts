export type Paper = "A4" | "A3";
export type Orientation = "portrait" | "landscape";
export type SignageSize={width:number;height:number;pixelsWide:number;pixelsHigh:number};
export function signageSize(paper:Paper,orientation:Orientation):SignageSize {
 const [short,long,shortPixels,longPixels]=paper==='A4'?[210,297,2480,3508]:[297,420,3508,4960];
 return orientation==='portrait'?{width:short,height:long,pixelsWide:shortPixels,pixelsHigh:longPixels}:{width:long,height:short,pixelsWide:longPixels,pixelsHigh:shortPixels};
}
// A single JPEG on an exact-size PDF page. No browser printer scaling is involved.
export function signagePdf(jpeg:string,size:SignageSize):Blob {
  const w=size.width*72/25.4,h=size.height*72/25.4;
  const raw=atob(jpeg.split(',')[1]);const picture=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const encoder=new TextEncoder();const chunks:Uint8Array[]=[];let length=0;const offsets=[0];
  const put=(value:string|Uint8Array)=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length;};
  const object=(id:number,body:string)=>{offsets[id]=length;put(`${id} 0 obj\n${body}\nendobj\n`);};
  put('%PDF-1.4\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w.toFixed(5)} ${h.toFixed(5)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4]=length;put(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${size.pixelsWide} /Height ${size.pixelsHigh} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${picture.length} >>\nstream\n`);put(picture);put('\nendstream\nendobj\n');
  const draw=`q\n${w.toFixed(5)} 0 0 ${h.toFixed(5)} 0 0 cm\n/Im0 Do\nQ\n`;
  object(5,`<< /Length ${encoder.encode(draw).length} >>\nstream\n${draw}endstream`);
  const xref=length;put('xref\n0 6\n0000000000 65535 f \n');
  for(let i=1;i<=5;i++)put(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  put(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  return new Blob([bytes.buffer],{type:'application/pdf'});
}
