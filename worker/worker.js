// PAMI Costume API — deploy this file as Cloudflare Worker worker.js.
// Secrets (Cloudflare Settings): GITHUB_TOKEN and ADMIN_PASSWORD. Never put them in this file.
const REPO="pmzou/pami-costume",DATA="custom-data.json",ORIGIN="https://pmzou.github.io";
const gh="https://api.github.com/repos/"+REPO+"/contents/";
const allowedTags=new Set(["fullback","tback","character","other"]);
function b64(bytes){let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)}
function utf8b64(s){return b64(new TextEncoder().encode(s))}
function decode(s){return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0)))}
function validTags(t){return Array.isArray(t)&&t.length<=4&&new Set(t).size===t.length&&t.every(x=>allowedTags.has(x))}
// Signed, 12-hour bearer token. No password or GitHub credential is sent to the browser.
function base64url(bytes){return b64(bytes).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function fromBase64url(s){return Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0))}
async function signingKey(env){return crypto.subtle.importKey("raw",new TextEncoder().encode(env.ADMIN_PASSWORD+":"+env.GITHUB_TOKEN),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"])}
async function issueToken(env){const payload=base64url(new TextEncoder().encode(JSON.stringify({exp:Date.now()+12*60*60*1000,nonce:crypto.randomUUID()})));const sig=base64url(new Uint8Array(await crypto.subtle.sign("HMAC",await signingKey(env),new TextEncoder().encode(payload))));return payload+"."+sig}
async function validToken(env,token){try{if(!token||token.length>1024)return false;const parts=token.split(".");if(parts.length!==2)return false;const data=JSON.parse(new TextDecoder().decode(fromBase64url(parts[0])));if(typeof data.exp!=="number"||data.exp<=Date.now()||data.exp>Date.now()+12*60*60*1000)return false;return crypto.subtle.verify("HMAC",await signingKey(env),fromBase64url(parts[1]),new TextEncoder().encode(parts[0]))}catch{return false}}
export default {async fetch(request,env){
 const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-Admin-Password, Authorization","Vary":"Origin","Cache-Control":"no-store"};
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
 const origin=request.headers.get("Origin"),url=new URL(request.url);
 if(request.method==="OPTIONS")return origin===ORIGIN?new Response(null,{status:204,headers:cors}):json({error:"Origin not allowed"},403);
 if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"pami-costume-api",features:["update","add","replace","visibility","auth","session"]});
 if(request.method!=="POST"||!["/update","/add","/replace","/visibility","/auth","/session"].includes(url.pathname))return json({error:"Not found"},404);
 if(origin!==ORIGIN)return json({error:"Origin not allowed"},403);
 if(!env.GITHUB_TOKEN||!env.ADMIN_PASSWORD)return json({error:"Server configuration missing"},500);
 if(url.pathname==="/auth"){
  if(request.headers.get("X-Admin-Password")!==env.ADMIN_PASSWORD)return json({error:"Incorrect password"},401);
  return json({ok:true,token:await issueToken(env),expiresIn:43200});
 }
 if(url.pathname==="/session")return await validToken(env,request.headers.get("Authorization")?.replace(/^Bearer /,""))?json({ok:true}):json({error:"Session expired"},401);
 if(!await validToken(env,request.headers.get("Authorization")?.replace(/^Bearer /,"")))return json({error:"Session expired"},401);
 const headers={"Authorization":"Bearer "+env.GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"pami-costume-api"};
 async function read(path){const r=await fetch(gh+path,{headers,cache:"no-store"});if(!r.ok)throw Error("GitHub read failed: "+r.status);return r.json()}
 async function put(path,content,sha,message){const r=await fetch(gh+path,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({message,content,...(sha?{sha}:{})})});if(!r.ok)throw Error("GitHub write failed: "+r.status);return r.json()}
 try{
  const body=await request.text();if(body.length>9000000)return json({error:"Request too large"},413);
  const input=JSON.parse(body),action=url.pathname.slice(1);
  if(action!=="add"&&(!Number.isSafeInteger(input.id)||input.id<1))return json({error:"Invalid ID"},400);
  if(action!=="replace"&&action!=="visibility"&&(!input.name||typeof input.name!=="string"||!input.name.trim()||input.name.length>200||!validTags(input.tags)))return json({error:"Invalid name or tags"},400);
  if(action!=="update"&&action!=="visibility"&&(!input.image||typeof input.image!=="string"||input.image.length>8500000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(input.image)))return json({error:"Invalid image (JPEG, PNG or WebP only)"},400);
  const dataFile=await read(DATA),data=JSON.parse(decode(dataFile.content));
  if(!Array.isArray(data))return json({error:"Unexpected data format"},500);
  if(action==="visibility"){
   if(typeof input.visible!=="boolean")return json({error:"Invalid visibility"},400);
   const item=data.find(x=>Number(x.id)===input.id);if(!item)return json({error:"Costume not found"},404);
   item.visible=input.visible;
   await put(DATA,utf8b64(JSON.stringify(data,null,2)+"\n"),dataFile.sha,(input.visible?"Show":"Hide")+" costume No."+input.id+" via admin");
   return json({ok:true,item});
  }
  if(action==="update"){
   const item=data.find(x=>Number(x.id)===input.id);if(!item)return json({error:"Costume not found"},404);
   item.name=input.name.trim();item.tags=input.tags;
   await put(DATA,utf8b64(JSON.stringify(data,null,2)+"\n"),dataFile.sha,"Update costume No."+input.id+" via admin");
   return json({ok:true,item});
  }
  const id=action==="add"?Math.max(100,...data.map(x=>Number(x.id)||0))+1:input.id;
  const item=action==="replace"?data.find(x=>Number(x.id)===id):null;
  if(action==="replace"&&!item)return json({error:"Costume not found"},404);
  const m=input.image.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/),raw=m[2],bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
  if(bytes.length>5500000)return json({error:"Image exceeds 5.5 MB"},413);
  const ext=m[1]==="jpeg"?"jpg":m[1],path="images/"+id+"."+ext;
  // Do not overwrite an existing image during addition.
  let oldImage=null;
  if(action==="add"){
   const check=await fetch(gh+path,{headers});if(check.ok)return json({error:"Image filename already exists; no data changed"},409);
   if(check.status!==404)return json({error:"Cannot check image filename",status:check.status},502);
  }else{
   if(item.image&&item.image!==path)return json({error:"Image format differs from existing file; use "+item.image.split(".").pop().toUpperCase()+" format for replacement"},400);
   if(item.image)oldImage=await read(path);
   else{const check=await fetch(gh+path,{headers});if(check.ok)return json({error:"Image filename already exists; check GitHub before replacing"},409);if(check.status!==404)return json({error:"Cannot check image filename",status:check.status},502);}
  }
  await put(path,raw,oldImage?.sha,action==="add"?"Add costume image No."+id:"Replace costume image No."+id);
  if(action==="add")data.push({id,name:"No."+String(id).padStart(3,"0")+"｜"+input.name.trim().replace(/^No\.\d+｜/,""),tags:input.tags,image:path,imageVersion:1,visible:true});
  else{item.image=path;item.imageVersion=(Number(item.imageVersion)||0)+1;}
  try{await put(DATA,utf8b64(JSON.stringify(data,null,2)+"\n"),dataFile.sha,(action==="add"?"Add":"Refresh")+" costume No."+id+" via admin")}
  catch(e){return json({error:"Image uploaded, but data update failed. Do not retry blindly; check GitHub first. "+e.message},409)}
  return json({ok:true,item:action==="add"?data[data.length-1]:item});
 }catch(e){return json({error:e.message||"Server error"},500)}
}};