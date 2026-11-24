function SOLVER(){
 const R=c=>c%13+1,SI=c=>c/13|0,red=c=>c<26,ch=a=>String.fromCharCode.apply(null,a.map(x=>x+48));
 function reach(L,p,k){
  if(!L)return[];
  if(k==1)return Array.from({length:L},(_,i)=>L-1-i);
  const s=new Set();if(p>0)s.add(p-1);
  for(let i=p-1+k;;i+=k){if(i>=L-1){s.add(L-1);break}s.add(i)}
  for(let i=k-1;;i+=k){if(i>=L-1){s.add(L-1);break}s.add(i)}
  return[...s];
 }
 const safe=(c,f)=>{const r=R(c);if(f[SI(c)]!=r-1)return false;if(r<=2)return true;return red(c)?f[2]>=r-1&&f[3]>=r-1:f[0]>=r-1&&f[1]>=r-1};
 const canT=(c,col)=>!col.c.length?R(c)==13:(red(col.c.at(-1))!=red(c)&&R(col.c.at(-1))==R(c)+1);
 /* st: {cols:[{d:hidden count,c:[ids]}], tal:[waste bottom→top, then stock in draw order], p:waste size, f:[cards per suit h,d,c,s]}
    returns {res:1 solvable | 0 unsolvable | -1 out of time, first:{card,to:'f'|'tN'} or null} */
 function solve(st0,draw,ms){
  const t0=Date.now(),seen=new Set();let nodes=0,out=false,first=null;
  const clone=st=>({cols:st.cols.map(o=>({d:o.d,c:o.c.slice()})),tal:st.tal.slice(),p:st.p,f:st.f.slice()});
  const fix=o=>{if(o.d>0&&o.d>=o.c.length)o.d=o.c.length-1};
  function auto(st,rec){
   let again=true;
   while(again){again=false;
    for(const o of st.cols)if(o.c.length&&safe(o.c.at(-1),st.f)){const c=o.c.pop();if(rec)rec.push({card:c,to:'f'});st.f[SI(c)]++;fix(o);again=true}
    for(const q of reach(st.tal.length,st.p,draw)){const c=st.tal[q];if(safe(c,st.f)){if(rec)rec.push({card:c,to:'f'});st.f[SI(c)]++;st.tal.splice(q,1);st.p=q;again=true;break}}
   }
  }
  function key(st){return st.f.join('.')+'#'+st.cols.map(o=>o.d+ch(o.c)).sort().join('|')+'#'+ch(st.tal)+'#'+(draw==1?0:st.p)}
  function gen(st){
   const M=[],C=st.cols,f=st.f;
   C.forEach((o,j)=>{if(o.c.length){const c=o.c.at(-1);if(f[SI(c)]==R(c)-1)M.push([100,'tf',j])}});
   const rq=reach(st.tal.length,st.p,draw);
   for(const q of rq){const c=st.tal[q];if(f[SI(c)]==R(c)-1)M.push([90,'wf',q])}
   C.forEach((o,j)=>{
    for(let i=o.d;i<o.c.length;i++){
     const c=o.c[i];let sc;
     if(i==o.d&&o.d>0)sc=80+o.d;
     else if(i==0)sc=50;
     else{const u=o.c[i-1];if(f[SI(u)]==R(u)-1)sc=70;else continue}
     let emptyDone=false;
     C.forEach((t,k)=>{if(k==j||!canT(c,t))return;if(!t.c.length){if(i==0||emptyDone)return;emptyDone=true}M.push([sc,'tt',j,i,k])});
    }
   });
   for(const q of rq){const c=st.tal[q];let emptyDone=false;C.forEach((t,k)=>{if(!canT(c,t))return;if(!t.c.length){if(emptyDone)return;emptyDone=true}M.push([t.c.length?60:55,'wt',q,k])})}
   return M.sort((a,b)=>b[0]-a[0]);
  }
  function desc(st,m){
   if(m[1]=='tf')return{card:st.cols[m[2]].c.at(-1),to:'f'};
   if(m[1]=='wf')return{card:st.tal[m[2]],to:'f'};
   if(m[1]=='tt')return{card:st.cols[m[2]].c[m[3]],to:'t'+m[4]};
   return{card:st.tal[m[2]],to:'t'+m[3]};
  }
  function apply(st,m){
   const n=clone(st);
   if(m[1]=='tf'){const o=n.cols[m[2]],c=o.c.pop();n.f[SI(c)]++;fix(o)}
   else if(m[1]=='wf'){const c=n.tal.splice(m[2],1)[0];n.f[SI(c)]++;n.p=m[2]}
   else if(m[1]=='tt'){const o=n.cols[m[2]],run=o.c.splice(m[3]);n.cols[m[4]].c.push(...run);fix(o)}
   else{const c=n.tal.splice(m[2],1)[0];n.cols[m[3]].c.push(c);n.p=m[2]}
   return n;
  }
  function dfs(st,d){
   if(out)return false;
   if((++nodes&1023)==0&&Date.now()-t0>ms){out=true;return false}
   const rec=d==0?[]:null;auto(st,rec);if(rec&&rec.length)first=rec[0];
   if(st.f[0]+st.f[1]+st.f[2]+st.f[3]==52)return true;
   if(!st.tal.length&&st.cols.every(o=>o.d==0))return true;
   const k=key(st);if(seen.has(k))return false;seen.add(k);
   for(const m of gen(st)){
    const ds=d==0&&!first?desc(st,m):null;
    if(dfs(apply(st,m),d+1)){if(ds)first=ds;return true}
    if(out)return false;
   }
   return false;
  }
  const ok=dfs(clone(st0),0);
  return{res:ok?1:out?-1:0,first:ok?first:null};
 }
 if(typeof importScripts=='function')onmessage=e=>{const d=e.data;postMessage(Object.assign({id:d.id},solve(d.st,d.draw,d.ms)))};
 return solve;
}
if(typeof module!='undefined')module.exports=SOLVER;
