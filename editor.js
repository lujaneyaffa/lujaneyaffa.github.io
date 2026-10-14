/* Visual editor for lujaneyaffa.github.io. Loaded only with ?edit. Saves to GitHub via the Contents API. */
(function(){
const FONTS=["Permanent Marker","Outfit","Caveat","Pacifico","Playfair Display","DM Serif Display","Space Grotesk","Fraunces","Rock Salt","Shadows Into Light","Gloria Hallelujah","Amatic SC","Bebas Neue","Lora","Inter","Poppins","DM Sans","Syne","Abril Fatface","Lobster"];
const COLORS=[["bg","background"],["ink","text"],["mute","soft text"],["btn","button"],["btnInk","button text"],["shadow","shadow"],["card","photo frame"],["cardInk","caption"]];
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const pending={}; // path -> {b64, dataUrl}
let dirty=false, bar, panel, toast;
const $=(t,a={},h="")=>{const e=document.createElement(t);for(const k in a){k==="on"?Object.entries(a[k]).forEach(([n,f])=>e.addEventListener(n,f)):e.setAttribute(k,a[k])}if(h)e.innerHTML=h;return e};
const get=(o,p)=>p.split(".").reduce((x,k)=>x&&x[k],o);
const set=(o,p,v)=>{const ks=p.split(".");const l=ks.pop();ks.reduce((x,k)=>x[k],o)[l]=v};
const mark=()=>{dirty=true;LS.set("ly_draft",JSON.stringify(SITE));if(bar)bar.querySelector("#sv").textContent="save changes ●"};
const say=m=>{toast.textContent=m;toast.style.opacity=1;clearTimeout(say.t);say.t=setTimeout(()=>toast.style.opacity=0,3500)};
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item";

document.getElementById("editor-css").textContent=`
body.ed{padding-top:54px}
#edbar{position:fixed;top:0;left:0;right:0;z-index:9999;background:#2B2420;color:#FFF8EC;display:flex;gap:8px;align-items:center;padding:8px 12px;font:600 14px Outfit,system-ui,sans-serif;flex-wrap:wrap}
#edbar button,.edb{font:inherit;cursor:pointer;border:2px solid #FFF8EC;background:transparent;color:#FFF8EC;border-radius:6px;padding:5px 11px}
#edbar button:hover,.edb:hover{background:#FFF8EC;color:#2B2420}
#edbar #sv{background:#FF3B00;border-color:#FF3B00}
#edbar .sp{flex:1}
#edpanel{position:fixed;top:54px;right:0;bottom:0;width:min(340px,100%);background:#FFF8EC;color:#2B2420;z-index:9998;overflow:auto;padding:16px;border-left:3px solid #2B2420;font:500 14px Outfit,system-ui,sans-serif;display:none}
#edpanel h3{font:700 15px Outfit;margin:14px 0 6px}
#edpanel label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 0}
#edpanel input[type=text],#edpanel input[type=password],#edpanel select,#edpanel textarea{width:60%;padding:5px;border:2px solid #2B2420;border-radius:5px;background:#fff;font:inherit}
#edpanel input[type=text].w,#edpanel input[type=password].w{width:100%}
#edpanel input[type=color]{width:46px;height:30px;border:2px solid #2B2420;padding:0;background:none}
#edpanel p.h{font-size:12px;color:#6E625A;margin:4px 0}
#edpanel .edb{border-color:#2B2420;color:#2B2420}
#edpanel .edb:hover{background:#2B2420;color:#FFF8EC}
body.ed [data-path]{outline:2px dashed transparent;outline-offset:3px;cursor:text;min-width:20px;min-height:1em}
body.ed [data-path]:hover{outline-color:#FF3B00}
body.ed [data-path]:focus{outline:2px solid #FF3B00}
body.ed .go[data-path]{pointer-events:auto}
.sectools{position:absolute;top:8px;left:8px;z-index:50;display:flex;gap:4px;flex-wrap:wrap;background:#2B2420;padding:5px;border-radius:8px;font:600 13px Outfit,system-ui,sans-serif}
.sectools .edb{padding:3px 9px;font-size:13px}
.band,.hero{position:relative}
.shot .mtools{position:absolute;top:6px;right:6px;display:flex;gap:3px;z-index:5;background:#2B2420;padding:3px;border-radius:6px}
.mtools .edb{padding:1px 7px;font-size:13px}
.addmedia{grid-column:1/-1;border:3px dashed currentColor;border-radius:8px;padding:18px;text-align:center;cursor:pointer;font-weight:700;opacity:.7}
.addmedia:hover{opacity:1}
.sec-sel{outline:3px solid #FF3B00;outline-offset:-3px}
#edtoast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#2B2420;color:#FFF8EC;padding:10px 18px;border-radius:8px;z-index:10000;opacity:0;transition:opacity .2s;font:600 14px Outfit,system-ui,sans-serif;max-width:90vw}
@media(max-width:700px){#edpanel{top:auto;height:55vh;border-left:0;border-top:3px solid #2B2420}}
`;
document.body.classList.add("ed");
toast=$("div",{id:"edtoast"});document.body.appendChild(toast);

bar=$("div",{id:"edbar"},`<span>editing</span><button id="th">fonts &amp; page</button><button id="addsec">+ section</button><button id="settings">github token</button><button id="restore" style="display:none">restore unsaved</button><span class="sp"></span><button id="sv">saved</button><button id="exit">exit</button>`);
document.body.appendChild(bar);
panel=$("div",{id:"edpanel"});document.body.appendChild(panel);
bar.querySelector("#restore").style.display=LS.get("ly_draft")?"":"none";

let sel=-1;
function openPanel(html,wire){panel.innerHTML=html;panel.style.display="block";wire&&wire(panel)}
function rerender(keepSel){const y=scrollY;render();scrollTo(0,y)}

/* ---------- text editing ---------- */
document.addEventListener("input",e=>{
  const el=e.target.closest&&e.target.closest("[data-path]");if(!el||!document.body.classList.contains("ed"))return;
  set(SITE,el.dataset.path,el.innerText.replace(/\n+$/,""));mark();
});
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.matches&&e.target.matches("h1[data-path],h2[data-path],.go[data-path],.rec,figcaption,footer [data-path]")){e.preventDefault();e.target.blur()}});
document.addEventListener("click",e=>{ if(e.target.closest&&e.target.closest("#app a")&&!e.target.closest("nav")&&document.body.classList.contains("ed"))e.preventDefault()},true);
document.addEventListener("paste",e=>{ const el=e.target.closest&&e.target.closest("[data-path]");if(!el)return;e.preventDefault();document.execCommand("insertText",false,(e.clipboardData||window.clipboardData).getData("text/plain"))});

