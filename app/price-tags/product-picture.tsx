"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./price-tags.module.css";

export default function ProductPicture({src,alt,className,landscapeTile=false}:{src:string;alt:string;className?:string;removeBackground?:boolean;landscapeTile?:boolean}) {
  const [failed,setFailed]=useState("");
  const imageRef=useRef<HTMLImageElement|null>(null);
  const orient=(image:HTMLImageElement)=>{
    // Only rotate portrait source files; already-landscape tile photos stay upright.
    image.classList.toggle(styles.landscapeTileImage,landscapeTile && image.naturalHeight > image.naturalWidth);
  };
  useEffect(()=>{if(imageRef.current?.complete)orient(imageRef.current);},[src,landscapeTile]);
  if(!src)return <span>Product picture not supplied</span>;
  return failed===src?<span>Ask our team for the product picture.</span>:<img ref={imageRef} className={className} src={src} alt={alt} onLoad={event=>orient(event.currentTarget)} onError={()=>setFailed(src)} />;
}
