const $=id=>document.getElementById(id);
const cl=x=>Math.max(0,Math.min(1,x));
const P=(t,a,d)=>cl((t-a)/d);
const oE=x=>x>=1?1:1-Math.pow(2,-10*x);            // outExpo
const oC=x=>1-Math.pow(1-x,3);
const ioC=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const oB=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const lerp=(a,b,p)=>a+(b-a)*p;
// split element's text into word spans (keeps .pill spans as single units)
function split(el){
  if(el._w)return el._w;const out=[];
  [...el.childNodes].forEach(n=>{
    if(n.nodeType===3){n.textContent.split(/(\s+)/).forEach(s=>{if(!s)return;if(/^\s+$/.test(s)){el.insertBefore(document.createTextNode(s),n);return}
      const sp=document.createElement('span');sp.className='w';sp.textContent=s;el.insertBefore(sp,n);out.push(sp)});el.removeChild(n)}
    else{n.classList.add('w');out.push(n)}});
  return el._w=out;
}
// word-by-word reveal: blur + rise; pills pop with overshoot
function words(el,t,t0,st=.07,out=null){
  const ws=split(el);
  ws.forEach((w,i)=>{
    const p=oE(P(t,t0+i*st,.55));
    if(w.classList.contains('pill')){const q=P(t,t0+i*st,.5);w.style.opacity=cl(q*3);w.style.transform=`scale(${lerp(.4,1,oB(q))}) rotate(${lerp(-6,0,oC(q))}deg)`;w.style.filter=`blur(${(1-oC(q))*8}px)`}
    else{w.style.opacity=p;w.style.transform=`translateY(${(1-p)*36}px)`;w.style.filter=`blur(${(1-p)*12}px)`}
  });
  if(out!==null){const q=oC(P(t,out,.35));el.style.opacity=1-q;el.style.filter=`blur(${q*14}px)`;el.style.transform=`translateY(${-q*30}px)`}
  else{el.style.opacity=1;el.style.filter='';el.style.transform=''}
}
function show(el,t,a,d=.5,b=null,db=.35){const p=oE(P(t,a,d));let o=p,y=(1-p)*40,bl=(1-p)*12,s=lerp(.94,1,p);
  if(b!==null){const q=oC(P(t,b,db));o*=1-q;bl+=q*12;s*=1-q*.04}
  el.style.opacity=o;el.style.filter=`blur(${bl}px)`;el.style.transform=`translateY(${y}px) scale(${s})`}
function type(el,txt,t,a,cps=22){const n=Math.floor(Math.max(0,(t-a)*cps));el.textContent=txt.slice(0,Math.min(txt.length,n))}
const caret=(el,t)=>{el.style.opacity=(Math.floor(t*2.2)%2)?0:1};

