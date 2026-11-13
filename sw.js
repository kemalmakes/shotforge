/* ShotForge service worker — offline first, updates in the background */
const VERSION="1.1.0-7784b87c66b4";
const CACHE="shotforge-"+VERSION;
const DATA="shotforge-data";
const FILES=["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>
    fetch(new Request(f,{cache:"reload"})).then(r=>{if(!r.ok)throw new Error(f);return c.put(f,r)})))));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("shotforge-")&&k!==CACHE&&k!==DATA).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    if(u.pathname.endsWith("/version.json"))return; // always live
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true})||(r.mode==="navigate"?await c.match("./"):null);
      return hit||fetch(r)}));
    return;
  }
  if(u.hostname==="raw.githubusercontent.com"&&u.pathname.includes("/shotforge-data/")){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(DATA).then(c=>c.put(r,cp))}return res})
      .catch(()=>caches.open(DATA).then(c=>c.match(r)).then(m=>m||Response.error())));
  }
});
