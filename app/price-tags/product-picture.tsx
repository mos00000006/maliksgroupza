"use client";
import {useEffect,useState} from "react";
import {prepareProductPng} from "../lib/product-cutout";
export default function ProductPicture({src,alt,className,removeBackground=true}:{src:string;alt:string;className?:string;removeBackground?:boolean}) {
  const [picture,setPicture]=useState({source:"",url:"",failed:false});
  useEffect(()=>{
    let current=true;
    if(src && !src.startsWith("data:"))void prepareProductPng(src,removeBackground).then(result=>{if(current)setPicture({source:src,url:result.dataUrl,failed:false});}).catch(()=>{if(current)setPicture({source:src,url:src,failed:false});});
    return()=>{current=false;};
  },[src,removeBackground]);
  if(!src)return <span>Product picture not supplied</span>;
  return picture.source===src&&picture.failed?<span>Ask our team for the product picture.</span>:<img className={className} src={picture.source===src?picture.url:src} alt={alt} onError={()=>setPicture({source:src,url:src,failed:true})} />;
}