/* ---------- images ---------- */
function pickImage(cb){
  const i=$("input",{type:"file",accept:"image/*"});
  i.onchange=()=>{const f=i.files[0];if(!f)return;if(f.size>8e6){say("that file is over 8 MB, try a smaller one");return}
    const r=new FileReader();r.onload=()=>{const dataUrl=r.result;const ext=(f.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
      const name="media/"+slug(f.name.replace(/\.[^.]+$/,""))+"-"+Date.now().toString(36)+"."+ext;
      pending[name]={b64:dataUrl.split(",")[1],dataUrl};cb(name,dataUrl)};r.readAsDataURL(f)};
  i.click();
}
function previewSrc(src){return pending[src]?pending[src].dataUrl:src}

/* ---------- decorate ---------- */
window.Editor={decorate(){
  document.querySelectorAll("#app [data-path]").forEach(el=>{el.setAttribute("contenteditable","plaintext-only");el.setAttribute("spellcheck","true")});
  document.querySelectorAll("#app img").forEach(im=>{const s=im.getAttribute("src");if(pending[s])im.src=pending[s].dataUrl});
  const hero=document.querySelector(".hero");
  const ht=$("div",{class:"sectools"});ht.appendChild($("button",{class:"edb",on:{click:()=>heroPanel()}},"edit hero"));hero.appendChild(ht);
  document.querySelectorAll(".band").forEach(b=>{
    const i=+b.dataset.si,t=$("div",{class:"sectools"});
    const btn=(l,f,title)=>t.appendChild($("button",{class:"edb",title:title||"",on:{click:f}},l));
    btn("▲",()=>move(i,-1),"move up");btn("▼",()=>move(i,1),"move down");btn("design",()=>secPanel(i),"colours, links, tags");btn("copy",()=>dup(i),"duplicate");btn("✕",()=>del(i),"delete");
    b.appendChild(t);
    b.querySelectorAll(".shot").forEach(f=>{
      const mi=+f.dataset.mi,mt=$("div",{class:"mtools"});
      const mb=(l,fn,ti)=>mt.appendChild($("button",{class:"edb",title:ti,on:{click:e=>{e.stopPropagation();fn()}}},l));
      mb("◀",()=>mmove(i,mi,-1),"earlier");mb("▶",()=>mmove(i,mi,1),"later");
      mb("size",()=>{const k=["grid","big","tall"];const m=SITE.sections[i].media[mi];m.kind=k[(k.indexOf(m.kind)+1)%3];mark();rerender()},"cycle size: small / wide / tall");
      mb("swap",()=>pickImage((n)=>{SITE.sections[i].media[mi].src=n;mark();rerender()}),"replace image");
      mb("✕",()=>{SITE.sections[i].media.splice(mi,1);mark();rerender()},"remove");
      f.appendChild(mt);
    });
    const am=$("div",{class:"addmedia",on:{click:()=>pickImage((n)=>{const s=SITE.sections[i];(s.media=s.media||[]).push({src:n,caption:"",kind:"grid",badge:"",alt:""});mark();rerender()})}},"+ add a screenshot or gif");
    const mm=b.querySelector(".media");mm.appendChild(am);
    if(b.classList.contains("nomedia")){b.classList.remove("nomedia");}
  });
}};

function move(i,d){const a=SITE.sections,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];mark();rerender();
  setTimeout(()=>{const b=document.querySelectorAll(".band")[j];b&&b.scrollIntoView({block:"start"})},0)}