// ---------- build dynamic DOM ----------
const tabsTxt=[['Copy of Copy of process_v7','#2ee6ff'],['Inbox (99+)','#ff4fa3'],['FINAL_final.xlsx','#28c840'],['Ops tracker — DO NOT EDIT','#ff8a3d'],['Slack · #approvals','#9b6bff'],['orders_2024 (3).csv','#28c840'],['Jira · 47 open','#2ee6ff'],['Who owns this?','#ff4fa3'],['Untitled spreadsheet','#28c840'],['Re: Re: Fwd: refund','#ff8a3d'],['cron.sh (old)','#9b6bff'],['Status dashboard ?','#2ee6ff']];
const tabPos=[[120,120,-6],[1420,150,5],[260,830,4],[1380,820,-5],[90,470,-3],[1560,470,6],[660,90,3],[980,900,-4],[560,920,6],[1040,70,-6],[200,300,8],[1500,300,-7]];
tabsTxt.forEach((x,i)=>{const d=document.createElement('div');d.className='tab';d.innerHTML=`<b style="background:${x[1]}"></b>${x[0]}`;d.style.left=tabPos[i][0]+'px';d.style.top=tabPos[i][1]+'px';$('tabs').appendChild(d)});
const statsDef=[['12','tabs'],['3','spreadsheets'],['1','very tired inbox']];
statsDef.forEach((s,i)=>{const d=document.createElement('div');d.className='stat';d.innerHTML=(i?'<div class="arr">+</div>':'')+`<div class="box"><span style="color:var(--lime)">${s[0]}</span> ${s[1]}</div>`;$('s1stats').appendChild(d)});
const nodes=[['webhook','Webhooks','webhooks'],['http-request','HTTP calls','http'],['ai-condition','AI conditions','ai'],['send-email','Emails','emails'],['merge','Sub-flows','subflows']];
nodes.forEach((n,i)=>{const d=document.createElement('div');d.className='chip';d.innerHTML=`<img src="assets/${n[0]}.svg">${n[1]}`;d.style.left='1490px';d.style.top=(190+i*150)+'px';$('s4chips').appendChild(d)});
const views=[['v_flowchart','Flowchart','flowchart'],['notations','Swimlanes','swimlanes'],['v_bpmn','BPMN','bpmn'],['v_sequence','Sequence','sequence'],['editor','Simulation','simulation'],['v_3d','3D','d3']];
views.forEach(v=>{const d=document.createElement('div');d.className='shot';d.style.cssText='left:310px;top:190px;width:1300px;height:780px';d.innerHTML=`<div class="view" style="top:0"><img src="shots/${v[0]}.png"></div>`;$('s7cards').appendChild(d)});
const icons=[['crm','CRM','crm',1430,250],['payments','Payments','payments',1650,380],['database','Databases','databases',1440,520],['chat','Chat','chat',1660,650]];
icons.forEach(c=>{const d=document.createElement('div');d.className='chip';d.style.cssText=`left:${c[3]}px;top:${c[4]}px;font-size:28px`;d.innerHTML=`<img src="assets/${c[0]}.svg">${c[1]}`;$('s8icons').appendChild(d)});
const adm=[['admin','Overview','admins',150,170],['branding','Branding','branding',985,170],['audit','Audit · SIEM export','audit',150,610],['health','Health & quotas','health',985,610]];
adm.forEach(a=>{const d=document.createElement('div');d.className='shot';d.style.cssText=`left:${a[3]}px;top:${a[4]}px;width:785px;height:400px`;d.innerHTML=`<div class="view" style="top:0"><img src="shots/${a[0]}.png"></div><div class="chip" style="left:18px;bottom:18px;font-size:24px;padding:10px 18px">${a[1]}</div>`;$('s9grid').appendChild(d)});
['Define it.','Publish it.','Run it.','Prove it.'].forEach(w=>{const d=document.createElement('div');d.className='h';d.style.fontSize='64px';d.style.padding='6px 22px 12px';d.style.borderRadius='16px';d.textContent=w;$('s11row').appendChild(d)});
'xwflow'.split('').forEach(ch=>{const s=document.createElement('span');s.className='w grad';s.textContent=ch;$('s12word').appendChild(s)});
for(let i=0;i<5;i++){const r=document.createElement('div');r.className='ring';$('s12rings').appendChild(r)}

// ---------- scene envelope (zoom-blur transitions) ----------
function env(el,t,a,b){
  const tin=.45,tout=.4;
  if(t<a-.01||t>b+.01){el.style.opacity=0;el.style.display='none';return false}
  el.style.display='block';
  const pi=a===0?1:oC(P(t,a,tin)), po=b>=C.END?0:ioC(P(t,b-tout,tout));
  el.style.opacity=Math.min(pi,1-po);
  const s=lerp(1.08,1,pi)*lerp(1,.92,po);
  el.style.transform=`scale(${s})`;el.style.filter=(pi<1||po>0)?`blur(${(1-pi)*18+po*18}px)`:'none';
  return true;
}

const TYPE0=15.95,TCPS=26;window._pend=[];
function setSrc(img,u){if(img.getAttribute('src')!==u){img.setAttribute('src',u);window._pend.push(img.decode().catch(()=>{}))}}
// show css-space point (cx,cy) of a 1600x1000 UI capture at the centre of a W x H view, zoomed by s
function frame(img,W,H,s,cx,cy){const k=W/1600*s;let ox=cx-W/2/k,oy=cy-H/2/k;ox=Math.max(0,Math.min(1600-W/k,ox));oy=Math.max(0,Math.min(1000-H/k,oy));
  img.style.width=(1600*k)+'px';img.style.left=(-ox*k)+'px';img.style.top=(-oy*k)+'px';return (x,y)=>[(x-ox)*k,(y-oy)*k]}
