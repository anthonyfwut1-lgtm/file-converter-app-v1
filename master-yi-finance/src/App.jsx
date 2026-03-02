import { useState, useRef, useEffect } from "react";

/* ─── Fonts ─────────────────────────────────────────────── */
const FONT = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";

/* ─── Config ─────────────────────────────────────────────── */
const SUPABASE_URL = "https://mzqmbheyrodwxlkkqtxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_U9DYjVsztSaSnCW3_iZ6fg_ag17ThQo";

/* ─── Supabase mini-client ───────────────────────────────── */
const sb = {
  _token: null, _user: null,
  headers: () => ({ "Content-Type":"application/json", "apikey":SUPABASE_KEY, "Authorization":`Bearer ${sb._token||SUPABASE_KEY}` }),
  async signIn(email,pass){ const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify({email,password:pass})}); const d=await r.json(); if(d.access_token){sb._token=d.access_token;sb._user=d.user;} return d; },
  async signUp(email,pass){ const r=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify({email,password:pass})}); return r.json(); },
  async signOut(){ await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:sb.headers()}); sb._token=null;sb._user=null; },
};

/* ─── Claude API ─────────────────────────────────────────── */
const claude = async (messages, system="") => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
};

/* ─── Helpers ────────────────────────────────────────────── */
const today   = () => new Date().toISOString().split("T")[0];
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmt     = (n,c="AUD") => `${({AUD:"A$",USD:"US$",HKD:"HK$",GBP:"£",CNY:"¥"}[c]||"$")}${Number(n||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`;
const pad4    = (n) => String(n).padStart(4,"0");
const uid     = () => Math.random().toString(36).slice(2,9);
const mkItem  = () => ({id:uid(),description:"",qty:1,unit:"day",rate:0,gst:true});

/* ─── Theme ──────────────────────────────────────────────── */
const LIGHT = {
  bg:"#ffffff", bgSub:"#f9f9f9", surface:"#ffffff", surface2:"#f5f5f5", surface3:"#efefef",
  border:"#e5e5e5", borderFocus:"#10a37f",
  text:"#0d0d0d", textSub:"#6b6b6b", textMuted:"#b0b0b0",
  accent:"#10a37f", accentBg:"#f0fdf9", accentText:"#0d7a5f",
  navBg:"#ffffff", navBorder:"#e5e5e5",
  cardBg:"#ffffff", cardBorder:"#e5e5e5",
  tableBg:"#ffffff", tableRow:"#fafafa",
  red:"#dc2626", amber:"#d97706", blue:"#2563eb", green:"#10a37f",
};
const DARK = {
  bg:"#0a0a0a", bgSub:"#111111", surface:"#111111", surface2:"#1a1a1a", surface3:"#222222",
  border:"rgba(255,255,255,0.08)", borderFocus:"#10a37f",
  text:"#f5f5f5", textSub:"#737373", textMuted:"#3a3a3a",
  accent:"#10a37f", accentBg:"rgba(16,163,127,0.1)", accentText:"#34d399",
  navBg:"#0a0a0a", navBorder:"rgba(255,255,255,0.07)",
  cardBg:"#111111", cardBorder:"rgba(255,255,255,0.08)",
  tableBg:"#111111", tableRow:"#141414",
  red:"#f87171", amber:"#fbbf24", blue:"#60a5fa", green:"#34d399",
};

/* ─── Nav Structure ──────────────────────────────────────── */
const NAV = [
  { section:"MAIN", items:[
    { id:"overview",  icon:"⊞", label:"Overview" },
    { id:"invoices",  icon:"◻", label:"Invoices" },
    { id:"receipts",  icon:"⊟", label:"Receipts & Expenses" },
  ]},
  { section:"ACCOUNTING", items:[
    { id:"bank",      icon:"⇄", label:"Bank Reconciliation" },
    { id:"gst",       icon:"◈", label:"GST / BAS" },
    { id:"tax",       icon:"◉", label:"Tax Returns" },
    { id:"reports",   icon:"▤", label:"Reports" },
  ]},
  { section:"AI TOOLS", items:[
    { id:"assistant", icon:"✦", label:"Yi Assistant" },
    { id:"audit",     icon:"⊛", label:"Smart Audit" },
    { id:"forecast",  icon:"⟡", label:"Cash Flow Forecast" },
  ]},
  { section:"SETTINGS", items:[
    { id:"clients",   icon:"◎", label:"Clients & Vendors" },
  ]},
];

const BIZ = {
  company:"ZHE (Anthony) FU",
  addr1:"Unit 5/ 56 The Avenue,", addr2:"Hurstville, NSW, 2220", addr3:"",
  abn:"75 272 105 492", phone:"+61 426 833 866",
  bank:"ING Banking", acctName:"Zhe (Anthony) Fu", acctNo:"677 60317", bsb:"923 100",
};

/* ══════════════════════════════════════════════════════════
   SHARED COMPONENTS
══════════════════════════════════════════════════════════ */
const Card = ({children, style, T}) => (
  <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,...style}}>{children}</div>
);