function mmove(i,mi,d){const a=SITE.sections[i].media,j=mi+d;if(j<0||j>=a.length)return;[a[mi],a[j]]=[a[j],a[mi]];mark();rerender()}
function dup(i){const c=JSON.parse(JSON.stringify(SITE.sections[i]));c.id=c.id+"-"+Date.now().toString(36).slice(-3);c.title+=" copy";SITE.sections.splice(i+1,0,c);mark();rerender()}
function del(i){const s=SITE.sections[i];if(!window.__armed||window.__armed!==s.id){window.__armed=s.id;say('tap ✕ again on "'+s.title+'" to delete it');setTimeout(()=>window.__armed=null,4000);return}
  SITE.sections.splice(i,1);window.__armed=null;mark();rerender()}
function newSection(){return{id:"new-"+Date.now().toString(36).slice(-4),nav:"new",logo:"",title:"new project",body:"Say what it is in a sentence or two.",tags:["tag one","tag two"],button:{label:"open it",url:"https://",style:"solid"},flip:false,
  bg:"#FDD8D3",ink:"#4A1D1B",mute:"#7A4A4C",btn:"#4A1D1B",btnInk:"#FFF8EC",shadow:"#CF8591",card:"#FFFFFF",cardInk:"#7A4A4C",media:[]}}
bar.querySelector("#addsec").onclick=()=>{SITE.sections.push(newSection());mark();rerender();setTimeout(()=>{const b=[...document.querySelectorAll(".band")].pop();b.scrollIntoView({behavior:"smooth"})},50)};
bar.querySelector("#restore").onclick=()=>{try{SITE=JSON.parse(LS.get("ly_draft"));dirty=true;rerender();say("restored your unsaved edits")}catch(e){say("couldn't restore")}};
bar.querySelector("#exit").onclick=()=>{if(dirty&&!window.__exitArmed){window.__exitArmed=1;say("you have unsaved changes. tap exit again to leave anyway");setTimeout(()=>window.__exitArmed=0,4000);return}location.href=location.pathname};
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});

