export type OutdoorSize={width:number;height:number;pixelsWide:number;pixelsHigh:number};
export function outdoorSize(width:number,height:number):OutdoorSize {
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<200||height<200||width>12000||height>12000||width/height<1||width/height>4)throw new Error('Enter a landscape size from 200 to 12000 mm, with width between 1 and 4 times the height.');
 const ratio=width/height,pixelsWide=Math.min(6000,Math.floor(Math.sqrt(18000000*ratio))),pixelsHigh=Math.round(pixelsWide/ratio);
 return {width,height,pixelsWide,pixelsHigh};
}
// A single JPEG on an exact-size PDF page. No browser printer scaling is involved.
export function outdoorPdf(jpeg:string,size:OutdoorSize):Blob {
  const physicalW=size.width*72/25.4,physicalH=size.height*72/25.4;
  const unit=Math.max(1,Math.ceil(Math.max(physicalW,physicalH)/14000)),w=physicalW/unit,h=physicalH/unit;
  const raw=atob(jpeg.split(',')[1]);const picture=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const encoder=new TextEncoder();const chunks:Uint8Array[]=[];let length=0;const offsets=[0];
  const put=(value:string|Uint8Array)=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length;};
  const object=(id:number,body:string)=>{offsets[id]=length;put(`${id} 0 obj\n${body}\nendobj\n`);};
  put('%PDF-1.6\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,`<< /Type /Page /Parent 2 0 R /UserUnit ${unit} /MediaBox [0 0 ${w.toFixed(5)} ${h.toFixed(5)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4]=length;put(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${size.pixelsWide} /Height ${size.pixelsHigh} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${picture.length} >>\nstream\n`);put(picture);put('\nendstream\nendobj\n');
  const draw=`q\n${w.toFixed(5)} 0 0 ${h.toFixed(5)} 0 0 cm\n/Im0 Do\nQ\n`;
  object(5,`<< /Length ${encoder.encode(draw).length} >>\nstream\n${draw}endstream`);
  const xref=length;put('xref\n0 6\n0000000000 65535 f \n');
  for(let i=1;i<=5;i++)put(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  put(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  return new Blob([bytes.buffer],{type:'application/pdf'});
}
