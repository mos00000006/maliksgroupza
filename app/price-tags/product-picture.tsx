"use client";
import {useState} from "react";
export default function ProductPicture({src,alt,className}:{src:string;alt:string;className?:string;removeBackground?:boolean}) {
  const [failed,setFailed]=useState("");
  if(!src)return <span>Product picture not supplied</span>;
  return failed===src?<span>Ask our team for the product picture.</span>:<img className={className} src={src} alt={alt} onError={()=>setFailed(src)} />;
}