/* ---------- panels ---------- */
const fontSel=(id,v)=>`<select id="${id}">${[...new Set([v,...FONTS])].map(f=>`<option ${f===v?"selected":""}>${f}</option>`).join("")}</select>`;
function themePanel(){const t=SITE.theme;
  openPanel(`<h3>fonts</h3><label>headings ${fontSel("hf",t.headingFont)}</label><label>body ${fontSel("bf",t.bodyFont)}</label>
  <label>text size <input type="range" id="bs" min="14" max="22" value="${t.baseSize}"></label><label>heading size <input type="range" id="hs" min="60" max="140" value="${Math.round((t.headScale||1)*100)}"></label>
  <h3>page</h3><label>page background <input type="color" id="pb" value="${t.pageBg}"></label><label>page text <input type="color" id="pi" value="${t.pageInk}"></label>
  <label>tilted screenshots <input type="checkbox" id="tl" ${t.tilt?"checked":""}></label>
  <p class="h">Colours for each project are under "design" on that section.</p><button class="edb" id="x">close</button>`,p=>{
    const on=(id,f)=>p.querySelector("#"+id).addEventListener("input",e=>{f(e.target);mark();window.render();});
    on("hf",e=>t.headingFont=e.value);on("bf",e=>t.bodyFont=e.value);on("bs",e=>t.baseSize=+e.value);on("hs",e=>t.headScale=e.value/100);
    on("pb",e=>t.pageBg=e.value);on("pi",e=>t.pageInk=e.value);p.querySelector("#tl").onchange=e=>{t.tilt=e.target.checked;mark();window.render()};
    p.querySelector("#x").onclick=()=>panel.style.display="none"})}
bar.querySelector("#th").onclick=themePanel;

function heroPanel(){const h=SITE.hero;
  openPanel(`<h3>top of the page</h3><label>background <input type="color" id="a" value="${h.bg}"></label><label>title colour <input type="color" id="b" value="${h.titleColor}"></label><label>text / outline <input type="color" id="c" value="${h.ink}"></label>
  <label>show menu <input type="checkbox" id="n" ${h.showNav?"checked":""}></label><label>show sticker <input type="checkbox" id="s" ${h.showSticker?"checked":""}></label>
  <button class="edb" id="sp">change sticker image</button><p class="h">Click the big words on the page to retype them.</p><button class="edb" id="x">close</button>`,p=>{
    const on=(id,f)=>p.querySelector("#"+id).addEventListener("input",e=>{f(e.target);mark();window.render()});
    on("a",e=>h.bg=e.value);on("b",e=>h.titleColor=e.value);on("c",e=>h.ink=e.value);
    p.querySelector("#n").onchange=e=>{h.showNav=e.target.checked;mark();window.render()};p.querySelector("#s").onchange=e=>{h.showSticker=e.target.checked;mark();window.render()};
    p.querySelector("#sp").onclick=()=>pickImage(n=>{h.sticker=n;h.showSticker=true;mark();window.render()});
    p.querySelector("#x").onclick=()=>panel.style.display="none"})}

function secPanel(i){const s=SITE.sections[i];
  openPanel(`<h3>${s.title}</h3>
  <label>menu name <input type="text" id="nav" value="${s.nav||""}"></label>
  <label>button link <input type="text" id="url" value="${s.button.url||""}"></label>
  <label>button look <select id="bst"><option value="solid" ${s.button.style==="solid"?"selected":""}>solid</option><option value="outline" ${s.button.style==="outline"?"selected":""}>outline</option></select></label>
  <label>tags (commas) <input type="text" id="tg" value="${(s.tags||[]).join(", ")}"></label>
  <label>photos on left <input type="checkbox" id="fl" ${s.flip?"checked":""}></label>
  <h3>colours</h3>${COLORS.map(([k,l])=>`<label>${l} <input type="color" data-c="${k}" value="${s[k]}"></label>`).join("")}
  <h3>round logo</h3><button class="edb" id="lg">${s.logo?"change":"add"} logo</button> ${s.logo?'<button class="edb" id="lgx">remove</button>':""}
  <p class="h">Click any words on the page to retype them.</p><button class="edb" id="x">close</button>`,p=>{
    const on=(id,f,ev="input")=>p.querySelector("#"+id).addEventListener(ev,e=>{f(e.target);mark();rerender()});
    on("nav",e=>s.nav=e.value);on("url",e=>s.button.url=e.value);on("bst",e=>s.button.style=e.value,"change");
    on("tg",e=>s.tags=e.value.split(",").map(x=>x.trim()).filter(Boolean));on("fl",e=>s.flip=e.checked,"change");
    p.querySelectorAll("[data-c]").forEach(c=>c.addEventListener("input",e=>{s[c.dataset.c]=c.value;mark();const b=document.querySelectorAll(".band")[i];b.style.setProperty("--"+c.dataset.c,c.value)}));
    p.querySelector("#lg").onclick=()=>pickImage(n=>{s.logo=n;mark();rerender()});const lx=p.querySelector("#lgx");if(lx)lx.onclick=()=>{s.logo="";mark();rerender()};
    p.querySelector("#x").onclick=()=>panel.style.display="none"})}

