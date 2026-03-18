"use client";
// @ts-nocheck
// MASTRO MISURE — App satellite per sopralluoghi su tablet
// Login PIN → Lista sopralluoghi → Rilievo vano con misure + foto + disegno

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";
const FF="Inter,system-ui,sans-serif", FM="JetBrains Mono,monospace";

const SOPRALLUOGHI_DEMO = [
  { id:"s1", code:"S-0045", cliente:"Francesco", cognome:"Mancuso", indirizzo:"Via Nazionale 44", comune:"Rende", data:new Date().toISOString().split("T")[0], stato:"da_fare", vani:4, note:"Appartamento piano 3, portare metro laser" },
  { id:"s2", code:"S-0046", cliente:"Giovanna",  cognome:"Aiello",   indirizzo:"Corso Italia 12", comune:"Cosenza", data:new Date().toISOString().split("T")[0], stato:"in_corso", vani:6, note:"Casa indipendente, cancello aperto" },
  { id:"s3", code:"S-0043", cliente:"Roberto",   cognome:"Vitale",   indirizzo:"Via Roma 88",     comune:"Montalto", data:new Date(Date.now()-86400000).toISOString().split("T")[0], stato:"completato", vani:3, note:"" },
];

const VANI_TEMPLATE = [
  "Soggiorno","Cucina","Camera principale","Camera 2","Camera 3","Bagno","Bagno 2","Studio","Ingresso","Terrazzo","Cantina","Garage"
];

const PUNTI_MISURA = [
  {k:"lAlto",   l:"Larghezza alto",    icon:"↔", ph:"1200"},
  {k:"lCentro", l:"Larghezza centro",  icon:"↔", ph:"1200"},
  {k:"lBasso",  l:"Larghezza basso",   icon:"↔", ph:"1200"},
  {k:"hSx",     l:"Altezza sinistra",  icon:"↕", ph:"2100"},
  {k:"hDx",     l:"Altezza destra",    icon:"↕", ph:"2100"},
  {k:"d1",      l:"Spalletta SX",      icon:"→", ph:"80"},
  {k:"d2",      l:"Spalletta DX",      icon:"←", ph:"80"},
  {k:"arch",    l:"Arco/Soglia",       icon:"⌒", ph:"0"},
  {k:"davInt",  l:"Davanzale interno", icon:"⊤", ph:"200"},
  {k:"davEst",  l:"Davanzale esterno", icon:"⊥", ph:"200"},
];