const CardHeader = ({title, action, T}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.border}`}}>
    <div style={{fontSize:13,fontWeight:500,color:T.text}}>{title}</div>
    {action && <div style={{fontSize:12,color:T.textSub,cursor:"pointer"}}>{action}</div>}
  </div>
);

const StatusPill = ({status, T}) => {
  const map = {
    paid:   {label:"Paid",    bg:`${T.green}15`, color:T.green},
    sent:   {label:"Sent",    bg:`${T.blue}15`,  color:T.blue},
    overdue:{label:"Overdue", bg:`${T.red}15`,   color:T.red},
    draft:  {label:"Draft",   bg:T.surface2,     color:T.textSub},
  };
  const s = map[status] || map.draft;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:500,background:s.bg,color:s.color}}>
      <span style={{width:4,height:4,borderRadius:"50%",background:s.color,display:"inline-block"}}/>
      {s.label}
    </span>
  );
};

const Inp = ({label, T, style:s, ...props}) => (
  <div style={{marginBottom:10,...s}}>
    {label && <label style={{display:"block",fontSize:10.5,letterSpacing:"0.07em",textTransform:"uppercase",color:T.textMuted,marginBottom:4}}>{label}</label>}
    <input style={{width:"100%",padding:"8px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} {...props}/>
  </div>
);

const Sel = ({label, T, children, style:s, ...props}) => (
  <div style={{marginBottom:10,...s}}>
    {label && <label style={{display:"block",fontSize:10.5,letterSpacing:"0.07em",textTransform:"uppercase",color:T.textMuted,marginBottom:4}}>{label}</label>}
    <select style={{width:"100%",padding:"8px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:7,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} {...props}>{children}</select>
  </div>
);

const Btn = ({variant="ghost", T, children, style:s, ...props}) => {
  const styles = {
    primary:{background:T.accent,color:"#fff",border:"none"},
    ghost:  {background:"transparent",color:T.textSub,border:`1px solid ${T.border}`},
    danger: {background:`${T.red}12`,color:T.red,border:`1px solid ${T.red}30`},
  };
  return <button style={{padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",...styles[variant],...s}} {...props}>{children}</button>;
};

/* ══════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════ */
function Auth({onAuth, T}) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setErr("");
    const d = mode==="signin" ? await sb.signIn(email,pass) : await sb.signUp(email,pass);
    setLoading(false);
    if (d.access_token||d.user) onAuth(d.user||d);
    else setErr(d.error_description||d.msg||"Something went wrong");
  };

  return (
    <div style={{minHeight:"100vh",width:"100vw",background:T.bg,display:"flex",fontFamily:"'Geist',sans-serif"}}>
      {/* Left panel — branding */}
      <div style={{flex:1,background:T===LIGHT?"#0a0a0a":"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 48px",position:"relative",overflow:"hidden"}}>
        {/* Background texture */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 30% 50%, rgba(16,163,127,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(16,163,127,0.06) 0%, transparent 50%)"}}/>
        {/* AF Logo */}
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:32}}>
          <div style={{width:96,height:96,borderRadius:"50%",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:"0 0 60px rgba(16,163,127,0.3)"}}>
            <div style={{color:"#0a0a0a",fontSize:30,fontWeight:700,lineHeight:1}}>AF</div>
            <div style={{color:"#999",fontSize:7.5,letterSpacing:"0.18em",marginTop:4,textTransform:"uppercase"}}>ANTHONY FU</div>
            <div style={{color:"#888",fontSize:6.5,letterSpacing:"0.14em",textTransform:"uppercase"}}>COMPANY</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:700,color:"#fff",letterSpacing:"-0.02em",marginBottom:8}}>Master Yi</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Invoicing · Finance</div>
            <div style={{marginTop:24,fontSize:13,color:"rgba(255,255,255,0.25)",lineHeight:1.7,maxWidth:260}}>
              Invoice management, GST tracking,<br/>and AI-powered tax assistance<br/>for Dvuln Pty Ltd.
            </div>
          </div>
          {/* ABN badge */}
          <div style={{padding:"6px 14px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'Geist Mono',monospace"}}>
            ABN 75 272 105 492
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{width:460,minWidth:460,display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 48px",background:T.bg}}>
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:36}}>
            <div style={{width:30,height:30,borderRadius:7,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="13" height="13" viewBox="0 0 14 14"><path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5Z" fill="#fff"/></svg>
            </div>
            <div style={{fontSize:13,fontWeight:600,color:T.text}}>Master Yi · Invoicing</div>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:6,letterSpacing:"-0.02em"}}>{mode==="signin"?"Welcome back":"Create account"}</div>
          <div style={{fontSize:13.5,color:T.textSub,marginBottom:28}}>{mode==="signin"?"Sign in to your finance dashboard":"Set up your Master Yi account"}</div>
          <Inp label="Email" T={T} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="anthony@dvuln.com"/>
          <Inp label="Password" T={T} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/>
          {err && <div style={{fontSize:12,color:T.red,padding:"8px 10px",background:`${T.red}10`,borderRadius:6,marginBottom:12}}>{err}</div>}
          <Btn variant="primary" T={T} style={{width:"100%",padding:"11px",marginBottom:14,fontSize:14,opacity:loading?0.6:1}} onClick={submit}>{loading?"...":mode==="signin"?"Sign In":"Create Account"}</Btn>
          <div style={{textAlign:"center",fontSize:13,color:T.textSub}}>
            {mode==="signin"?"No account? ":"Have an account? "}
            <span onClick={()=>setMode(mode==="signin"?"signup":"signin")} style={{color:T.accent,cursor:"pointer",fontWeight:500}}>{mode==="signin"?"Sign up":"Sign in"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OVERVIEW DASHBOARD
══════════════════════════════════════════════════════════ */
function Overview({onNav, T}) {
  const [period, setPeriod] = useState("Q3");
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs]   = useState([
    {role:"ai", text:"G'day Anthony. Q3 BAS is due in 12 days. You've collected $8,425 GST with $1,243 in claimable credits — net payable $7,182. Want me to prepare the BAS summary?"},
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const msgEnd = useRef(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({behavior:"smooth"}); }, [aiMsgs]);

  const sendAi = async () => {
    if (!aiInput.trim()) return;
    const txt = aiInput.trim(); setAiInput("");
    setAiMsgs(p=>[...p,{role:"user",text:txt}]);
    setAiLoading(true);
    const reply = await claude([{role:"user",content:txt}],
      "You are Yi, a concise finance assistant for Dvuln Pty Ltd, a cybersecurity consultancy in Sydney, Australia. Help with invoices, GST, BAS, expenses, tax. Keep replies under 3 sentences. Be direct and practical. Use Australian English.");
    setAiMsgs(p=>[...p,{role:"ai",text:reply}]);
    setAiLoading(false);
  };

  const kpis = [
    {label:"Revenue (AUD)", val:"$84,250", sub:"+18% vs last quarter", color:T.green, subPos:true},
    {label:"Outstanding",   val:"$22,000", sub:"2 invoices unpaid",    color:T.amber, subPos:false},
    {label:"GST Collected", val:"$8,425",  sub:"$1,243 credits",       color:T.accent,subPos:true},
    {label:"Net GST Due",   val:"$7,182",  sub:"Due 28 Oct",           color:T.red,   subPos:false},
  ];

  const invoices = [
    {num:"INV-0041",client:"Commonwealth Bank",type:"Adversary Simulation",cur:"AUD",amount:"$19,250",gst:"incl. GST $1,750",status:"paid"},
    {num:"INV-0042",client:"Atlassian",type:"Web App Pentest",cur:"USD",amount:"US$12,000",gst:"≈ A$18,480",status:"sent"},
    {num:"INV-0043",client:"HSBC Hong Kong",type:"Red Team Exercise",cur:"HKD",amount:"HK$85,000",gst:"≈ A$16,490",status:"overdue"},
    {num:"INV-0044",client:"Afterpay",type:"API Security Review",cur:"AUD",amount:"$8,800",gst:"incl. GST $800",status:"draft"},
  ];

  const bars = [42,60,35,72,55,80,48];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:T.bg}}>
      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 28px",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bg}}>
        <div>
          <div style={{fontSize:16,fontWeight:600,color:T.text}}>Overview</div>
          <div style={{fontSize:12,color:T.textSub,marginTop:2}}>Dvuln Pty Ltd · FY2025</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",gap:1,background:T.surface2,borderRadius:8,padding:3}}>
            {["Q1","Q2","Q3","Q4","YTD"].map(p=>(
              <div key={p} onClick={()=>setPeriod(p)} style={{padding:"4px 11px",borderRadius:6,fontSize:12,cursor:"pointer",fontWeight:period===p?500:400,background:period===p?T.surface:T.surface2,color:period===p?T.text:T.textSub,transition:"all 0.12s",boxShadow:period===p?`0 1px 3px rgba(0,0,0,0.08)`:""}}>{p}</div>
            ))}
          </div>
          <Btn T={T} style={{fontSize:12,padding:"6px 12px"}}>↑ Export BAS</Btn>
          <Btn variant="primary" T={T} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>onNav("invoices")}>+ New Invoice</Btn>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:16}}>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {kpis.map(k=>(
            <Card key={k.label} T={T} style={{padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:k.color,display:"inline-block",boxShadow:`0 0 6px ${k.color}80`}}/>
                <span style={{fontSize:11.5,color:T.textSub}}>{k.label}</span>
              </div>
              <div style={{fontFamily:"'Geist Mono',monospace",fontSize:24,color:T.text,marginBottom:7,fontWeight:500}}>{k.val}</div>
              <div style={{fontSize:11.5,padding:"2px 8px",borderRadius:20,display:"inline-block",background:k.subPos?`${T.green}12`:T.surface2,color:k.subPos?T.green:T.textSub}}>{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* Main 2-col */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
          {/* Invoice table */}
          <Card T={T}>
            <CardHeader T={T} title="Recent Invoices" action={<span onClick={()=>onNav("invoices")} style={{color:T.accent,fontSize:12}}>View all →</span>}/>
            {/* Mini chart */}
            <div style={{padding:"16px 20px 0",display:"flex",alignItems:"flex-end",gap:6,height:64}}>
              {bars.map((h,i)=>(
                <div key={i} style={{flex:1,height:`${h}%`,background:i===6?T.accent:T.surface3,borderRadius:"3px 3px 0 0",transition:"all 0.2s"}}/>
              ))}
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Number","Client","Amount","Status"].map((h,i)=>(
                    <th key={h} style={{padding:"10px 20px",textAlign:i>=2?"right":"left",fontSize:10.5,letterSpacing:"0.06em",textTransform:"uppercase",color:T.textMuted,fontWeight:400}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv=>(
                  <tr key={inv.num} style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer",transition:"background 0.1s"}}
                    onMouseOver={e=>e.currentTarget.style.background=T.surface2}
                    onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 20px",fontFamily:"'Geist Mono',monospace",fontSize:12,color:T.textSub}}>{inv.num}</td>
                    <td style={{padding:"12px 20px"}}>
                      <div style={{fontSize:13,fontWeight:500,color:T.text}}>{inv.client}</div>
                      <div style={{fontSize:11.5,color:T.textSub,marginTop:2}}>
                        {inv.type}
                        <span style={{marginLeft:6,padding:"1px 5px",borderRadius:3,fontSize:9.5,background:T.surface2,color:T.textSub,border:`1px solid ${T.border}`,fontFamily:"'Geist Mono',monospace"}}>{inv.cur}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 20px",textAlign:"right"}}>
                      <div style={{fontFamily:"'Geist Mono',monospace",fontSize:13,color:T.text}}>{inv.amount}</div>
                      <div style={{fontSize:11,color:T.textSub,marginTop:1}}>{inv.gst}</div>
                    </td>
                    <td style={{padding:"12px 20px",textAlign:"right"}}><StatusPill status={inv.status} T={T}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* AI Chat */}
          <Card T={T} style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:T.accent,display:"inline-block",boxShadow:`0 0 8px ${T.accent}`}}/>
                <span style={{fontSize:13,fontWeight:500,color:T.text}}>Yi Assistant</span>
              </div>
              <span style={{fontSize:10,color:T.textMuted,fontFamily:"'Geist Mono',monospace"}}>claude-sonnet</span>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:10,maxHeight:260}}>
              {aiMsgs.map((m,i)=>(
                <div key={i} style={{display:"flex",gap:8,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,background:m.role==="ai"?T.accent:T.surface2,color:m.role==="ai"?"#fff":T.textSub}}>
                    {m.role==="ai"?"Yi":"AW"}
                  </div>
                  <div style={{maxWidth:"85%",padding:"9px 12px",borderRadius:m.role==="ai"?"4px 10px 10px 10px":"10px 4px 10px 10px",background:m.role==="ai"?T.surface2:T.accent,color:m.role==="ai"?T.text:"#fff",fontSize:12.5,lineHeight:1.55}}>
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,color:"#fff"}}>Yi</div>
                  <div style={{padding:"10px 14px",background:T.surface2,borderRadius:"4px 10px 10px 10px",display:"flex",gap:4,alignItems:"center"}}>
                    {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:T.textMuted,animation:`bounce 1.2s ease infinite ${i*0.2}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={msgEnd}/>
            </div>
            <div style={{padding:"8px 12px",borderTop:`1px solid ${T.border}`,display:"flex",gap:5,flexWrap:"wrap"}}>
              {["Prepare BAS","FX rates","Tax summary","New invoice"].map(c=>(
                <div key={c} onClick={()=>setAiInput(c)} style={{padding:"3px 9px",border:`1px solid ${T.border}`,borderRadius:20,fontSize:11,color:T.textSub,cursor:"pointer",transition:"all 0.12s"}}
                  onMouseOver={e=>{e.target.style.borderColor=T.accent;e.target.style.color=T.accent;}}
                  onMouseOut={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.textSub;}}>{c}</div>
              ))}
            </div>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,display:"flex",gap:7}}>
              <input style={{flex:1,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",color:T.text,fontSize:12.5,fontFamily:"inherit",outline:"none"}}
                placeholder="Ask anything..." value={aiInput}
                onChange={e=>setAiInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendAi()}/>
              <button onClick={sendAi} style={{width:32,height:32,borderRadius:8,background:T.accent,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 6h10M6 1l5 5-5 5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </Card>
        </div>

        {/* Bottom: BAS + Receipts */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card T={T}>
            <CardHeader T={T} title="BAS Summary — Q3 2025" action="Download PDF"/>
            {[
              ["Total Sales","G1","$84,250",null,false],
              ["GST-free Sales","G3","$0",null,false],
              ["GST on Sales","1A","$8,425",T.red,false],
              ["GST Credits (ITC)","1B","− $1,243",T.green,false],
              ["Net GST Payable","","$7,182",null,true],
            ].map(([label,code,val,vc,bold])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 20px",borderBottom:`1px solid ${T.border}`,background:bold?T.surface2:"transparent"}}>
                <div style={{fontSize:13,color:bold?T.text:T.textSub,fontWeight:bold?500:400}}>
                  {label}{code&&<span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:T.textMuted,marginLeft:8}}>{code}</span>}
                </div>
                <div style={{fontFamily:"'Geist Mono',monospace",fontSize:13,color:vc||(bold?T.text:T.textSub),fontWeight:bold?600:400}}>{val}</div>
              </div>
            ))}
            <div style={{padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:T.amber}}>⚠ 2 receipts missing ABN — may affect ITC</div>
              <Btn T={T} style={{fontSize:11.5,padding:"4px 10px"}}>Review</Btn>
            </div>
          </Card>

          <Card T={T}>
            <CardHeader T={T} title="Recent Receipts" action={<span onClick={()=>onNav("receipts")} style={{color:T.accent}}>View all →</span>}/>
            <div onClick={()=>onNav("receipts")} style={{margin:"14px 16px 8px",border:`1px dashed ${T.border}`,borderRadius:8,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}
              onMouseOver={e=>e.currentTarget.style.background=T.surface2}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:32,height:32,borderRadius:8,background:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.accent,fontSize:18,flexShrink:0}}>↑</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:T.text}}>Upload receipt</div>
                <div style={{fontSize:11.5,color:T.textSub,marginTop:1}}>AI extracts vendor, amount & GST automatically</div>
              </div>
            </div>
            <div style={{padding:"0 16px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {v:"AWS Australia",m:"Cloud · 1 Oct",a:"$143.00",g:"GST $13 · Claimable",ok:true},
                {v:"Canva Pro",m:"Software · 28 Sep",a:"$19.99",g:"GST $1.82 · Claimable",ok:true},
                {v:"Grab (SG)",m:"Travel · 15 Sep",a:"SGD 24.50",g:"No ABN · Not claimable",ok:false},
                {v:"Kali Linux Pro",m:"Software · 10 Sep",a:"US$49.00",g:"Foreign · N/A",ok:true},
              ].map(r=>(
                <div key={r.v} style={{background:T.surface2,border:`1px solid ${r.ok?T.border:T.red+"30"}`,borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:12.5,fontWeight:500,color:T.text,marginBottom:2}}>{r.v}</div>
                  <div style={{fontSize:11,color:T.textSub,marginBottom:6}}>{r.m}</div>
                  <div style={{fontFamily:"'Geist Mono',monospace",fontSize:13,color:T.text}}>{r.a}</div>
                  <div style={{fontSize:11,color:r.ok?T.green:T.red,marginTop:2}}>{r.g}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INVOICE BUILDER
══════════════════════════════════════════════════════════ */
function InvoiceBuilder({T}) {
  const CURRENCIES = {AUD:{sym:"A$",gst:true},USD:{sym:"US$",gst:false},HKD:{sym:"HK$",gst:false},GBP:{sym:"£",gst:false},CNY:{sym:"¥",gst:false}};
  const [inv, setInv] = useState({inv_num:77,issue_date:today(),due_date:"2026-03-10",currency:"AUD",gst_rate:0.1,project_ref:"",reference:"",ref_code:"",notes:"",status:"draft",items:[mkItem()]});
  const [client, setClient] = useState({name:"",address:"",city:"",state:"",postcode:"",phone:"",abn:""});
  const [tab, setTab] = useState("inv");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const upd = (k,v) => setInv(p=>({...p,[k]:v}));
  const updC = (k,v) => setClient(p=>({...p,[k]:v}));
  const addItem = () => setInv(p=>({...p,items:[...p.items,mkItem()]}));
  const rmItem  = id => setInv(p=>({...p,items:p.items.filter(i=>i.id!==id)}));
  const updItem = (id,k,v) => setInv(p=>({...p,items:p.items.map(i=>i.id===id?{...i,[k]:v}:i)}));

  const cur = CURRENCIES[inv.currency]??CURRENCIES.AUD;
  const lines = inv.items.map(it=>({...it,sub:it.qty*it.rate,gstAmt:cur.gst&&it.gst?it.qty*it.rate*inv.gst_rate:0}));
  const subtotal = lines.reduce((s,l)=>s+l.sub,0);
  const gstTotal = lines.reduce((s,l)=>s+l.gstAmt,0);
  const total    = subtotal+gstTotal;
  const mono     = {fontFamily:"'Geist Mono',monospace"};

  const sideInp = {width:"100%",padding:"7px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:6,color:T.text,fontSize:12.5,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const sideSel = {...sideInp};
  const sideLbl = {display:"block",fontSize:9.5,letterSpacing:"0.09em",textTransform:"uppercase",color:T.textMuted,marginBottom:4};
  const Fld = ({label,children,style:s})=><div style={{marginBottom:8,...s}}><label style={sideLbl}>{label}</label>{children}</div>;

  const TabBtn = ({id,label})=>(
    <button onClick={()=>setTab(id)} style={{flex:1,padding:"6px 0",borderRadius:6,cursor:"pointer",background:tab===id?T.surface:"transparent",color:tab===id?T.text:T.textSub,border:"none",fontSize:12,fontFamily:"inherit",fontWeight:tab===id?500:400,boxShadow:tab===id?`0 1px 3px rgba(0,0,0,0.08)`:""}}>
      {label}
    </button>
  );

  const print = () => {
    const el = document.getElementById("inv-print");
    const w = window.open("","_blank");
    w.document.write(`<html><head><link href="${FONT}" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}@page{size:A4;margin:12mm}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),700);
  };

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      {/* Editor sidebar */}
      <div style={{width:276,minWidth:276,borderRight:`1px solid ${T.border}`,padding:"14px 12px",overflowY:"auto",background:T.surface,display:"flex",flexDirection:"column",gap:0}}>
        <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14,padding:"0 2px"}}>Invoice Builder</div>

        <div style={{display:"flex",gap:3,background:T.surface2,borderRadius:8,padding:3,marginBottom:14}}>
          <TabBtn id="inv" label="Invoice"/><TabBtn id="client" label="Client"/>
        </div>

        {tab==="inv"&&(<>
          <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>Details</div>
          <div style={{display:"flex",gap:5,marginBottom:8}}>
            <Fld label="Inv #" style={{flex:"0 0 64px",marginBottom:0}}><input style={sideInp} type="number" value={inv.inv_num} onChange={e=>upd("inv_num",parseInt(e.target.value)||1)}/></Fld>
            <Fld label="Project Ref" style={{flex:1,marginBottom:0}}><input style={sideInp} placeholder="e.g. GFP Event" value={inv.project_ref} onChange={e=>upd("project_ref",e.target.value)}/></Fld>
          </div>
          <Fld label="Reference"><input style={sideInp} placeholder="e.g. Security Operations & IR" value={inv.reference} onChange={e=>upd("reference",e.target.value)}/></Fld>
          <Fld label="Internal Ref"><input style={sideInp} placeholder="e.g. INV-0279" value={inv.ref_code} onChange={e=>upd("ref_code",e.target.value)}/></Fld>
          <div style={{display:"flex",gap:5,marginBottom:8}}>
            <Fld label="Issue" style={{flex:1,marginBottom:0}}><input style={sideInp} type="date" value={inv.issue_date} onChange={e=>upd("issue_date",e.target.value)}/></Fld>
            <Fld label="Due" style={{flex:1,marginBottom:0}}><input style={sideInp} type="date" value={inv.due_date} onChange={e=>upd("due_date",e.target.value)}/></Fld>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:12}}>
            <Fld label="Currency" style={{flex:1,marginBottom:0}}>
              <select style={sideSel} value={inv.currency} onChange={e=>upd("currency",e.target.value)}>
                {Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}
              </select>
            </Fld>
            {cur.gst&&<Fld label="GST" style={{flex:"0 0 68px",marginBottom:0}}>
              <select style={sideSel} value={inv.gst_rate} onChange={e=>upd("gst_rate",parseFloat(e.target.value))}>
                <option value={0.1}>10%</option><option value={0}>0%</option>
              </select>
            </Fld>}
          </div>

          <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>Line Items</div>
          {inv.items.map((it,idx)=>(
            <div key={it.id} style={{background:T.surface2,borderRadius:8,padding:10,marginBottom:8,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:9.5,color:T.textMuted,letterSpacing:"0.08em"}}>ITEM {idx+1}</span>
                {inv.items.length>1&&<span onClick={()=>rmItem(it.id)} style={{fontSize:11,color:T.textMuted,cursor:"pointer"}}>✕</span>}
              </div>
              <input style={{...sideInp,marginBottom:5}} placeholder="Service description" value={it.description} onChange={e=>updItem(it.id,"description",e.target.value)}/>
              <div style={{display:"flex",gap:4,marginBottom:5}}>
                <div style={{flex:"0 0 50px"}}><label style={sideLbl}>Qty</label><input style={sideInp} type="number" min={0} step={0.5} value={it.qty} onChange={e=>updItem(it.id,"qty",parseFloat(e.target.value)||0)}/></div>
                <div style={{flex:"0 0 60px"}}><label style={sideLbl}>Unit</label>
                  <select style={sideSel} value={it.unit} onChange={e=>updItem(it.id,"unit",e.target.value)}>
                    <option>day</option><option>hour</option><option>item</option><option>fixed</option>
                  </select>
                </div>
                <div style={{flex:1}}><label style={sideLbl}>Rate</label><input style={sideInp} type="number" min={0} value={it.rate} onChange={e=>updItem(it.id,"rate",parseFloat(e.target.value)||0)}/></div>
              </div>
              {cur.gst&&<label style={{display:"flex",alignItems:"center",gap:5,fontSize:11.5,color:T.textSub,cursor:"pointer"}}>
                <input type="checkbox" checked={it.gst} onChange={e=>updItem(it.id,"gst",e.target.checked)}/> Apply GST
              </label>}
              <div style={{textAlign:"right",marginTop:5,fontSize:12,...mono,color:T.textSub}}>{fmt(it.qty*it.rate,inv.currency)}</div>
            </div>
          ))}
          <button onClick={addItem} style={{width:"100%",padding:"7px",borderRadius:7,background:"transparent",border:`1px dashed ${T.border}`,color:T.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>+ Add line item</button>

          <Fld label="Status">
            <select style={sideSel} value={inv.status} onChange={e=>upd("status",e.target.value)}>
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
            </select>
          </Fld>
          <Fld label="Notes"><textarea style={{...sideInp,minHeight:48,resize:"vertical",lineHeight:1.5}} value={inv.notes} onChange={e=>upd("notes",e.target.value)}/></Fld>
        </>)}

        {tab==="client"&&(<>
          <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>Bill To</div>
          {[["Name / Company","name","DVULN Pty Ltd"],["ABN","abn","XX XXX XXX XXX"],["Address","address","Level 1, Suite 1A"],["City","city","Gordon"],["State","state","NSW"],["Postcode","postcode","2072"],["Phone","phone","+61 2 XXXX XXXX"]].map(([label,key,ph])=>(
            <Fld key={key} label={label}><input style={sideInp} placeholder={ph} value={client[key]} onChange={e=>updC(key,e.target.value)}/></Fld>
          ))}
        </>)}

        {/* Totals */}
        <div style={{marginTop:"auto",paddingTop:12}}>
          <div style={{background:T.surface2,borderRadius:8,padding:"12px 14px",marginBottom:10,border:`1px solid ${T.border}`}}>
            {[["Subtotal",subtotal],["GST",gstTotal]].filter((_,i)=>i===0||cur.gst).map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.textSub,marginBottom:3}}>
                <span>{l}</span><span style={mono}>{fmt(v,inv.currency)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:600,color:T.text,marginTop:7,paddingTop:7,borderTop:`1px solid ${T.border}`}}>
              <span>Total</span><span style={mono}>{fmt(total,inv.currency)}</span>
            </div>
          </div>
          <Btn variant="primary" T={T} style={{width:"100%",marginBottom:7,opacity:saving?0.6:1}} onClick={()=>{setSaving(true);setTimeout(()=>{setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000)},800);}}>
            {saved?"✓ Saved!":saving?"Saving...":"Save Invoice"}
          </Btn>
          <Btn T={T} style={{width:"100%"}} onClick={print}>↓ Download PDF</Btn>
        </div>
      </div>

      {/* Preview */}
      <div style={{flex:1,overflowY:"auto",padding:"24px 32px",background:T.bgSub}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:14}}>Live Preview · INV-{pad4(inv.inv_num)}</div>
        <div id="inv-print">
          {/* White invoice paper */}
          <div style={{background:"#fff",color:"#1a1a1a",fontFamily:"'Geist',sans-serif",fontSize:13,lineHeight:1.5,maxWidth:740,borderRadius:10,overflow:"hidden",boxShadow:"0 4px 40px rgba(0,0,0,0.12)"}}>
            <div style={{background:"#0a0a0a",height:6}}/>
            <div style={{padding:"36px 48px 40px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"#0a0a0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{color:"#fff",fontSize:20,fontWeight:700,lineHeight:1}}>AF</div>
                  <div style={{color:"#888",fontSize:6,letterSpacing:"0.15em",marginTop:3,textTransform:"uppercase"}}>ANTHONY FU</div>
                </div>
                <div style={{fontSize:28,fontWeight:700,color:"#0a0a0a"}}>TAX INVOICE</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:28,fontSize:12}}>
                {/* FROM — ZHE (Anthony) FU */}
                <div>
                  <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:"#aaa",marginBottom:5}}>From</div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{BIZ.company}</div>
                  <div style={{color:"#666",lineHeight:1.8}}>
                    <div>{BIZ.addr1}</div>
                    <div>{BIZ.addr2}</div>
                    <div>P: {BIZ.phone}</div>
                    <div><strong>ABN:</strong> {BIZ.abn}</div>
                  </div>
                </div>
                {/* Invoice meta — centre */}
                <div style={{textAlign:"center"}}>
                  {[["Invoice Date",fmtDate(inv.issue_date)],["Invoice Number",`#${pad4(inv.inv_num)}${inv.project_ref?" · "+inv.project_ref:""}`],["Reference",inv.reference]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{marginBottom:5}}><div style={{fontWeight:700}}>{k}</div><div style={{color:"#555"}}>{v}</div></div>
                  ))}
                </div>
                {/* BILL TO — client */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:"#aaa",marginBottom:5}}>Bill To</div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{client.name||"DVULN Pty Ltd"}</div>
                  <div style={{color:"#666",lineHeight:1.8}}>
                    {client.address?<div>{client.address}</div>:<div>Level 1, Suite 1A</div>}
                    {(client.city||client.state)?<div>{[client.city,client.state,client.postcode].filter(Boolean).join(", ")}</div>:<div>802-808 Pacific Hwy, Gordon</div>}
                    {!client.city&&!client.state&&<div>Sydney, NSW, Australia 2072</div>}
                    {client.phone&&<div>P: {client.phone}</div>}
                    {client.abn?<div><strong>ABN:</strong> {client.abn}</div>:<div><strong>ABN:</strong> 75 272 105 492</div>}
                  </div>
                </div>
              </div>
              <hr style={{border:"none",borderTop:"1px solid #e4e4e4",marginBottom:20}}/>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #0a0a0a"}}>
                    {[["Description","left","46%"],["Qty","right","10%"],["Unit price","right","16%"],["GST","right","10%"],["Amount AUD","right","18%"]].map(([h,a,w])=>(
                      <th key={h} style={{textAlign:a,padding:"7px 6px",fontWeight:700,fontSize:12,width:w,paddingLeft:h==="Description"?0:6,paddingRight:h==="Amount AUD"?0:6}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((ln,i)=>(
                    <tr key={ln.id} style={{background:i%2===0?"#f7f7f7":"#fff"}}>
                      <td style={{padding:"11px 6px 11px 0"}}>{ln.description||"—"}{inv.ref_code&&i===0&&<div style={{fontSize:10.5,color:"#aaa",marginTop:2,fontFamily:"monospace"}}>{inv.ref_code}</div>}</td>
                      <td style={{...mono,textAlign:"right",padding:"11px 6px"}}>{ln.qty}</td>
                      <td style={{...mono,textAlign:"right",padding:"11px 6px"}}>{fmt(ln.rate,inv.currency)}</td>
                      <td style={{textAlign:"right",padding:"11px 6px",color:"#666"}}>{cur.gst&&ln.gst?`${(inv.gst_rate*100).toFixed(0)}%`:"—"}</td>
                      <td style={{...mono,textAlign:"right",padding:"11px 0 11px 6px"}}>{fmt(ln.sub,inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
                <div style={{width:220}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12.5,color:"#555"}}><span>Subtotal</span><span style={mono}>{fmt(subtotal,inv.currency)}</span></div>
                  {cur.gst&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12.5,color:"#888"}}><span>TOTAL GST {(inv.gst_rate*100).toFixed(0)}%</span><span style={{...mono,color:"#c00"}}>{fmt(gstTotal,inv.currency)}</span></div>}
                  <div style={{...mono,fontSize:28,fontWeight:700,textAlign:"right",marginTop:6,letterSpacing:"-0.02em"}}>{fmt(total,inv.currency)}</div>
                </div>
              </div>
              <hr style={{border:"none",borderTop:"1px solid #e4e4e4",margin:"24px 0 18px"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,fontSize:12}}>
                <div><div style={{fontWeight:700,marginBottom:5}}>Due Date</div><div style={{color:"#555"}}>{fmtDate(inv.due_date)}</div></div>
                <div><div style={{fontWeight:700,marginBottom:5}}>Bank Details</div>
                  <div style={{color:"#555",lineHeight:1.8}}><div>{BIZ.bank}</div><div>Account Name: {BIZ.acctName}</div><div style={mono}>Account Number: {BIZ.acctNo}</div><div style={mono}>BSB {BIZ.bsb}</div></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:18}}>
                {[["Invoice Sent",inv.status!=="draft","#3b82f6"],["Paid",inv.status==="paid","#22c55e"]].map(([l,a,c])=>(
                  <div key={l} style={{padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:500,background:a?c+"18":"#f4f4f4",color:a?c:"#bbb",border:`1px solid ${a?c+"44":"#e8e8e8"}`}}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RECEIPT SCANNER
══════════════════════════════════════════════════════════ */
function Receipts({T}) {
  const [receipts, setReceipts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const scan = async (file) => {
    setScanning(true);
    const base64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
    const text = await claude([{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:base64}},{type:"text",text:`Extract key financial data from this receipt. Return ONLY valid JSON (no markdown): {"vendor":"string","date":"YYYY-MM-DD","currency":"AUD","amount_inc_gst":0,"gst_amount":0,"gst_claimable":true,"vendor_abn":null,"category":"software|cloud|travel|meals|equipment|other","description":"string","confidence":0.9}`}]}]);
    let ex={};
    try { ex=JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { ex={vendor:file.name,description:"Could not parse",confidence:0}; }
    setReceipts(p=>[{id:uid(),preview:URL.createObjectURL(file),file_name:file.name,...ex,status:"pending"},...p]);
    setScanning(false);
  };

  const confColor = (c,T) => c>0.85?T.green:c>0.6?T.amber:T.red;

  return (
    <div style={{padding:"24px 28px",maxWidth:920,overflowY:"auto"}}>
      <div style={{fontSize:16,fontWeight:600,color:T.text,marginBottom:4}}>Receipts & Expenses</div>
      <div style={{fontSize:13,color:T.textSub,marginBottom:24}}>Upload receipts — Yi Vision extracts vendor, amount and GST automatically.</div>

      <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);[...e.dataTransfer.files].forEach(scan);}}
        style={{border:`2px dashed ${dragOver?T.accent:T.border}`,borderRadius:12,padding:"32px",textAlign:"center",marginBottom:24,cursor:"pointer",background:dragOver?T.accentBg:"transparent",transition:"all 0.15s"}}
        onClick={()=>document.getElementById("rec-inp").click()}>
        <input id="rec-inp" type="file" accept="image/*,.pdf" multiple onChange={e=>[...e.target.files].forEach(scan)} style={{display:"none"}}/>
        {scanning?<div><div style={{fontSize:22,color:T.accent,marginBottom:8}}>✦</div><div style={{fontSize:14,fontWeight:500,color:T.text}}>Scanning with Yi Vision...</div><div style={{fontSize:12,color:T.textSub,marginTop:4}}>Extracting vendor, amount, GST</div></div>
          :<div><div style={{fontSize:28,color:T.textMuted,marginBottom:8}}>↑</div><div style={{fontSize:14,fontWeight:500,color:T.text}}>Drop receipts here or click to upload</div><div style={{fontSize:12.5,color:T.textSub,marginTop:4}}>PNG, JPG, PDF · AI extracted automatically</div></div>}
      </div>

      {receipts.length===0?<div style={{textAlign:"center",padding:"40px",color:T.textMuted,fontSize:13}}>No receipts yet. Upload your first one above.</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
          {receipts.map(r=>(
            <Card key={r.id} T={T} style={{overflow:"hidden",border:`1px solid ${r.status==="confirmed"?T.green+"40":r.gst_claimable===false?T.red+"30":T.cardBorder}`}}>
              {r.preview&&<div style={{height:110,overflow:"hidden",background:T.surface2}}><img src={r.preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.8}}/></div>}
              <div style={{padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{fontSize:13.5,fontWeight:600,color:T.text}}>{r.vendor||r.file_name}</div>
                  {r.confidence&&<div style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:confColor(r.confidence,T)+"18",color:confColor(r.confidence,T)}}>{Math.round(r.confidence*100)}%</div>}
                </div>
                <div style={{fontSize:11.5,color:T.textSub,marginBottom:8}}>{r.date} · {r.category}</div>
                <div style={{fontFamily:"'Geist Mono',monospace",fontSize:15,fontWeight:500,color:T.text,marginBottom:3}}>{r.currency||"AUD"} {(r.amount_inc_gst||0).toFixed(2)}</div>
                <div style={{fontSize:11.5,color:r.gst_claimable===false?T.red:T.green,marginBottom:10}}>
                  {r.gst_claimable===false?"⚠ Not GST claimable":`GST ${(r.gst_amount||0).toFixed(2)} · Claimable`}
                  {!r.vendor_abn&&r.gst_claimable!==false&&(r.amount_inc_gst||0)>82.5&&<span style={{color:T.amber,marginLeft:6}}>· No ABN</span>}
                </div>
                {r.status==="confirmed"?<div style={{fontSize:12,color:T.green}}>✓ Confirmed</div>
                  :<div style={{display:"flex",gap:6}}>
                    <Btn variant="primary" T={T} style={{flex:1,padding:"5px",fontSize:12}} onClick={()=>setReceipts(p=>p.map(x=>x.id===r.id?{...x,status:"confirmed"}:x))}>Confirm</Btn>
                    <Btn variant="danger" T={T} style={{padding:"5px 10px",fontSize:12}} onClick={()=>setReceipts(p=>p.filter(x=>x.id!==r.id))}>✕</Btn>
                  </div>}
              </div>
            </Card>
          ))}
        </div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GST / BAS VIEW
══════════════════════════════════════════════════════════ */
function GstBas({T}) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice]   = useState("");

  const getAdvice = async () => {
    setLoading(true);
    const txt = await claude([{role:"user",content:"I'm a cybersecurity consultant in Sydney (DVULN Pty Ltd, ABN 75 272 105 492). Q3 FY2025 figures: Revenue $84,250, GST collected $8,425, GST credits $1,243, net payable $7,182. Give me 3 specific tax optimisation tips and any missing deductions I should check before submitting BAS. Be concise and practical."}],
      "You are an Australian tax assistant specialising in small business. Use Australian English and ATO compliance. Be practical and direct.");
    setAdvice(txt);
    setLoading(false);
  };

  return (
    <div style={{padding:"24px 28px",maxWidth:860,overflowY:"auto"}}>
      <div style={{fontSize:16,fontWeight:600,color:T.text,marginBottom:4}}>GST / BAS</div>
      <div style={{fontSize:13,color:T.textSub,marginBottom:24}}>Australian tax reporting — Q3 FY2025</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card T={T}>
          <CardHeader T={T} title="BAS Calculation"/>
          {[["G1 — Total Sales","$84,250"],["G3 — GST-free Sales","$0"],["1A — GST on Sales","$8,425"],["1B — GST Credits (ITC)","− $1,243"],["Net GST Payable","$7,182"]].map(([l,v],i)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"11px 20px",borderBottom:`1px solid ${T.border}`,background:i===4?T.surface2:"transparent"}}>
              <span style={{fontSize:13,color:i===4?T.text:T.textSub,fontWeight:i===4?500:400}}>{l}</span>
              <span style={{fontFamily:"'Geist Mono',monospace",fontSize:13,color:i===4?T.text:T.textSub,fontWeight:i===4?600:400}}>{v}</span>
            </div>
          ))}
          <div style={{padding:"12px 20px",display:"flex",gap:8}}>
            <Btn variant="primary" T={T} style={{flex:1,fontSize:12.5}}>Prepare BAS PDF</Btn>
            <Btn T={T} style={{fontSize:12.5}}>Lodge via ATO</Btn>
          </div>
        </Card>

        <Card T={T}>
          <CardHeader T={T} title="ITC Breakdown"/>
          {[["AWS Australia","$13.00","Cloud · Claimable",true],["Canva Pro","$1.82","Software · Claimable",true],["Kali Linux Pro","N/A","Foreign · Not claimable",false],["Grab Singapore","N/A","No ABN · Not claimable",false]].map(([v,g,d,ok])=>(
            <div key={v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:`1px solid ${T.border}`}}>
              <div><div style={{fontSize:13,color:T.text,fontWeight:500}}>{v}</div><div style={{fontSize:11.5,color:T.textSub,marginTop:1}}>{d}</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Geist Mono',monospace",fontSize:13,color:ok?T.green:T.red}}>{g}</div>
              </div>
            </div>
          ))}
          <div style={{padding:"10px 20px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:T.amber}}>⚠ 2 items missing ABN</span>
            <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:"'Geist Mono',monospace"}}>Total ITC: $14.82</span>
          </div>
        </Card>
      </div>

      <Card T={T}>
        <CardHeader T={T} title="✦ AI Tax Optimisation" action={!advice&&!loading?"Get advice →":null}/>
        <div style={{padding:"16px 20px"}}>
          {!advice&&!loading&&(
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:13,color:T.textSub,marginBottom:16}}>Let Yi analyse your Q3 figures and identify tax optimisation opportunities</div>
              <Btn variant="primary" T={T} onClick={getAdvice} style={{padding:"9px 24px"}}>Analyse with Yi</Btn>
            </div>
          )}
          {loading&&<div style={{textAlign:"center",padding:"24px 0",color:T.textSub,fontSize:13}}>Yi is analysing your tax position...</div>}
          {advice&&<div style={{fontSize:13.5,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{advice}</div>}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   YI ASSISTANT (Full chat)
══════════════════════════════════════════════════════════ */
function Assistant({T}) {
  const [msgs, setMsgs]   = useState([{role:"ai",text:"G'day! I'm Yi, your finance assistant for Dvuln. I can help with invoices, GST, BAS, expenses, tax returns, and cash flow. What can I help you with today?"}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const txt = input.trim(); setInput("");
    setMsgs(p=>[...p,{role:"user",text:txt}]);
    setLoading(true);
    const history = msgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
    const reply = await claude([...history,{role:"user",content:txt}],
      "You are Yi, a finance assistant for Dvuln Pty Ltd, a cybersecurity consultancy in Sydney, Australia (ABN 75 272 105 492). Partner: Anthony Wu. Help with invoices, GST, BAS, expenses, tax, ATO compliance. Use Australian English. Be practical, concise, and professional.");
    setMsgs(p=>[...p,{role:"ai",text:reply}]);
    setLoading(false);
  };

  const suggestions = ["What deductions can I claim for cybersecurity tools?","Explain how to calculate my Q3 BAS","Draft a payment reminder for HSBC","What's the ATO deadline for BAS lodgement?","How do I handle foreign currency invoices for GST?"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bg}}>
      <div style={{padding:"16px 28px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:600,color:T.text}}>Yi Assistant</div>
        <div style={{fontSize:12.5,color:T.textSub,marginTop:2}}>AI-powered finance assistant · Dvuln Pty Ltd</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:16,maxWidth:760,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:12,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,background:m.role==="ai"?T.accent:T.surface2,color:m.role==="ai"?"#fff":T.textSub}}>
              {m.role==="ai"?"Yi":"AW"}
            </div>
            <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="ai"?"4px 14px 14px 14px":"14px 4px 14px 14px",background:m.role==="ai"?T.surface2:T.accent,color:m.role==="ai"?T.text:"#fff",fontSize:13.5,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>Yi</div>
          <div style={{padding:"12px 16px",background:T.surface2,borderRadius:"4px 14px 14px 14px",display:"flex",gap:5,alignItems:"center"}}>
            {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.textMuted,animation:`bounce 1.2s ease infinite ${i*0.2}s`}}/>)}
          </div>
        </div>}
        <div ref={endRef}/>
      </div>

      {msgs.length===1&&(
        <div style={{padding:"0 28px 16px",display:"flex",flexWrap:"wrap",gap:8,maxWidth:760,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
          {suggestions.map(s=>(
            <div key={s} onClick={()=>setInput(s)} style={{padding:"7px 12px",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12.5,color:T.textSub,cursor:"pointer",transition:"all 0.12s",background:T.surface}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSub;}}>{s}</div>
          ))}
        </div>
      )}

      <div style={{padding:"16px 28px",borderTop:`1px solid ${T.border}`,flexShrink:0,maxWidth:760,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <textarea style={{flex:1,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:13.5,fontFamily:"inherit",outline:"none",resize:"none",lineHeight:1.5,minHeight:44,maxHeight:120}} placeholder="Ask Yi anything about your finances..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
          <button onClick={send} style={{width:40,height:40,borderRadius:10,background:T.accent,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 12 12"><path d="M1 6h10M6 1l5 5-5 5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div style={{fontSize:11,color:T.textMuted,marginTop:6,textAlign:"center"}}>Yi uses Claude Sonnet · Not financial advice · Consult your accountant for compliance</div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PLACEHOLDER VIEWS
══════════════════════════════════════════════════════════ */
function Placeholder({icon,title,desc,T}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,color:T.textMuted}}>
      <div style={{fontSize:36,opacity:0.3}}>{icon}</div>
      <div style={{fontSize:15,fontWeight:500,color:T.textSub}}>{title}</div>
      <div style={{fontSize:13,color:T.textMuted,textAlign:"center",maxWidth:300}}>{desc}</div>
      <div style={{marginTop:8,padding:"7px 16px",borderRadius:8,background:T.accentBg,color:T.accent,fontSize:12.5,border:`1px solid ${T.accent}30`}}>Coming soon</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser]   = useState(null);
  const [view, setView]   = useState("overview");
  const [dark, setDark]   = useState(false);
  const T = dark ? DARK : LIGHT;

  const views = {
    overview:  <Overview onNav={setView} T={T}/>,
    invoices:  <InvoiceBuilder T={T}/>,
    receipts:  <Receipts T={T}/>,
    gst:       <GstBas T={T}/>,
    assistant: <Assistant T={T}/>,
    bank:      <Placeholder icon="⇄" title="Bank Reconciliation" desc="Auto-match transactions with your invoices and expenses." T={T}/>,
    tax:       <Placeholder icon="◉" title="Tax Returns" desc="Annual tax return assistance and ATO lodgement support." T={T}/>,
    reports:   <Placeholder icon="▤" title="Financial Reports" desc="P&L, Balance Sheet, and Cash Flow statements." T={T}/>,
    audit:     <Placeholder icon="⊛" title="Smart Audit" desc="AI automatically detects accounting errors and discrepancies." T={T}/>,
    forecast:  <Placeholder icon="⟡" title="Cash Flow Forecast" desc="AI predicts your cash flow for the next 3–6 months." T={T}/>,
    clients:   <Placeholder icon="◎" title="Clients & Vendors" desc="Manage your client list, ABNs, payment terms, and vendor details." T={T}/>,
  };

  if (!user) return <Auth onAuth={u=>setUser(u)} T={T}/>;

  return (
    <>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%;width:100%}`}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href={FONT} rel="stylesheet"/>
      <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'Geist',sans-serif",background:T.bg,color:T.text,overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <div style={{width:216,minWidth:216,borderRight:`1px solid ${T.navBorder}`,display:"flex",flexDirection:"column",background:T.navBg,flexShrink:0}}>
          {/* Logo */}
          <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:28,height:28,borderRadius:7,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="13" height="13" viewBox="0 0 14 14"><path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5Z" fill="#fff"/></svg>
              </div>
              <div>
                <div style={{fontSize:12.5,fontWeight:600,color:T.text,letterSpacing:"0.01em"}}>Master Yi</div>
                <div style={{fontSize:10,color:T.textMuted}}>Invoicing</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
            {NAV.map(section=>(
              <div key={section.section} style={{marginBottom:18}}>
                <div style={{fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,padding:"0 8px",marginBottom:4}}>{section.section}</div>
                {section.items.map(item=>(
                  <div key={item.id} onClick={()=>setView(item.id)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:7,cursor:"pointer",marginBottom:1,
                      background:view===item.id?T.accentBg:"transparent",
                      color:view===item.id?T.accent:T.textSub,
                      fontWeight:view===item.id?500:400,fontSize:13,
                      transition:"all 0.12s",
                      borderLeft:view===item.id?`2px solid ${T.accent}`:"2px solid transparent"}}>
                    <span style={{fontSize:13,opacity:view===item.id?1:0.5,width:14,textAlign:"center"}}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom: dark mode + user */}
          <div style={{padding:"12px 8px",borderTop:`1px solid ${T.border}`}}>
            {/* Dark mode toggle */}
            <div onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:7,cursor:"pointer",marginBottom:6,color:T.textSub,fontSize:13,transition:"all 0.12s"}}
              onMouseOver={e=>e.currentTarget.style.background=T.surface2}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:13,opacity:0.5}}>{dark?"☀":"☾"}</span>
              {dark?"Light mode":"Dark mode"}
              <div style={{marginLeft:"auto",width:28,height:16,borderRadius:8,background:dark?T.accent:T.surface3,position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:2,left:dark?12:2,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
              </div>
            </div>
            {/* User */}
            <div onClick={()=>{sb.signOut();setUser(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:7,cursor:"pointer",transition:"all 0.12s"}}
              onMouseOver={e=>e.currentTarget.style.background=T.surface2}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:28,height:28,borderRadius:"50%",background:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:700,color:T.accent,flexShrink:0}}>AW</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Anthony Wu</div>
                <div style={{fontSize:10,color:T.textMuted}}>Sign out</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {views[view] || views.overview}
        </div>
      </div>
    </>
  );
}