function settingsPanel(){
  openPanel(`<h3>github token</h3><p class="h">This lets the Save button publish your edits. It stays in this browser only. Make one at github.com/settings/personal-access-tokens/new : only this repository, permission "Contents: Read and write".</p>
  <input class="w" type="password" id="tk" placeholder="github_pat_..." value="${LS.get("ly_token")||""}">
  <p class="h">repository</p><input class="w" type="text" id="rp" value="${LS.get("ly_repo")||"lujaneyaffa/lujaneyaffa.github.io"}">
  <p><button class="edb" id="ok">keep</button> <button class="edb" id="x">close</button></p>`,p=>{
    p.querySelector("#ok").onclick=()=>{LS.set("ly_token",p.querySelector("#tk").value.trim());LS.set("ly_repo",p.querySelector("#rp").value.trim());say("saved on this device");panel.style.display="none"};
    p.querySelector("#x").onclick=()=>panel.style.display="none"})}
bar.querySelector("#settings").onclick=settingsPanel;

/* ---------- save to GitHub ---------- */
const b64utf8=s=>btoa(unescape(encodeURIComponent(s)));
async function gh(path,opt={}){const repo=LS.get("ly_repo")||"lujaneyaffa/lujaneyaffa.github.io",tok=LS.get("ly_token");
  const r=await fetch(`https://api.github.com/repos/${repo}/contents/${path}`+(opt.q||""),{method:opt.method||"GET",headers:{Authorization:"Bearer "+tok,Accept:"application/vnd.github+json","Content-Type":"application/json"},body:opt.body&&JSON.stringify(opt.body)});
  return r}
async function putFile(path,b64,msg){
  for(let n=0;n<2;n++){
    let sha;const g=await gh(path,{q:"?ref=main&t="+Date.now()});if(g.ok)sha=(await g.json()).sha;else if(g.status===401||g.status===403)throw new Error("token problem ("+g.status+")");
    const r=await gh(path,{method:"PUT",body:{message:msg,content:b64,sha,branch:"main"}});
    if(r.ok)return;if(r.status===409&&n===0)continue;
    throw new Error(path+": "+r.status+" "+((await r.json().catch(()=>({}))).message||""));
  }}
bar.querySelector("#sv").onclick=async()=>{
  if(!LS.get("ly_token")){settingsPanel();say("add your github token first");return}
  const b=bar.querySelector("#sv");b.textContent="saving…";b.disabled=true;
  try{
    const used=new Set(JSON.stringify(SITE).match(/media\/[^"]+/g)||[]);
    for(const [p,v] of Object.entries(pending)){ if(!used.has(p))continue; b.textContent="uploading "+p.split("/").pop(); await putFile(p,v.b64,"Add "+p); }
    b.textContent="saving text…";
    await putFile("site.json",b64utf8(JSON.stringify(SITE,null,2)+"\n"),"Update site from editor");
    for(const k in pending)delete pending[k];
    dirty=false;LS.del("ly_draft");b.textContent="saved";say("saved. the live site updates in about a minute");
  }catch(err){b.textContent="save changes ●";say("couldn't save: "+err.message)}
  b.disabled=false};

window.render();
})();