function LoginPIN({ onLogin }:{ onLogin:(n:string)=>void }) {
  const [pin,setPin]=useState(""); const [err,setErr]=useState(false);
  const PIN_MAP:Record<string,string>={"1111":"Marco Tecnico","2222":"Paolo Geometra","3333":"Anna Rilievi"};
  const press=(n:string)=>{
    if(pin.length>=4)return;
    const p=pin+n; setPin(p); setErr(false);
    if(p.length===4){setTimeout(()=>{if(PIN_MAP[p])onLogin(PIN_MAP[p]);else{setErr(true);setPin("");}},300);}
  };
  return (
    <div style={{minHeight:"100vh",background:DARK,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",padding:20,fontFamily:FF}}>
      <div style={{marginBottom:32,textAlign:"center" as any}}>
        <div style={{width:56,height:56,borderRadius:14,background:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 16px"}}>📐</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff"}}>MASTRO MISURE</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4}}>Inserisci il tuo PIN</div>
      </div>
      <div style={{display:"flex",gap:14,marginBottom:32}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<pin.length?BLUE:"rgba(255,255,255,0.15)",transition:"background .15s"}}/>)}
      </div>
      {err&&<div style={{color:RED,fontSize:13,marginBottom:16,fontWeight:500}}>PIN non riconosciuto</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:260}}>
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((n,i)=>(
          <div key={i} onClick={()=>{if(n==="⌫"){setPin(p=>p.slice(0,-1));setErr(false);}else if(n)press(n);}}
            style={{height:70,borderRadius:14,background:n?"rgba(255,255,255,0.1)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:n==="⌫"?20:24,fontWeight:500,color:"#fff",cursor:n?"pointer":"default",userSelect:"none" as any}}>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RilievoVano({ sopralluogo, vanoIdx, vani, onSave, onBack }:any) {
  const vano = vani[vanoIdx];
  const [misure, setMisure] = useState<Record<string,string>>(vano.misure||{});
  const [note, setNote] = useState(vano.note||"");
  const [foto, setFoto] = useState<string[]>(vano.foto||[]);
  const [tab, setTab] = useState<"misure"|"foto"|"note">("misure");
  const inputRef = useRef<HTMLInputElement>(null);

  const setM=(k:string,v:string)=>setMisure(m=>({...m,[k]:v}));
  const completati=PUNTI_MISURA.filter(p=>misure[p.k]&&misure[p.k]!=="").length;
  const obbligatori=["lCentro","hSx"].every(k=>misure[k]&&misure[k]!=="");

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:FF}}>
      {/* HEADER */}
      <div style={{background:DARK,padding:"14px 16px 0",position:"sticky" as any,top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={onBack} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>‹</button>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{vano.nome}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{sopralluogo.code} · Vano {vanoIdx+1}/{vani.length}</div>
          </div>
          <div style={{textAlign:"center" as any,padding:"4px 10px",borderRadius:7,background:"rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:16,fontWeight:700,color:completati>=8?TEAL:AMBER,fontFamily:FM}}>{completati}/10</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>misure</div>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {[["misure","📐 Misure"],["foto","📷 Foto"],["note","📝 Note"]].map(([id,l])=>(
            <div key={id} onClick={()=>setTab(id as any)} style={{flex:1,padding:"9px",textAlign:"center" as any,fontSize:12,fontWeight:tab===id?600:400,color:tab===id?"#fff":"rgba(255,255,255,0.4)",borderBottom:`2px solid ${tab===id?TEAL:"transparent"}`,cursor:"pointer"}}>{l}</div>
          ))}
        </div>
      </div>

      <div style={{padding:16}}>
        {tab==="misure"&&<>
          <div style={{background:BLUE+"10",borderRadius:10,padding:"10px 14px",marginBottom:14,border:`1px solid ${BLUE}30`,fontSize:12,color:BLUE}}>
            💡 Inserisci tutte le misure in mm. L/H obbligatori per procedere.
          </div>
          {PUNTI_MISURA.map(p=>{
            const val=misure[p.k]||"";
            const isObblig=["lCentro","hSx"].includes(p.k);
            return (
              <div key={p.k} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:6,background:"#fff",border:`1px solid ${val?"#E5E3DC":isObblig?RED+"30":"#E5E3DC"}`}}>
                <span style={{fontSize:18,width:24,textAlign:"center" as any,flexShrink:0}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#6B7280"}}>{p.l}{isObblig&&<span style={{color:RED,marginLeft:2}}>*</span>}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input type="number" value={val} onChange={e=>setM(p.k,e.target.value)} placeholder={p.ph}
                    style={{width:80,padding:"8px 10px",border:`1px solid ${val?TEAL+"40":"#E5E3DC"}`,borderRadius:8,fontSize:15,fontFamily:FM,textAlign:"right" as any,outline:"none",color:DARK,background:"#F8FAFC"}}/>
                  <span style={{fontSize:11,color:"#6B7280",width:20,flexShrink:0}}>mm</span>
                </div>
              </div>
            );
          })}
          {/* Tipo vano */}
          <div style={{marginTop:12,marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Tipo apertura</div>
            <div style={{display:"flex",flexWrap:"wrap" as any,gap:6}}>
              {["Finestra 2 ante","Finestra 1 anta","Porta finestra","Scorrevole","Vasistas","Fisso","Porta blindata"].map(t=>(
                <div key={t} onClick={()=>setMisure(m=>({...m,tipo:t}))} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${misure.tipo===t?TEAL:"#E5E3DC"}`,background:misure.tipo===t?TEAL+"10":"transparent",fontSize:12,cursor:"pointer",color:misure.tipo===t?TEAL:DARK,fontWeight:misure.tipo===t?500:400}}>{t}</div>
              ))}
            </div>
          </div>
        </>}

        {tab==="foto"&&<>
          <label style={{display:"block",padding:"20px",borderRadius:12,border:"2px dashed #E5E3DC",textAlign:"center" as any,marginBottom:14,cursor:"pointer",background:"#fff"}}>
            <div style={{fontSize:32,marginBottom:6}}>📷</div>
            <div style={{fontSize:14,fontWeight:500,color:DARK}}>Scatta foto vano</div>
            <div style={{fontSize:12,color:"#9CA3AF",marginTop:4}}>Interno + Esterno + Dettagli</div>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
              const file=e.target.files?.[0];
              if(!file)return;
              const r=new FileReader();
              r.onload=()=>setFoto(f=>[...f,r.result as string]);
              r.readAsDataURL(file);
            }}/>
          </label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {foto.map((f,i)=>(
              <div key={i} style={{aspectRatio:"1",borderRadius:10,overflow:"hidden",position:"relative" as any}}>
                <img src={f} style={{width:"100%",height:"100%",objectFit:"cover" as any}} alt=""/>
                <div onClick={()=>setFoto(fs=>fs.filter((_,j)=>j!==i))} style={{position:"absolute" as any,top:4,right:4,width:20,height:20,borderRadius:"50%",background:"rgba(220,68,68,0.9)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer"}}>×</div>
              </div>
            ))}
          </div>
        </>}

        {tab==="note"&&(
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Note specifiche del vano: presenza arco, spallette irregolari, problemi muratura, tapparella esistente, colore richiesto..." rows={8}
            style={{width:"100%",padding:"12px",border:"1px solid #E5E3DC",borderRadius:12,fontSize:14,fontFamily:FF,outline:"none",color:DARK,resize:"none" as any,background:"#fff"}}/>
        )}

        {/* SALVA */}
        <button onClick={()=>onSave({...vano,misure,note,foto,completato:obbligatori})}
          disabled={!obbligatori}
          style={{width:"100%",marginTop:20,padding:"14px",borderRadius:12,background:obbligatori?TEAL:"#E5E3DC",color:obbligatori?"#fff":"#9CA3AF",border:"none",fontSize:15,fontWeight:600,cursor:obbligatori?"pointer":"not-allowed",fontFamily:FF}}>
          {obbligatori?"✓ Salva vano":"Inserisci almeno L e H per salvare"}
        </button>
      </div>
    </div>
  );
}

function DettaglioSopralluogo({ s, onBack }:any) {
  const [vani, setVani] = useState(
    Array.from({length:s.vani},(_,i)=>({id:`v${i+1}`,nome:VANI_TEMPLATE[i]||`Vano ${i+1}`,misure:{},note:"",foto:[],completato:false}))
  );
  const [selVano, setSelVano] = useState<number|null>(null);
  const completati=vani.filter(v=>v.completato).length;

  if(selVano!==null) return <RilievoVano sopralluogo={s} vanoIdx={selVano} vani={vani} onBack={()=>setSelVano(null)} onSave={(v:any)=>{setVani(vs=>vs.map((x,i)=>i===selVano?v:x));setSelVano(null);}}/>;

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:FF}}>
      <div style={{background:DARK,padding:"14px 16px 12px",position:"sticky" as any,top:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <button onClick={onBack} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>‹</button>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{s.cliente} {s.cognome}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{s.code} · {s.indirizzo}, {s.comune}</div>
          </div>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.round(completati/vani.length*100)}%`,background:TEAL,borderRadius:2,transition:"width .3s"}}/>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4}}>{completati}/{vani.length} vani completati</div>
      </div>
      <div style={{padding:16}}>
        {s.note&&<div style={{background:"#FFF8E7",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#92400E"}}>📌 {s.note}</div>}
        {vani.map((v,i)=>(
          <div key={v.id} onClick={()=>setSelVano(i)}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px",borderRadius:12,marginBottom:8,background:"#fff",border:`1px solid ${v.completato?TEAL+"30":"#E5E3DC"}`,cursor:"pointer"}}>
            <div style={{width:40,height:40,borderRadius:10,background:v.completato?TEAL+"12":"#F4F6F8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
              {v.completato?"✅":"📐"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500,color:DARK}}>{v.nome}</div>
              {v.completato&&v.misure.lCentro&&<div style={{fontSize:11,color:TEAL,marginTop:2,fontFamily:FM}}>{v.misure.lCentro}×{v.misure.hSx} mm · {v.misure.tipo||"—"}</div>}
              {!v.completato&&<div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>Tocca per rilevare misure</div>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
        {completati===vani.length&&(
          <button style={{width:"100%",marginTop:8,padding:"14px",borderRadius:12,background:TEAL,color:"#fff",border:"none",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FF}}>
            ✓ Invia misure all'ufficio
          </button>
        )}
      </div>
    </div>
  );
}

function Home({ sopralluoghi, operatore, onSelect, onLogout }:any) {
  const TODAY=new Date().toISOString().split("T")[0];
  const oggi=sopralluoghi.filter((s:any)=>s.data===TODAY);
  const altri=sopralluoghi.filter((s:any)=>s.data!==TODAY&&s.data>=TODAY);
  const statoC:Record<string,string>={da_fare:BLUE,in_corso:AMBER,completato:TEAL};

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:FF}}>
      <div style={{background:DARK,padding:"16px",position:"sticky" as any,top:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff"}}>📐</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{operatore.split(" ")[0]}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>MASTRO MISURE</div>
            </div>
          </div>
          <button onClick={onLogout} style={{width:30,height:30,borderRadius:7,background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:14}}>⏻</button>
        </div>
      </div>
      <div style={{padding:16}}>
        {oggi.length>0&&<><div style={{fontSize:11,fontWeight:700,color:BLUE,textTransform:"uppercase" as any,letterSpacing:1,marginBottom:10}}>Oggi</div>
          {oggi.map((s:any)=>(
            <div key={s.id} onClick={()=>onSelect(s)} style={{background:"#fff",borderRadius:14,padding:"14px",marginBottom:10,border:"1px solid #E5E3DC",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div><div style={{fontSize:15,fontWeight:600,color:DARK}}>{s.cliente} {s.cognome}</div><div style={{fontSize:12,color:"#6B7280"}}>{s.indirizzo}, {s.comune}</div></div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:statoC[s.stato]+"12",color:statoC[s.stato],fontWeight:500,height:"fit-content"}}>{s.stato.replace("_"," ")}</span>
              </div>
              <div style={{fontSize:12,color:"#6B7280"}}>🪟 {s.vani} vani da rilevare · {s.code}</div>
            </div>
          ))}
        </>}
        {altri.length>0&&<><div style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:1,marginBottom:10,marginTop:8}}>Prossimi</div>
          {altri.map((s:any)=>(
            <div key={s.id} onClick={()=>onSelect(s)} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1px solid #E5E3DC",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:500,color:DARK}}>{s.cliente} {s.cognome}</div><div style={{fontSize:11,color:"#6B7280"}}>{s.data} · {s.vani} vani</div></div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

export default function MastroMisure() {
  const [op, setOp] = useState<string|null>(null);
  const [sel, setSel] = useState<any>(null);
  const [sopr] = useState(SOPRALLUOGHI_DEMO);
  if(!op) return <LoginPIN onLogin={setOp}/>;
  if(sel) return <DettaglioSopralluogo s={sel} onBack={()=>setSel(null)}/>;
  return <Home sopralluoghi={sopr} operatore={op} onSelect={setSel} onLogout={()=>setOp(null)}/>;
}