window.flush=async()=>{const p=window._pend;window._pend=[];await Promise.all(p)};
function render(t){
  // background drift
  $('b1').style.transform=`translate(${-200+Math.sin(t*.21)*260}px,${-250+Math.cos(t*.17)*160}px)`;
  $('b2').style.transform=`translate(${1300+Math.cos(t*.19)*240}px,${400+Math.sin(t*.23)*180}px)`;
  $('b3').style.transform=`translate(${500+Math.sin(t*.13+1)*300}px,${600+Math.cos(t*.11)*140}px)`;
  $('grid').style.transform=`translateY(${-(t*8)%34}px)`;
  const vis={};SC.forEach(s=>vis[s[0]]=env($(s[0]),t,s[1],s[2]));

  if(vis.s1){
    type($('s1a'),'Okay, real talk.',t,C.okay,14);
    const cr=document.createElement('span');cr.className='caret';$('s1a').appendChild(cr);caret(cr,t);
    show($('s1a'),t,.2,.3,C.yourproc-.4);
    words($('s1b'),t,C.yourproc,.07);
    const up=oE(P(t,C.tabs-.2,.6));$('s1b').parentElement.style.transform=`translateY(${-up*70}px)`;
    [...$('s1stats').children].forEach((d,i)=>{const a=[C.tabs,C.sheets,C.inbox][i];const p=P(t,a,.5);d.style.opacity=cl(p*3);d.style.transform=`scale(${lerp(.5,1,oB(p))})`;d.style.filter=`blur(${(1-oC(p))*10}px)`});
    [...$('tabs').children].forEach((d,i)=>{const a=C.tabs+i*.36;const p=P(t,a,.45);const k=tabPos[i];
      const sh=t>C.inbox+1?Math.sin(t*40+i)*3*cl((t-C.inbox-1)*2):0;
      d.style.opacity=cl(p*2)*.85;d.style.transform=`translate(${Math.sin(t*.8+i)*14+sh}px,${Math.cos(t*.7+i)*10+(1-oB(p))*60}px) rotate(${k[2]+Math.sin(t+i)*2}deg) scale(${lerp(.6,1,oB(p))})`});
  }
  if(vis.s2){
    const m=P(t,C.meet,.5);
    words($('s2meet'),t,C.meet-.05,.05,C.xw-.05);
    const lp=P(t,C.xw,.9);
    $('s2mark').style.transform=`scale(${lerp(0,1,oB(cl(lp*1.3)))}) rotate(${lerp(-120,0,oE(lp))}deg)`;$('s2mark').style.opacity=cl(lp*4);
    $('s2mark').style.filter=`drop-shadow(0 0 ${lerp(80,30,oC(lp))}px rgba(155,107,255,.8))`;
    const wp=oE(P(t,C.xw+.18,.8));$('s2word').style.opacity=wp;$('s2word').style.transform=`translateX(${(1-wp)*-80}px)`;$('s2word').style.clipPath=`inset(0 ${(1-wp)*100}% 0 0)`;
    const up=oE(P(t,C.workflow-.15,.7));$('s2logo').style.transform=`translateY(${lerp(60,-10,up)}px) scale(${lerp(1,.78,up)})`;
    words($('s2sub'),t,C.workflow,.09);
  }
  if(vis.s3){
    words($('s3h'),t,C.just-.15,.07);
    const p=oE(P(t,15.3,1.1));const sh=$('s3shot');
    sh.style.transform=`perspective(1800px) translateY(${(1-p)*300}px) rotateX(${lerp(22,0,p)}deg) scale(${lerp(.9,1,p)})`;sh.style.opacity=cl(p*2);
    const n=Math.max(0,Math.min(38,Math.floor((t-TYPE0)*TCPS)));
    setSrc($('s3img'),t>=TYPE0+38/TCPS+.25?'ui/a_done.jpg':`ui/a${String(n).padStart(2,'0')}.jpg`);
    const z=ioC(P(t,15.7,TYPE0+38/TCPS-15.5)),z2=ioC(P(t,17.7,1.5));
    const s=lerp(1,1.55,z)*lerp(1,.85,z2), cx=lerp(800,928,z), cy=lerp(520,548,z)+z2*150;
    frame($('s3img'),1400,782,s,cx,cy);
    words($('s3b'),t,C.drafts,.07);
  }
  if(vis.s4){
    words($('s4h'),t,C.drag-.1,.07);
    const p=oE(P(t,19.45,1));const k=P(t,19.45,7);const sh=$('s4shot');
    sh.style.transform=`perspective(2000px) rotateY(${lerp(14,0,p)}deg) translateX(${(1-p)*-200}px)`;sh.style.opacity=cl(p*2);
    const s=lerp(1.5,1.62,ioC(k)), cx=lerp(520,540,k), cy=lerp(450,455,k);
    const map=frame($('s4img'),1300,782,s,cx,cy);
    // current keyframe
    let i=0;while(i<KF.length-1&&KF[i+1][0]<=t)i++;
    let img='e000';for(let j=0;j<=i;j++)if(KF[j][3]&&KF[j][0]<=t)img=KF[j][3];
    setSrc($('s4img'),`ui/${img}.jpg`);
    const a=KF[i],b=KF[Math.min(i+1,KF.length-1)];const q=b===a||t<a[0]?0:ioC(P(t,a[0],b[0]-a[0]));
    const x=lerp(a[1],b[1],q),y=lerp(a[2],b[2],q);const [px,py]=map(x,y);
    const cu=$('s4cur');cu.style.left=(px-6)+'px';cu.style.top=(py-4)+'px';
    cu.style.opacity=cl(P(t,19.8,.3))*(1-P(t,26.0,.25));const pressed=t>=KF[0][0]&&a[4];
    cu.style.transform=`scale(${pressed?.82:1})`;
    const gh=$('s4ghost');const gl=a[4]&&a[5]?a[5]:'';
    if(gl){gh.style.display='flex';$('s4gl').textContent=gl;$('s4gi').style.background=gl.startsWith('HTTP')?'var(--cyan)':'var(--pink)';
      gh.style.left=(px+14)+'px';gh.style.top=(py+10)+'px';gh.style.transform=`rotate(-3deg) scale(${lerp(.7,1,oB(P(t,a[0],.2)))})`;}
    else gh.style.display='none';
    // ripple on drops / connects
    let rt=-9;KF.forEach((f,j)=>{if(j&&KF[j-1][4]&&!f[4]&&f[0]<=t)rt=f[0]});
    const rq=P(t,rt,.5);const rp=$('s4rip');const rr=lerp(10,90,oC(rq));
    rp.style.width=rp.style.height=rr+'px';rp.style.left=(px-rr/2)+'px';rp.style.top=(py-rr/2)+'px';rp.style.opacity=rq>0&&rq<1?(1-rq):0;
    [...$('s4chips').children].forEach((d,i)=>{const q=P(t,C[nodes[i][2]],.55);d.style.opacity=cl(q*3);d.style.transform=`translateX(${(1-oE(q))*260}px) scale(${lerp(.7,1,oB(q))})`;
      const act=t>=C[nodes[i][2]]&&(i===4||t<C[nodes[i+1][2]]);d.style.borderColor=act?'rgba(200,255,61,.8)':'rgba(255,255,255,.14)';d.style.boxShadow=act?'0 0 50px rgba(200,255,61,.35)':'0 20px 60px rgba(0,0,0,.55)'});
  }
  if(vis.s5){
    const k=P(t,26.3,4);$('s5shot').style.transform=`scale(${1.05+k*.06})`;
    words($('s5h'),t,C.publish-.1,.08);
    [['s5a',C.publish+.25],['s5b',C.test],['s5c',C.prod]].forEach(([id,a])=>{const q=P(t,a,.55);const e=$(id);e.style.opacity=cl(q*3);e.style.transform=`translateY(${(1-oE(q))*40}px) scale(${lerp(.6,1,oB(q))})`;e.style.filter=`blur(${(1-oC(q))*10}px)`});
    $('s5row').style.transform=`translateX(${lerp(260,0,oE(P(t,C.test-.1,.7)))*(1-0)}px) translateX(${lerp(0,-0,1)}px)`;
  }
  if(vis.s6){
    words($('s6h'),t,C.every-.1,.08);
    const p=oE(P(t,30.4,1));const k=P(t,30.4,5);const sh=$('s6shot');
    sh.style.transform=`perspective(1800px) translateY(${(1-p)*260}px) rotateX(${lerp(20,10,p)}deg) scale(${1+k*.05})`;sh.style.opacity=cl(p*2);
    sh.querySelector('img').style.transform=`translateY(${-k*60}px)`;
    const q=P(t,C.immutable,.6);$('s6r').style.opacity=cl(q*3);$('s6r').style.transform=`rotate(${lerp(-12,-3,oE(q))}deg) scale(${lerp(1.6,1,oE(q))})`;$('s6r').style.boxShadow=`0 0 ${80*(1-q)+40}px rgba(200,255,61,${.5-.3*q})`;
    show($('s6w'),t,C.auditors,.5);$('s6w').style.transform+=` rotate(-3deg)`;
  }
  if(vis.s7){
    words($('s7h'),t,C.want-.1,.08);
    const cards=[...$('s7cards').children];const st=views.map(v=>C[v[2]]);
    cards.forEach((d,i)=>{const a=i===0?36.2:st[i]-.15;const q=oE(P(t,a,.55));const nx=i<cards.length-1?oC(P(t,st[i+1]-.15,.55)):0;
      const big=i===5?oE(P(t,st[5],1.2)):0;
      d.style.opacity=q*(1-nx*.0);d.style.zIndex=i;
      d.style.transform=`perspective(2000px) translateX(${(1-q)*700-nx*60}px) rotateY(${(1-q)*-35}deg) translateZ(${-nx*220}px) scale(${1+big*.1})`;
      d.style.filter=nx>0?`brightness(${1-nx*.6}) blur(${nx*4}px)`:'none'});
    const lab=$('s7l');let cur=-1;st.forEach((s,i)=>{if(t>=s-.15)cur=i});
    if(cur>=0&&lab._c!==cur){lab.innerHTML=(cur===5?'even ':'View as ')+`<span class="pill">${views[cur][1]}${cur===5?'!':''}</span>`;lab._w=null;lab._c=cur;lab._t=t}
    if(cur>=0)words(lab,t,st[cur]-.15,.04);else lab.style.opacity=0;
  }
  if(vis.s8){
    words($('s8h'),t,C.connect-.1,.07);
    const p=oE(P(t,43.4,1));const k=P(t,43.4,7);const sh=$('s8shot');
    sh.style.transform=`perspective(2000px) rotateY(${lerp(-20,-6,p)}deg) translateX(${(1-p)*-160}px) scale(${1+k*.04})`;sh.style.opacity=cl(p*2);
    [...$('s8icons').children].forEach((d,i)=>{const q=P(t,C[icons[i][2]],.5);d.style.opacity=cl(q*3);d.style.transform=`translateY(${Math.sin(t*1.6+i)*8}px) scale(${lerp(.3,1,oB(q))})`});
    show($('s8btn'),t,C.reconnect-.2,.5);
    const ck=C.oneclick+.05;const cp=ioC(P(t,C.reconnect+.1,ck-C.reconnect-.15));
    const cu=$('s8cur');cu.style.opacity=cl(P(t,C.reconnect,.3))*(1-P(t,ck+.9,.3));cu.style.left=lerp(1800,1470,cp)+'px';cu.style.top=lerp(1020,850,cp)+'px';
    const pr=t>ck&&t<ck+.15;cu.style.transform=`scale(${pr?.8:1})`;$('s8btn').style.transform+=pr?' scale(.95)':'';
    const done=t>=ck;$('s8txt').textContent=done?'Connected ✓':'Reconnect';$('s8dot').style.background=done?'var(--lime)':'var(--orange)';$('s8btn').style.borderColor=done?'rgba(200,255,61,.8)':'rgba(255,255,255,.14)';
    words($('s8b'),t,C.oneclick-.05,.06);
  }
  if(vis.s9){
    words($('s9h'),t,C.admins-.2,.08);
    const ts=[C.admins+.2,C.branding,C.audit,C.health];const zo=oC(P(t,C.allinone-.3,.8));
    [...$('s9grid').children].forEach((d,i)=>{const q=P(t,ts[i],.6);d.style.opacity=cl(q*3)*(1-zo*.55);
      d.style.transform=`perspective(1600px) translateY(${(1-oE(q))*120}px) rotateX(${(1-oE(q))*30}deg) scale(${lerp(.85,1,oE(q))*(1-zo*.08)})`;d.style.filter=zo>0?`blur(${zo*5}px)`:'none'});
    $('s9h').parentElement.style.opacity=1-zo;
    words($('s9b'),t,C.allinone-.1,.08);
  }
  if(vis.s10){
    const p=oE(P(t,56.35,1));const k=P(t,56.35,3.3);const sh=$('s10shot');
    sh.style.transform=`perspective(1800px) rotateY(${lerp(-30,-14,p)}deg) translateX(${(1-p)*300}px) scale(${1+k*.04})`;sh.style.opacity=cl(p*2);
    words($('s10a'),t,C.selfhost-.1,.1);words($('s10b'),t,C.orrun-.1,.08);
  }
  if(vis.s11){
    const p=P(t,C.xwflow-.1,.8);const x=$('s11x');x.style.opacity=cl(p*3);x.style.transform=`scale(${lerp(1.3,1,oE(p))})`;x.style.filter=`blur(${(1-oE(p))*20}px)`;
    x.style.backgroundPosition=`${t*40}px 0`;
    const ts=[C.define,C.publish2,C.run2,C.prove];
    [...$('s11row').children].forEach((d,i)=>{const q=P(t,ts[i]-.05,.45);d.style.opacity=cl(q*3);d.style.transform=`translateY(${(1-oE(q))*40}px) scale(${lerp(.6,1,oB(q))})`;d.style.filter=`blur(${(1-oC(q))*10}px)`;
      const act=t>=ts[i]-.05&&(i===3||t<ts[i+1]-.05);d.style.background=act?'var(--lime)':'transparent';d.style.color=act?'#0b0b10':(t>ts[i]?'#8c8ca3':'#fff');d.style.boxShadow=act?'0 0 50px rgba(200,255,61,.4)':'none'});
  }
  if(vis.s12){
    const t0=C.final;const g=P(t,t0,1.2);
    const dot=$('s12dot');const r=lerp(10,260,oE(g))*(1-oC(P(t,t0+1.1,.5)));dot.style.width=dot.style.height=r+'px';dot.style.left=(960-r/2)+'px';dot.style.top=(540-r/2-70)+'px';dot.style.opacity=1-P(t,t0+1.2,.4);
    [...$('s12rings').children].forEach((d,i)=>{const q=P(t,t0+.1+i*.14,1.8);const rr=lerp(40,1500,oC(q));d.style.width=d.style.height=rr+'px';d.style.left=(960-rr/2)+'px';d.style.top=(470-rr/2)+'px';d.style.opacity=(1-q)*.8*(q>0?1:0)});
    const lp=P(t,t0+1.05,.9);const mk=$('s12mark');mk.style.opacity=cl(lp*3);mk.style.transform=`scale(${lerp(.2,1,oB(lp))}) rotate(${lerp(-90,0,oE(lp))}deg)`;
    mk.style.filter=`drop-shadow(0 0 ${30+20*Math.sin(t*2)}px rgba(155,107,255,.75))`;
    split($('s12word')).forEach((s,i)=>{const q=P(t,t0+1.3+i*.07,.6);s.style.opacity=cl(q*2.5);s.style.transform=`translateY(${(1-oE(q))*60}px) scale(${lerp(1.4,1,oE(q))})`;s.style.filter=`blur(${(1-oE(q))*14}px)`});
    $('s12word').style.backgroundPosition=`${t*30}px 0`;
    const sw=P(t,t0+2.5,1.1);$('s12sweep').style.left=lerp(-300,1300,ioC(sw))+'px';$('s12sweep').style.opacity=sw>0&&sw<1?1:0;
    const lg=oE(P(t,t0+2.2,1));$('s12logo').style.transform=`translateY(${lerp(80,0,lg)}px) scale(${1+P(t,t0,6.6)*.04})`;
    words($('s12tag'),t,t0+2.4,.08);words($('s12cta'),t,t0+3.4,.1);
  }
  // circle-burst transitions (meet + final), flashes
  const cb=(a)=>{const q=P(t,a-.15,.7);return q>0&&q<1?q:0};
  let c=0,ca=0;[C.meet-.2].forEach(a=>{const q=cb(a);if(q){c=q;ca=a}});
  if(c){const rr=lerp(0,2600,oC(c));$('circ').style.background=`radial-gradient(circle at 50% 50%, transparent ${rr*.42}px, rgba(200,255,61,${.55*(1-c)}) ${rr*.48}px, transparent ${rr*.5}px)`}else $('circ').style.background='none';
  let fl=0;[C.meet-.15,C.drag-.15,C.want-.15,C.xwflow-.15,C.final+1.0].forEach(a=>{const q=P(t,a,.35);if(q>0&&q<1)fl=Math.max(fl,(1-q)*.35)});$('flash').style.opacity=fl;
  $('fade').style.opacity=Math.max(1-P(t,0,.6),P(t,C.END-1.2,1.1));
}
window.render=render;window.ready=document.fonts.ready;
const q=new URLSearchParams(location.search);if(q.get('t'))render(+q.get('t'));
