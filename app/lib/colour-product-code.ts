export function colourProductCode(value:unknown):string|undefined{
 if(value===undefined)return undefined;
 if(typeof value!=='string'||!value.trim()||value.trim().length>150||/[\u0000-\u001f\u007f\u2028\u2029]/.test(value))throw Error('Enter the active catalogue code for this colour, up to 150 characters.');
 return value.trim();
}
export function sameProductCode(a:string,b:string){return a.trim().toUpperCase()===b.trim().toUpperCase();}
