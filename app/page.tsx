// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element, @typescript-eslint/no-unused-vars */
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Responsive container width
const CONT_STYLE: React.CSSProperties = { padding: 12, maxWidth: 540, margin: '0 auto', width: '100%', boxSizing: 'border-box' }
type Azienda = { id: string; nome: string; logo_url: string }
type Utente = { id: string; nome: string; cognome: string; ruolo: string; azienda_id: string }
type Cantiere = { id: string; azienda_id: string; cliente_nome: string; cliente_telefono: string; cliente_email: string; indirizzo: string; citta: string; cap: string; piano: string; note_accesso: string; fase: string; stato: string; priorita: string; data_sopralluogo: string; data_consegna_prevista: string; note: string; created_at: string; updated_at: string }
type Vano = { id: string; cantiere_id: string; numero: number; nome: string; piano: string; locale: string; tipo: string; materiale_esistente: string; stato_esistente: string; ha_cassonetto: boolean; ha_tapparella: boolean; ha_persiana: boolean; ha_zanzariera: boolean; note: string }
type Misura = { id: string; vano_id: string; tipo_rilevazione: string; larghezza_alto: number|null; larghezza_centro: number|null; larghezza_basso: number|null; altezza_sx: number|null; altezza_centro: number|null; altezza_dx: number|null; diagonale_1: number|null; diagonale_2: number|null; fuori_squadra_mm: number|null; spalletta_sx: number|null; spalletta_dx: number|null; spalletta_sopra: number|null; davanzale_profondita: number|null; davanzale_sporgenza: number|null; cassonetto_larghezza: number|null; cassonetto_altezza: number|null; cassonetto_profondita: number|null; soglia_altezza: number|null; imbotte_profondita: number|null; controtelaio_presente: boolean; note: string }
type Foto = { id: string; vano_id: string; tipo: string; url: string; descrizione: string; created_at: string }
type Contatto = { id: string; cantiere_id: string; nome: string; ruolo: string; telefono: string; email: string }
type TaskC = { id: string; cantiere_id: string; titolo: string; descrizione: string; assegnato_a: string | null; stato: string; priorita: string; data_scadenza: string | null; completato_da: string | null; completato_il: string | null; created_at: string }
type LogEntry = { id: string; cantiere_id: string; utente_nome: string; tipo: string; testo: string; created_at: string }

const FASI = [
  { key: 'sopralluogo', label: 'Sopralluogo', icon: '🔍', color: '#3b82f6' },
  { key: 'preventivo', label: 'Preventivo', icon: '💰', color: '#f59e0b' },
  { key: 'misure_esecutive', label: 'Misure', icon: '📐', color: '#8b5cf6' },
  { key: 'ordine', label: 'Ordine', icon: '📦', color: '#06b6d4' },
  { key: 'produzione', label: 'Produzione', icon: '🏭', color: '#f97316' },
  { key: 'posa', label: 'Posa', icon: '🔧', color: '#10b981' },
  { key: 'chiusura', label: 'Chiusura', icon: '✅', color: '#22c55e' },
]
const TIPI_VANO = [
  { key: 'finestra', label: 'Finestra', icon: '🪟' },
  { key: 'portafinestra', label: 'Portafinestra', icon: '🚪' },
  { key: 'porta_ingresso', label: 'Porta ingresso', icon: '🚪' },
  { key: 'porta_interna', label: 'Porta interna', icon: '🚪' },
  { key: 'scorrevole', label: 'Scorrevole', icon: '↔️' },
  { key: 'vasistas', label: 'Vasistas', icon: '⬆️' },
  { key: 'fisso', label: 'Fisso', icon: '⬜' },
  { key: 'monoblocco', label: 'Monoblocco', icon: '📦' },
  { key: 'ristrutturazione', label: 'Ristrutturaz.', icon: '🔄' },
]
const PRIORITA = [
  { key: 'bassa', label: 'Bassa', color: '#6b7280' },
  { key: 'normale', label: 'Normale', color: '#3b82f6' },
  { key: 'alta', label: 'Alta', color: '#f59e0b' },
  { key: 'urgente', label: 'Urgente', color: '#ef4444' },
]
const NOMI_PRESET: Record<string, string[]> = {
  finestra: ['Finestra cucina','Finestra bagno','Finestra camera','Finestra cameretta','Finestra soggiorno','Finestra corridoio','Finestra studio','Finestra lavanderia'],
  portafinestra: ['PF balcone','PF terrazzo','PF giardino','PF soggiorno','PF camera'],
  porta_ingresso: ['Porta ingresso principale','Porta ingresso secondaria','Porta garage','Porta cantina'],
  porta_interna: ['Porta cucina','Porta bagno','Porta camera','Porta cameretta','Porta soggiorno','Porta studio','Porta ripostiglio'],
  scorrevole: ['Scorrevole terrazzo','Scorrevole soggiorno','Scorrevole balcone'],
  vasistas: ['Vasistas bagno','Vasistas cucina','Vasistas sottotetto'],
  fisso: ['Fisso scala','Fisso corridoio','Fisso facciata'],
  monoblocco: ['Monoblocco camera','Monoblocco soggiorno','Monoblocco cucina'],
  ristrutturazione: ['Ristrutturazione finestra','Ristrutturazione portafinestra','Ristrutturazione scorrevole'],
}
const LOCALI = ['Cucina','Soggiorno','Camera','Cameretta','Bagno','Corridoio','Ingresso','Studio','Lavanderia','Cantina','Garage','Balcone','Terrazzo']
const PIANI = ['Seminterrato','Piano terra','1° piano','2° piano','3° piano','Mansarda']

// ═══ TEMPLATE INTELLIGENTI — libreria serramenti ═══
const TEMPLATES: Record<string, { desc: string; tipiche: { larg: number; alt: number }; accessori: string[]; avvisi: string[] }> = {
  finestra: { desc: 'Finestra standard', tipiche: { larg: 1200, alt: 1400 }, accessori: ['ha_tapparella', 'ha_zanzariera'], avvisi: ['Verifica fuori squadra', 'Misura diagonali!', 'Controlla cassonetto se presente'] },
  portafinestra: { desc: 'Portafinestra balcone/terrazzo', tipiche: { larg: 900, alt: 2200 }, accessori: ['ha_tapparella', 'ha_persiana'], avvisi: ['Misura soglia attentamente', 'Verifica battuta a terra', 'Controlla senso apertura'] },
  scorrevole: { desc: 'Scorrevole (alzante/traslante)', tipiche: { larg: 2000, alt: 2200 }, accessori: ['ha_zanzariera'], avvisi: ['Binario inferiore: serve spazio incasso', 'Verifica portata parete', 'Tolleranze strette: misura con precisione!'] },
  porta_ingresso: { desc: 'Porta ingresso', tipiche: { larg: 900, alt: 2100 }, accessori: [], avvisi: ['Verifica luce muro', 'Controlla tipo muro (portante?)', 'Misura imbotte profondità'] },
  porta_interna: { desc: 'Porta interna a battente', tipiche: { larg: 800, alt: 2100 }, accessori: [], avvisi: ['Verifica spessore muro per stipiti', 'Controlla verso apertura'] },
  vasistas: { desc: 'Vasistas / apertura a ribalta', tipiche: { larg: 600, alt: 600 }, accessori: ['ha_zanzariera'], avvisi: ['Posizione in alto: verifica accessibilità'] },
  fisso: { desc: 'Vetrata fissa', tipiche: { larg: 1000, alt: 1500 }, accessori: [], avvisi: ['Solo vetro: verifica spessore', 'Controlla classe energetica'] },
  monoblocco: { desc: 'Monoblocco con cassonetto integrato', tipiche: { larg: 1200, alt: 1400 }, accessori: ['ha_cassonetto', 'ha_tapparella'], avvisi: ['Cassonetto integrato: misura profondità precisa!', 'Verifica isolamento termico cassonetto'] },
  ristrutturazione: { desc: 'Sostituzione in ristrutturazione', tipiche: { larg: 0, alt: 0 }, accessori: ['ha_cassonetto', 'ha_tapparella'], avvisi: ['Misura vecchio telaio PRIMA di rimuovere', 'Verifica stato muro/imbotte', 'Foto prima della rimozione!', 'Controlla se serve nuovo controtelaio'] },
}

const ACCESSORI_DEFAULT = [
  { key: 'ha_cassonetto', label: 'Cassonetto', icon: '📦' },
  { key: 'ha_tapparella', label: 'Tapparella', icon: '🔲' },
  { key: 'ha_persiana', label: 'Persiana', icon: '🪟' },
  { key: 'ha_zanzariera', label: 'Zanzariera', icon: '🦟' },
]
const TIPI_FOTO = [
  { key: 'Panoramica', icon: '🏠', req: true },
  { key: 'Spalle muro', icon: '🧱', req: true },
  { key: 'Soglia', icon: '⬇️', req: true },
  { key: 'Cassonetto', icon: '📦', req: false },
  { key: 'Dettagli critici', icon: '⚠️', req: true },
  { key: 'Imbotto', icon: '📐', req: false },
  { key: 'Contesto', icon: '🏡', req: false },
  { key: 'Altro', icon: '📷', req: false },
]

const iS: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }
const lS: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }

// ═══ CHIP SELECT ═══
function CS({ opts, val, onChange, color = '#3b82f6' }: { opts: string[]; val: string; onChange: (v: string) => void; color?: string }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>{opts.map(o => <button key={o} onClick={() => onChange(o)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: val === o ? color : '#0f172a', color: val === o ? '#fff' : '#94a3b8', border: `1px solid ${val === o ? color : '#334155'}`, whiteSpace: 'nowrap' }}>{o}</button>)}</div>
}

// ═══ LOGIN ═══
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [nome, setNome] = useState(''); const [cognome, setCognome] = useState(''); const [az, setAz] = useState('')
  const [ld, setLd] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState('')
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')

  const doLogin = async (e: React.FormEvent) => { e.preventDefault(); setLd(true); setErr(''); const { error } = await supabase.auth.signInWithPassword({ email, password: pw }); error ? (setErr('Email o password non corretti'), setLd(false)) : onLogin() }
  const doSignup = async (e: React.FormEvent) => { e.preventDefault(); if (!nome || !cognome || !az) { setErr('Compila tutti'); return }; setLd(true); setErr(''); const { data, error } = await supabase.auth.signUp({ email, password: pw }); if (error) { setErr(error.message); setLd(false); return }; if (data.user) { const { data: a } = await supabase.from('aziende').insert({ nome: az }).select().single(); if (a) await supabase.from('utenti').insert({ id: data.user.id, azienda_id: a.id, nome, cognome, ruolo: 'admin' }); setOk('Account creato!'); setMode('login') }; setLd(false) }
  const doReset = async (e: React.FormEvent) => { e.preventDefault(); if (!email) { setErr('Inserisci email'); return }; setLd(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); error ? setErr(error.message) : setOk('Email inviata!'); setLd(false) }
  const sw = (m: 'login' | 'signup' | 'reset') => { setMode(m); setErr(''); setOk('') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e293b,#0f172a)', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32, margin: 16, background: '#1e293b', borderRadius: 16, border: '1px solid #334155' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>📐</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: '8px 0 0' }}>MASTRO MISURE</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{mode === 'login' ? 'Accedi' : mode === 'signup' ? 'Crea account' : 'Recupera password'}</p>
        </div>
        {err && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{err}</p>}
        {ok && <p style={{ color: '#34d399', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{ok}</p>}

        {mode === 'login' && <form onSubmit={doLogin}>
          <label style={lS}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={iS} />
          <label style={lS}>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} required style={iS} />
          <div style={{ textAlign: 'right', marginBottom: 12 }}><button type="button" onClick={() => sw('reset')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: 13, cursor: 'pointer' }}>Password dimenticata?</button></div>
          <button type="submit" disabled={ld} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{ld ? '...' : 'Accedi'}</button>
          <div style={{ textAlign: 'center', marginTop: 16 }}><span style={{ color: '#64748b', fontSize: 13 }}>Non hai un account? </span><button type="button" onClick={() => sw('signup')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Iscriviti</button></div>
        </form>}

        {mode === 'signup' && <form onSubmit={doSignup}>
          <div style={{ display: 'flex', gap: 8 }}><div style={{ flex: 1 }}><label style={lS}>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} required style={iS} /></div><div style={{ flex: 1 }}><label style={lS}>Cognome</label><input value={cognome} onChange={e => setCognome(e.target.value)} required style={iS} /></div></div>
          <label style={lS}>Azienda</label><input value={az} onChange={e => setAz(e.target.value)} required style={iS} />
          <label style={lS}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={iS} />
          <label style={lS}>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} required style={iS} />
          <button type="submit" disabled={ld} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{ld ? '...' : 'Crea Account'}</button>
          <div style={{ textAlign: 'center', marginTop: 16 }}><button type="button" onClick={() => sw('login')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Accedi</button></div>
        </form>}

        {mode === 'reset' && <form onSubmit={doReset}>
          <label style={lS}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={iS} />
          <button type="submit" disabled={ld} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{ld ? '...' : 'Invia Recupero'}</button>
          <div style={{ textAlign: 'center', marginTop: 16 }}><button type="button" onClick={() => sw('login')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Login</button></div>
        </form>}
      </div>
    </div>
  )
}

// ═══ CONFIRM DIALOG ═══
function Confirm({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, maxWidth: 350, margin: 16, border: '1px solid #334155' }}>
      <p style={{ color: '#f8fafc', fontSize: 15, marginBottom: 20 }}>{msg}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onNo} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Annulla</button>
        <button onClick={onYes} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Elimina</button>
      </div>
    </div>
  </div>
}

// ═══ FASE SELECTOR — CON GATE WORKFLOW ═══
function FaseSel({ cur, onChange, onClose, nVani, warnings }: { cur: string; onChange: (f: string) => void; onClose: () => void; nVani: number; warnings: string[] }) {
  const ci = FASI.findIndex(f => f.key === cur)
  // Gate rules: what blocks advancement
  const gateFor = (faseKey: string): string | null => {
    const fi = FASI.findIndex(f => f.key === faseKey)
    if (fi <= ci) return null // going back is always ok
    // Can't go past sopralluogo without vani
    if (fi >= 2 && nVani === 0) return 'Aggiungi almeno 1 vano'
    // Can't go to produzione without all warnings resolved
    if (fi >= 4 && warnings.length > 0) return `Risolvi: ${warnings.slice(0, 2).join(', ')}`
    return null
  }
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 540, background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>📋 Cambia Fase</h2><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>
      {warnings.length > 0 && <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>⚠️ ATTENZIONE</div>
        {warnings.map((w, i) => <div key={i} style={{ fontSize: 11, color: '#fbbf24' }}>• {w}</div>)}
      </div>}
      {FASI.map((f, i) => { const a = f.key === cur; const p = i < ci; const gate = gateFor(f.key); const blocked = !!gate && i > ci
        return <button key={f.key} onClick={() => { if (blocked) { alert(`🚫 ${gate}`); return }; onChange(f.key); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: a ? `2px solid ${f.color}` : '1px solid #334155', background: a ? `${f.color}20` : blocked ? '#0f172a' : p ? '#0f172a' : 'transparent', marginBottom: 6, cursor: blocked ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: blocked ? 0.5 : 1 }}>
          <span style={{ fontSize: 22 }}>{p ? '✅' : blocked ? '🔒' : f.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: a ? f.color : p ? '#64748b' : blocked ? '#475569' : '#f8fafc' }}>{f.label}</div>
            {blocked && gate && <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>🚫 {gate}</div>}
          </div>
          {a && <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: f.color, color: '#fff', fontWeight: 700 }}>ATTUALE</span>}
        </button> })}
    </div>
  </div>
}

// ═══ CANTIERE FORM (with client autocomplete) ═══
function CantiereForm({ c, clients, onSave, onClose }: { c?: Cantiere | null; clients: string[]; onSave: (d: Partial<Cantiere>) => void; onClose: () => void }) {
  const [nome, setNome] = useState(c?.cliente_nome || '')
  const [tel, setTel] = useState(c?.cliente_telefono || '')
  const [em, setEm] = useState(c?.cliente_email || '')
  const [ind, setInd] = useState(c?.indirizzo || '')
  const [cit, setCit] = useState(c?.citta || '')
  const [note, setNote] = useState(c?.note || '')
  const [pri, setPri] = useState(c?.priorita || 'normale')
  const [dataSopr, setDataSopr] = useState(c?.data_sopralluogo || '')
  const [dataCons, setDataCons] = useState(c?.data_consegna_prevista || '')
  const [sug, setSug] = useState(false)
  const fil = clients.filter(x => x.toLowerCase().includes(nome.toLowerCase()) && x !== nome).slice(0, 5)

  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 540, background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{c ? '✏️ Modifica' : '🏗️ Nuovo'} Cantiere</h2><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>

      <label style={lS}>Cliente *</label>
      <div style={{ position: 'relative' }}>
        <input value={nome} onChange={e => { setNome(e.target.value); setSug(true) }} onFocus={() => setSug(true)} placeholder="Nome cliente" style={iS} />
        {sug && fil.length > 0 && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, zIndex: 10, marginTop: -8 }}>
          {fil.map(s => <button key={s} onClick={() => { setNome(s); setSug(false) }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid #1e293b', color: '#f8fafc', fontSize: 14, textAlign: 'left', cursor: 'pointer' }}>👤 {s}</button>)}
        </div>}
      </div>

      <label style={lS}>Telefono</label><input value={tel} onChange={e => setTel(e.target.value)} type="tel" placeholder="333 1234567" style={iS} />
      <label style={lS}>Email</label><input value={em} onChange={e => setEm(e.target.value)} type="email" placeholder="email@esempio.com" style={iS} />
      <label style={lS}>Indirizzo *</label><input value={ind} onChange={e => setInd(e.target.value)} placeholder="Via Roma 12" style={iS} />
      <label style={lS}>Città</label><input value={cit} onChange={e => setCit(e.target.value)} placeholder="Cosenza" style={iS} />
      <label style={lS}>Priorità</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{PRIORITA.map(p => <button key={p.key} onClick={() => setPri(p.key)} style={{ flex: 1, padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: pri === p.key ? p.color : '#0f172a', color: pri === p.key ? '#fff' : '#94a3b8', border: `1px solid ${pri === p.key ? p.color : '#334155'}` }}>{p.label}</button>)}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}><label style={lS}>📅 Data Sopralluogo</label><input type="date" value={dataSopr} onChange={e => setDataSopr(e.target.value)} style={iS} /></div>
        <div style={{ flex: 1 }}><label style={lS}>📦 Consegna Prevista</label><input type="date" value={dataCons} onChange={e => setDataCons(e.target.value)} style={iS} /></div>
      </div>
      <label style={lS}>Note</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note..." style={{ ...iS, minHeight: 50, resize: 'vertical' }} />
      <button onClick={() => { if (!nome || !ind) return alert('Compila cliente e indirizzo'); onSave({ cliente_nome: nome, cliente_telefono: tel, cliente_email: em, indirizzo: ind, citta: cit, note, priorita: pri, data_sopralluogo: dataSopr || '', data_consegna_prevista: dataCons || '' } as any) }} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{c ? 'Salva Modifiche' : 'Crea Cantiere'}</button>
    </div>
  </div>
}

// ═══ VANO FORM — EDIT MODE (full form, only for editing) ═══
function VanoEditForm({ v, onSave, onClose }: { v: Vano; onSave: (d: Partial<Vano>) => void; onClose: () => void }) {
  const [tipo, setTipo] = useState(v.tipo)
  const [nome, setNome] = useState(v.nome || '')
  const [locale, setLocale] = useState(v.locale || '')
  const [piano, setPiano] = useState(v.piano || '')
  const presets = NOMI_PRESET[tipo] || []
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 540, background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>✏️ Modifica Vano</h2><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>
      <label style={lS}>Tipo</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {TIPI_VANO.map(t => <button key={t.key} onClick={() => { setTipo(t.key); setNome('') }} style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tipo === t.key ? '#3b82f6' : '#0f172a', color: tipo === t.key ? '#fff' : '#94a3b8', border: `1px solid ${tipo === t.key ? '#3b82f6' : '#334155'}` }}>{t.icon} {t.label}</button>)}
      </div>
      <label style={lS}>Nome</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {presets.map(p => <button key={p} onClick={() => setNome(p)} style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: nome === p ? '#8b5cf6' : '#0f172a', color: nome === p ? '#fff' : '#94a3b8', border: `1px solid ${nome === p ? '#8b5cf6' : '#334155'}` }}>{p}</button>)}
      </div>
      <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome custom..." style={{ ...iS, marginTop: 6 }} />
      <label style={lS}>Locale</label><CS opts={LOCALI} val={locale} onChange={setLocale} color="#06b6d4" />
      <label style={lS}>Piano</label><CS opts={PIANI} val={piano} onChange={setPiano} color="#10b981" />
      <button onClick={() => onSave({ nome: nome || TIPI_VANO.find(t => t.key === tipo)?.label || 'Vano', locale, piano, tipo })} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Salva Modifiche</button>
    </div>
  </div>
}

// ═══ QUICK ADD PANEL — tap type → instant create → go to misure ═══
function QuickAddVano({ onAdd, onClose }: { onAdd: (tipo: string) => void; onClose: () => void }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 540, background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>⚡ Tocca il tipo → vai alle misure</h2><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {TIPI_VANO.map(t => <button key={t.key} onClick={() => onAdd(t.key)} style={{ padding: '20px 16px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: '#0f172a', color: '#f8fafc', border: '2px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 32 }}>{t.icon}</span>
          {t.label}
        </button>)}
      </div>
    </div>
  </div>
}

// ═══ FOTO GALLERY — STRUTTURATE ═══
function FotoGal({ vanoId, userId }: { vanoId: string; userId: string }) {
  const [foto, setFoto] = useState<Foto[]>([]); const [upl, setUpl] = useState(false); const [tipoF, setTipoF] = useState('Panoramica'); const [pick, setPick] = useState(false); const [prev, setPrev] = useState<string | null>(null); const fR = useRef<HTMLInputElement>(null)
  const load = useCallback(async () => { const { data } = await supabase.from('foto').select('*').eq('vano_id', vanoId).order('created_at', { ascending: false }); if (data) setFoto(data) }, [vanoId])
  useEffect(() => { load() }, [load])
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setUpl(true); const p = `${vanoId}/${Date.now()}.${f.name.split('.').pop()}`; const { error } = await supabase.storage.from('foto-vani').upload(p, f); if (error) { alert('Errore: ' + error.message); setUpl(false); return }; const { data: u } = supabase.storage.from('foto-vani').getPublicUrl(p); await supabase.from('foto').insert({ vano_id: vanoId, tipo: tipoF, url: u.publicUrl, scattata_da: userId }); setPick(false); load(); setUpl(false); if (fR.current) fR.current.value = '' }
  const del = async (f: Foto) => { if (!confirm('Eliminare?')) return; const p = f.url.split('/foto-vani/')[1]; if (p) await supabase.storage.from('foto-vani').remove([p]); await supabase.from('foto').delete().eq('id', f.id); load() }

  // Completamento categorie
  const reqCats = TIPI_FOTO.filter(t => t.req)
  const doneCats = reqCats.filter(t => foto.some(f => f.tipo === t.key))
  const pct = reqCats.length > 0 ? Math.round((doneCats.length / reqCats.length) * 100) : 100

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>📷 FOTO ({foto.length})</span>
      <button onClick={() => setPick(true)} style={{ background: '#06b6d4', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Foto</button>
    </div>

    {/* Checklist categorie obbligatorie */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : pct > 50 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
      {TIPI_FOTO.map(t => { const has = foto.some(f => f.tipo === t.key); const n = foto.filter(f => f.tipo === t.key).length
        return <button key={t.key} onClick={() => { setTipoF(t.key); setPick(true) }} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: has ? '#22c55e20' : t.req ? '#ef444420' : '#0f172a', color: has ? '#22c55e' : t.req ? '#ef4444' : '#475569', border: `1px solid ${has ? '#22c55e40' : t.req ? '#ef444440' : '#334155'}` }}>
          {has ? '✅' : t.req ? '❌' : '○'} {t.icon} {t.key} {n > 0 ? `(${n})` : ''}
        </button>
      })}
    </div>

    {foto.length === 0 && <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 8 }}>Nessuna foto — tocca una categoria per iniziare</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>{foto.map(f => <div key={f.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}><img src={f.url} alt="" onClick={() => setPrev(f.url)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} /><div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '3px 6px', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#fff', fontSize: 9 }}>{f.tipo}</span><button onClick={() => del(f)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer', padding: 0 }}>🗑</button></div></div>)}</div>
    {pick && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}><div style={{ width: '100%', maxWidth: 540, background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>📷 Tipo Foto</h3><button onClick={() => setPick(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{TIPI_FOTO.map(t => { const has = foto.some(f => f.tipo === t.key); return <button key={t.key} onClick={() => setTipoF(t.key)} style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tipoF === t.key ? '#06b6d4' : '#0f172a', color: tipoF === t.key ? '#fff' : '#94a3b8', border: `1px solid ${tipoF === t.key ? '#06b6d4' : '#334155'}` }}>{t.icon} {t.key} {t.req && !has ? '⚠️' : has ? '✓' : ''}</button> })}</div>
      <input ref={fR} type="file" accept="image/*" capture="environment" onChange={upload} style={{ display: 'none' }} />
      <button onClick={() => fR.current?.click()} disabled={upl} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{upl ? 'Caricamento...' : `📷 Scatta ${tipoF}`}</button>
    </div></div>}
    {prev && <div onClick={() => setPrev(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><img src={prev} alt="" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: 8 }} /></div>}
  </div>
}

// ═══ FLAT ROW — one tap, type number, done ═══
// ═══ MEASURE CHIP — tap to edit inline (restored) ═══
function MC({ value, color, label, onSave }: { value: number | null | undefined; color: string; label: string; onSave: (v: number | null) => void }) {
  const [ed, setEd] = useState(false)
  const [t, setT] = useState('')
  const r = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ed) { setT(value?.toString() || ''); setTimeout(() => r.current?.focus(), 50) } }, [ed, value])
  const sv = () => { setEd(false); onSave(t ? parseInt(t) : null) }
  if (ed) return <input ref={r} type="number" inputMode="numeric" value={t} onChange={e => setT(e.target.value)} onBlur={sv} onKeyDown={e => e.key === 'Enter' && sv()} style={{ width: 70, padding: '5px 4px', borderRadius: 8, border: `2px solid ${color}`, background: '#000', color, fontSize: 18, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
  return <button onClick={() => setEd(true)} style={{ padding: '4px 6px', borderRadius: 8, border: `2px solid ${value ? color : '#334155'}`, background: value ? `${color}15` : '#1e293b', color: value ? color : '#475569', fontSize: value ? 15 : 10, fontWeight: 700, cursor: 'pointer', minWidth: 58, textAlign: 'center', lineHeight: '1.2' }}>{value || label}</button>
}

// ═══ SIMPLE CHIP PICKER for accessories ═══
function Pick({ label, options, value, onChange }: { label: string; options: string[]; value: string | null | undefined; onChange: (v: string) => void }) {
  return <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => <button key={o} onClick={() => onChange(o)} style={{ padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: value === o ? '#3b82f6' : '#0f172a', color: value === o ? '#fff' : '#94a3b8', border: 'none' }}>{o}</button>)}
    </div>
  </div>
}

// ═══ ACCESSORY CARD — collapsed = mini summary, expanded = edit form ═══
function AccCard({ title, icon, color, data, fields, onSave, onRemove }: {
  title: string; icon: string; color: string;
  data: Record<string, string | number | null>;
  fields: { key: string; label: string; type: 'mm' | 'pick' | 'text'; options?: string[] }[];
  onSave: (key: string, val: string | number | null) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false)
  const mmFields = fields.filter(f => f.type === 'mm')
  const hasData = mmFields.some(f => data[f.key])
  // Mini summary line
  const summary = mmFields.map(f => data[f.key] ? `${f.label}: ${data[f.key]}` : '').filter(Boolean).join(' • ')
  const extras = fields.filter(f => f.type !== 'mm' && data[f.key]).map(f => data[f.key]).join(' | ')

  if (!open) return <button onClick={() => setOpen(true)} style={{ width: '100%', background: '#1e293b', borderRadius: 10, padding: '12px 14px', border: hasData ? `2px solid ${color}40` : '1px solid #334155', cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: hasData ? color : '#64748b' }}>{title}</span>
      </div>
      <span style={{ fontSize: 11, color: '#475569' }}>✏️</span>
    </div>
    {hasData && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{summary}</div>}
    {extras && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{extras}</div>}
  </button>

  return <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, border: `2px solid ${color}`, marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{title}</span>
      </div>
      <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▲ Chiudi</button>
    </div>
    {fields.map(f => {
      if (f.type === 'mm') return <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
        <span style={{ fontSize: 14, color: '#e2e8f0' }}>{f.label}</span>
        <MC value={data[f.key] as number | null} color={color} label="mm" onSave={v => onSave(f.key, v)} />
      </div>
      if (f.type === 'pick') return <Pick key={f.key} label={f.label} options={f.options || []} value={data[f.key] as string} onChange={v => onSave(f.key, v)} />
      return <div key={f.key} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</div>
        <input value={(data[f.key] as string) || ''} onChange={e => onSave(f.key, e.target.value)} placeholder={f.label} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    })}
    <button onClick={onRemove} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>🗑 Rimuovi {title.toLowerCase()}</button>
  </div>
}

// ═══ MEASUREMENT PAGE — Drawing + collapsible accessories ═══
function InteractiveMisure({ vano, misura, userId, onSave, onUpdateVano, onBack }: { vano: Vano; misura: Misura | null; userId: string; onSave: (d: Partial<Misura>) => void; onUpdateVano: (d: Partial<Vano>) => void; onBack: () => void }) {
  const [m, setM] = useState<Partial<Misura>>(misura || {})
  const [saving, setSaving] = useState(false)
  const g = (f: string) => (m as Record<string, number | null | undefined>)[f]
  const sv = (f: string, v: number | null) => setM(p => ({ ...p, [f]: v }))

  // Accessory data
  const parseAcc = () => { try { const x = (misura?.note || '').match(/\{AD:(.*?)\}EA/); return x ? JSON.parse(x[1]) : {} } catch { return {} } }
  const [ad, setAd] = useState<Record<string, string | number | null>>(parseAcc())
  const [noteText, setNoteText] = useState(() => (misura?.note || '').replace(/\{AD:.*?\}EA/, '').trim())
  const sAD = (k: string, v: string | number | null) => setAd(p => ({ ...p, [k]: v }))

  // Accessory active states
  const [acc, setAcc] = useState({ cass: vano.ha_cassonetto, tapp: vano.ha_tapparella, pers: vano.ha_persiana, zanz: vano.ha_zanzariera })
  const addAcc = (k: string, f: string) => { setAcc(p => ({ ...p, [k]: true })); onUpdateVano({ [f]: true }) }
  const rmAcc = (k: string, f: string) => { setAcc(p => ({ ...p, [k]: false })); onUpdateVano({ [f]: false }) }

  const save = async () => {
    setSaving(true)
    const j = Object.keys(ad).length > 0 ? `{AD:${JSON.stringify(ad)}}EA` : ''
    await onSave({ ...m, note: [j, noteText].filter(Boolean).join(' ') })
    setSaving(false)
  }

  const tv = TIPI_VANO.find(t => t.key === vano.tipo)
  const tpl = TEMPLATES[vano.tipo]
  const cW = '#3b82f6', cH = '#10b981', cD = '#f59e0b', cSp = '#06b6d4', cDv = '#ec4899', cCs = '#a855f7'

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', overflowX: 'hidden', fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{tv?.icon} {vano.nome}</div>
        </div>
        <button onClick={save} disabled={saving} style={{ background: '#22c55e', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{saving ? '...' : '💾 SALVA'}</button>
      </div>

      <div style={CONT_STYLE}>

        {/* ═══ TEMPLATE TIPS ═══ */}
        {tpl && <div style={{ background: '#8b5cf615', border: '1px solid #8b5cf630', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>🎯 {tpl.desc}</span>
            {tpl.tipiche.larg > 0 && <span style={{ fontSize: 10, color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: 4 }}>Tipiche: {tpl.tipiche.larg}×{tpl.tipiche.alt}</span>}
          </div>
          {tpl.avvisi.map((a, i) => <div key={i} style={{ fontSize: 11, color: '#fbbf24', marginTop: 3 }}>⚠️ {a}</div>)}
        </div>}

        {/* ═══ INTERACTIVE WINDOW DRAWING ═══ */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 12, textAlign: 'center' }}>📐 TOCCA I VALORI PER INSERIRE LE MISURE</div>

          {/* Cassonetto in drawing */}
          {acc.cass && <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8, padding: 8, background: `${cCs}10`, borderRadius: 8, border: `1px dashed ${cCs}40` }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. L</div><MC value={g('cassonetto_larghezza')} color={cCs} label="L" onSave={v => sv('cassonetto_larghezza', v)} /></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. H</div><MC value={g('cassonetto_altezza')} color={cCs} label="H" onSave={v => sv('cassonetto_altezza', v)} /></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. P</div><MC value={g('cassonetto_profondita')} color={cCs} label="P" onSave={v => sv('cassonetto_profondita', v)} /></div>
          </div>}

          {/* Spalletta sopra */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}><div style={{ fontSize: 9, color: cSp, fontWeight: 700 }}>SPALL. SOPRA</div><MC value={g('spalletta_sopra')} color={cSp} label="mm" onSave={v => sv('spalletta_sopra', v)} /></div>

          {/* Larghezza alto */}
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 24, height: 2, background: cW }} /><MC value={g('larghezza_alto')} color={cW} label="L alto" onSave={v => sv('larghezza_alto', v)} /><div style={{ width: 24, height: 2, background: cW }} /></div>
          </div>

          {/* Main frame */}
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}><div style={{ fontSize: 8, color: cSp }}>SP.SX</div><MC value={g('spalletta_sx')} color={cSp} label="mm" onSave={v => sv('spalletta_sx', v)} /></div>
              <MC value={g('altezza_sx')} color={cH} label="H sx" onSave={v => sv('altezza_sx', v)} />
              <div style={{ fontSize: 8, color: cH, marginTop: 2 }}>↕</div>
            </div>
            <div style={{ width: 150, minHeight: 190, border: '3px solid #475569', borderRadius: 4, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 150 190"><line x1="0" y1="0" x2="150" y2="190" stroke="#f59e0b30" strokeWidth="1" strokeDasharray="4" /><line x1="150" y1="0" x2="0" y2="190" stroke="#f59e0b30" strokeWidth="1" strokeDasharray="4" /></svg>
              <MC value={g('altezza_centro')} color={cH} label="H centro" onSave={v => sv('altezza_centro', v)} />
              <div style={{ height: 10 }} />
              <MC value={g('larghezza_centro')} color={cW} label="L centro" onSave={v => sv('larghezza_centro', v)} />
              <div style={{ height: 10 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <MC value={g('diagonale_1')} color={cD} label="D1" onSave={v => sv('diagonale_1', v)} />
                <MC value={g('diagonale_2')} color={cD} label="D2" onSave={v => sv('diagonale_2', v)} />
              </div>
              <div style={{ marginTop: 6 }}><MC value={g('fuori_squadra_mm')} color={cD} label="F.sq" onSave={v => sv('fuori_squadra_mm', v)} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}><div style={{ fontSize: 8, color: cSp }}>SP.DX</div><MC value={g('spalletta_dx')} color={cSp} label="mm" onSave={v => sv('spalletta_dx', v)} /></div>
              <MC value={g('altezza_dx')} color={cH} label="H dx" onSave={v => sv('altezza_dx', v)} />
              <div style={{ fontSize: 8, color: cH, marginTop: 2 }}>↕</div>
            </div>
          </div>

          {/* Larghezza basso */}
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 24, height: 2, background: cW }} /><MC value={g('larghezza_basso')} color={cW} label="L basso" onSave={v => sv('larghezza_basso', v)} /><div style={{ width: 24, height: 2, background: cW }} /></div>
          </div>

          {/* Davanzale + Soglia */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, padding: 8, background: '#0f172a', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cDv, fontWeight: 700 }}>DAV.PROF</div><MC value={g('davanzale_profondita')} color={cDv} label="mm" onSave={v => sv('davanzale_profondita', v)} /></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cDv, fontWeight: 700 }}>DAV.SPORG</div><MC value={g('davanzale_sporgenza')} color={cDv} label="mm" onSave={v => sv('davanzale_sporgenza', v)} /></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>SOGLIA</div><MC value={g('soglia_altezza')} color="#64748b" label="mm" onSave={v => sv('soglia_altezza', v)} /></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>IMBOTTE</div><MC value={g('imbotte_profondita')} color="#64748b" label="mm" onSave={v => sv('imbotte_profondita', v)} /></div>
          </div>
        </div>

        {/* ═══ ACCESSORI — compact cards ═══ */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8, marginTop: 4 }}>ACCESSORI</div>

        {/* Cassonetto toggle */}
        {!acc.cass ? <button onClick={() => addAcc('cass', 'ha_cassonetto')} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px dashed #334155', background: 'transparent', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>+ 📦 Aggiungi Cassonetto</button>
          : <button onClick={() => rmAcc('cass', 'ha_cassonetto')} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${cCs}40`, background: `${cCs}10`, color: cCs, fontSize: 12, cursor: 'pointer', marginBottom: 8, textAlign: 'left', fontWeight: 600 }}>📦 Cassonetto ✓ (misure nel disegno) — tocca per rimuovere</button>}

        {/* Tapparella */}
        {acc.tapp ? <AccCard title="Tapparella" icon="🔲" color="#f97316" data={ad}
          fields={[
            { key: 'tl', label: 'Larghezza', type: 'mm' },
            { key: 'ta', label: 'Altezza', type: 'mm' },
            { key: 'tt', label: 'Materiale', type: 'pick', options: ['PVC','Alluminio','Acciaio','Legno'] },
            { key: 'tm', label: 'Motorizzata', type: 'pick', options: ['Sì','No'] },
            { key: 'tc', label: 'Colore', type: 'text' },
          ]} onSave={sAD} onRemove={() => rmAcc('tapp', 'ha_tapparella')} />
          : <button onClick={() => addAcc('tapp', 'ha_tapparella')} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px dashed #334155', background: 'transparent', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>+ 🔲 Aggiungi Tapparella</button>}

        {/* Persiana */}
        {acc.pers ? <AccCard title="Persiana" icon="🪟" color="#14b8a6" data={ad}
          fields={[
            { key: 'pl', label: 'Larg. anta', type: 'mm' },
            { key: 'pa', label: 'Alt. anta', type: 'mm' },
            { key: 'pn', label: 'N° ante', type: 'pick', options: ['1','2','3','4'] },
            { key: 'pt', label: 'Tipo', type: 'pick', options: ['Battente','Scorrevole','Libro'] },
            { key: 'pc', label: 'Colore', type: 'text' },
          ]} onSave={sAD} onRemove={() => rmAcc('pers', 'ha_persiana')} />
          : <button onClick={() => addAcc('pers', 'ha_persiana')} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px dashed #334155', background: 'transparent', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>+ 🪟 Aggiungi Persiana</button>}

        {/* Zanzariera */}
        {acc.zanz ? <AccCard title="Zanzariera" icon="🦟" color="#8b5cf6" data={ad}
          fields={[
            { key: 'zl', label: 'Larghezza', type: 'mm' },
            { key: 'za', label: 'Altezza', type: 'mm' },
            { key: 'zt', label: 'Tipo', type: 'pick', options: ['Laterale','Verticale','Plissé','Fissa'] },
            { key: 'zg', label: 'Guida', type: 'pick', options: ['Incasso','Sovrapposizione'] },
            { key: 'zc', label: 'Colore', type: 'text' },
          ]} onSave={sAD} onRemove={() => rmAcc('zanz', 'ha_zanzariera')} />
          : <button onClick={() => addAcc('zanz', 'ha_zanzariera')} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px dashed #334155', background: 'transparent', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>+ 🦟 Aggiungi Zanzariera</button>}

        {/* Foto */}
        <div style={{ marginTop: 8 }}><FotoGal vanoId={vano.id} userId={userId} /></div>

        {/* Note */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>📝 NOTE</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Note..." style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#0f172a', color: '#f8fafc', fontSize: 14, minHeight: 50, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* STORICO VERSIONI */}
        {misura?.id && <StoricoVersioni misuraId={misura.id} />}

        {/* SAVE */}
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 18, borderRadius: 12, border: 'none', background: '#22c55e', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}>{saving ? '...' : '💾 SALVA'}</button>
      </div>
    </div>
  )
}

// ═══ STORICO VERSIONI MISURE ═══
function StoricoVersioni({ misuraId }: { misuraId: string }) {
  const [vers, setVers] = useState<{ id: string; dati: any; modificato_da: string; created_at: string }[]>([])
  const [open, setOpen] = useState(false)
  const [selVer, setSelVer] = useState<any | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('misure_versioni').select('*').eq('misura_id', misuraId).order('created_at', { ascending: false }).limit(10)
    if (data) setVers(data)
  }, [misuraId])
  useEffect(() => { load() }, [load])

  if (vers.length === 0) return null

  const fmtVal = (k: string, v: unknown) => {
    if (v === null || v === undefined || v === '') return null
    if (k === 'note' || k === 'id' || k === 'vano_id' || k === 'rilevato_da' || k === 'tipo_rilevazione' || k === 'created_at' || k === 'updated_at') return null
    return `${k.replace(/_/g, ' ')}: ${v}`
  }

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
    <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>📜 Storico modifiche ({vers.length})</span>
      <span style={{ color: '#64748b', fontSize: 12 }}>{open ? '▼' : '▶'}</span>
    </div>
    {open && <div style={{ marginTop: 8 }}>
      {vers.map(v => <div key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{v.modificato_da}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>{new Date(v.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button onClick={() => setSelVer(selVer === v.dati ? null : v.dati)} style={{ background: '#0f172a', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          {selVer === v.dati ? '▼ Chiudi' : '▶ Vedi misure'}
        </button>
        {selVer === v.dati && <div style={{ background: '#0f172a', borderRadius: 6, padding: 8, marginTop: 4 }}>
          {Object.entries(v.dati).map(([k, val]) => fmtVal(k, val)).filter(Boolean).map((line, i) => <div key={i} style={{ fontSize: 11, color: '#94a3b8', padding: '2px 0' }}>{line}</div>)}
        </div>}
      </div>)}
    </div>}
  </div>
}

const RUOLI = [
  { key: 'commerciale', label: 'Commerciale', icon: '💼' },
  { key: 'tecnico', label: 'Tecnico', icon: '📐' },
  { key: 'produzione', label: 'Produzione', icon: '🏭' },
  { key: 'posatore', label: 'Posatore', icon: '🔧' },
  { key: 'admin', label: 'Amministrazione', icon: '📋' },
  { key: 'cliente', label: 'Cliente', icon: '👤' },
]
const STATI_TASK = [
  { key: 'da_fare', label: 'Da fare', color: '#64748b', icon: '⬜' },
  { key: 'in_corso', label: 'In corso', color: '#f59e0b', icon: '🔶' },
  { key: 'completato', label: 'Fatto', color: '#22c55e', icon: '✅' },
]

// ═══ CHECKLIST MONTAGGIO — FLOW POSA STEP-BY-STEP ═══
const STEPS_POSA = [
  { key: 'verifica_materiale', label: 'Verifica materiale consegnato', icon: '📦', cat: 'Preparazione' },
  { key: 'verifica_misure', label: 'Ricontrolla misure in cantiere', icon: '📐', cat: 'Preparazione' },
  { key: 'protezione_ambienti', label: 'Protezione ambienti (teli, cartone)', icon: '🛡️', cat: 'Preparazione' },
  { key: 'rimozione_vecchio', label: 'Rimozione vecchio serramento', icon: '🔧', cat: 'Smontaggio' },
  { key: 'pulizia_vano', label: 'Pulizia e preparazione vano', icon: '🧹', cat: 'Smontaggio' },
  { key: 'verifica_squadra', label: 'Verifica squadra/livello vano', icon: '📏', cat: 'Smontaggio' },
  { key: 'posa_controtelaio', label: 'Posa controtelaio / sottobancale', icon: '🪵', cat: 'Installazione' },
  { key: 'fissaggio_meccanico', label: 'Fissaggio meccanico', icon: '🔩', cat: 'Installazione' },
  { key: 'sigillatura_schiuma', label: 'Sigillatura con schiuma PU', icon: '🧴', cat: 'Installazione' },
  { key: 'posa_serramento', label: 'Posa serramento nel telaio', icon: '🪟', cat: 'Installazione' },
  { key: 'regolazione_anta', label: 'Regolazione ante e chiusure', icon: '⚙️', cat: 'Regolazione' },
  { key: 'tenuta_aria', label: 'Test tenuta aria / acqua', icon: '💨', cat: 'Regolazione' },
  { key: 'sigillatura_esterna', label: 'Sigillatura esterna (silicone)', icon: '🔒', cat: 'Finitura' },
  { key: 'posa_davanzale', label: 'Posa davanzale / soglia', icon: '⬇️', cat: 'Finitura' },
  { key: 'posa_accessori', label: 'Posa accessori (tapparelle, persiane...)', icon: '🔲', cat: 'Finitura' },
  { key: 'pulizia_finale', label: 'Pulizia finale', icon: '✨', cat: 'Chiusura' },
  { key: 'test_funzionamento', label: 'Test funzionamento completo', icon: '✅', cat: 'Chiusura' },
  { key: 'foto_completamento', label: 'Foto completamento lavoro', icon: '📸', cat: 'Chiusura' },
  { key: 'firma_cliente_posa', label: 'Firma accettazione cliente', icon: '✍️', cat: 'Chiusura' },
]

function ChecklistPosa({ cantiereId, userName }: { cantiereId: string; userName: string }) {
  const [checks, setChecks] = useState<Record<string, { done: boolean; by: string; at: string }>>({})
  const [expanded, setExpanded] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('checklist_posa').select('*').eq('cantiere_id', cantiereId)
    if (data) {
      const map: Record<string, { done: boolean; by: string; at: string }> = {}
      data.forEach(d => { map[d.step_key] = { done: d.completato, by: d.completato_da || '', at: d.completato_il || '' } })
      setChecks(map)
    }
  }, [cantiereId])
  useEffect(() => { load() }, [load])

  const toggle = async (key: string) => {
    const cur = checks[key]
    if (cur?.done) {
      await supabase.from('checklist_posa').delete().eq('cantiere_id', cantiereId).eq('step_key', key)
    } else {
      const row = { cantiere_id: cantiereId, step_key: key, completato: true, completato_da: userName, completato_il: new Date().toISOString() }
      const { error } = await supabase.from('checklist_posa').insert(row)
      if (error) await supabase.from('checklist_posa').update({ completato: true, completato_da: userName, completato_il: new Date().toISOString() }).eq('cantiere_id', cantiereId).eq('step_key', key)
    }
    load()
  }

  const done = STEPS_POSA.filter(s => checks[s.key]?.done).length
  const pct = Math.round((done / STEPS_POSA.length) * 100)
  const cats = [...new Set(STEPS_POSA.map(s => s.cat))]

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginTop: 8 }}>
    <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>📋 Flow Montaggio</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#22c55e' : '#f59e0b' }}>{done}/{STEPS_POSA.length}</span>
        <span style={{ color: '#64748b', fontSize: 14 }}>{expanded ? '▼' : '▶'}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : pct > 50 ? '#f59e0b' : '#3b82f6', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#22c55e' : '#94a3b8' }}>{pct}%</span>
    </div>
    {expanded && <div style={{ marginTop: 10 }}>
      {cats.map(cat => <div key={cat} style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 3, textTransform: 'uppercase' }}>{cat}</div>
        {STEPS_POSA.filter(s => s.cat === cat).map(step => {
          const c = checks[step.key]; const isDone = c?.done
          return <button key={step.key} onClick={() => toggle(step.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, border: 'none', background: isDone ? '#22c55e15' : '#0f172a', marginBottom: 2, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 18, width: 24 }}>{isDone ? '✅' : '⬜'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#22c55e' : '#f8fafc', textDecoration: isDone ? 'line-through' : 'none' }}>{step.icon} {step.label}</div>
              {isDone && c && <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{c.by} • {new Date(c.at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
            </div>
          </button>
        })}
      </div>)}
    </div>}
  </div>
}

// ═══ CALENDARIO / AGENDA ═══
function CalendarioView({ cantieri, onOpen }: { cantieri: Cantiere[]; onOpen: (c: Cantiere) => void }) {
  const [expanded, setExpanded] = useState(false)
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
  type Ev = { date: Date; label: string; cantiere: Cantiere; icon: string; color: string }
  const ev: Ev[] = []
  cantieri.forEach(c => {
    if (c.data_sopralluogo) ev.push({ date: new Date(c.data_sopralluogo), label: `Sopralluogo: ${c.cliente_nome}`, cantiere: c, icon: '🔍', color: '#3b82f6' })
    if (c.data_consegna_prevista) ev.push({ date: new Date(c.data_consegna_prevista), label: `Consegna: ${c.cliente_nome}`, cantiere: c, icon: '📦', color: '#8b5cf6' })
  })
  ev.sort((a, b) => a.date.getTime() - b.date.getTime())
  const oggiEv = ev.filter(e => e.date.getTime() === oggi.getTime())
  const prossimi = ev.filter(e => e.date > oggi)
  const scaduti = ev.filter(e => e.date < oggi && e.cantiere.fase !== 'chiusura')
  const fmtD = (d: Date) => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  const daysTo = (d: Date) => { const diff = Math.ceil((d.getTime() - oggi.getTime()) / 86400000); return diff === 0 ? 'Oggi' : diff === 1 ? 'Domani' : `tra ${diff}g` }
  if (ev.length === 0) return null

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10 }}>
    <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>📅 AGENDA ({prossimi.length + oggiEv.length} prossimi)</span>
      <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
    </div>
    <div style={{ marginTop: 8 }}>
      {oggiEv.map((e, i) => <div key={'o' + i} onClick={() => onOpen(e.cantiere)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
        <span style={{ fontSize: 16 }}>{e.icon}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{e.label}</div><div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>⭐ OGGI</div></div>
        <span style={{ color: '#475569' }}>→</span>
      </div>)}
      {prossimi.slice(0, expanded ? 20 : 3).map((e, i) => <div key={'p' + i} onClick={() => onOpen(e.cantiere)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
        <span style={{ fontSize: 16 }}>{e.icon}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{e.label}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{fmtD(e.date)} • <span style={{ color: e.color, fontWeight: 700 }}>{daysTo(e.date)}</span></div></div>
        <span style={{ color: '#475569' }}>→</span>
      </div>)}
    </div>
    {expanded && scaduti.length > 0 && <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⏰ SCADUTI</div>
      {scaduti.map((e, i) => <div key={'s' + i} onClick={() => onOpen(e.cantiere)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer', opacity: 0.7 }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>{e.label}</div><div style={{ fontSize: 10, color: '#64748b' }}>{fmtD(e.date)}</div></div>
      </div>)}
    </div>}
  </div>
}

// ═══ AI SUGGERIMENTI ═══
function AISuggerimenti({ cantiere, vani }: { cantiere: Cantiere; vani: Vano[] }) {
  const tips: { icon: string; text: string; p: 'info' | 'warn' | 'error' }[] = []
  const nv = vani.length
  if (cantiere.fase === 'sopralluogo' && nv === 0) tips.push({ icon: '🪟', text: 'Aggiungi i vani da misurare per procedere', p: 'warn' })
  if (cantiere.fase === 'sopralluogo' && nv > 0) tips.push({ icon: '✅', text: `${nv} vani inseriti — pronto per Preventivo`, p: 'info' })
  if (cantiere.fase === 'preventivo') tips.push({ icon: '💰', text: 'Prepara il preventivo e invialo al cliente', p: 'info' })
  if (cantiere.fase === 'misure') tips.push({ icon: '📐', text: 'Controlla tutte le misure. Verifica fuori squadra!', p: 'warn' })
  if (cantiere.fase === 'ordini' && !cantiere.data_consegna_prevista) tips.push({ icon: '📅', text: 'Imposta la data di consegna prevista!', p: 'error' })
  if (cantiere.fase === 'produzione') tips.push({ icon: '⏳', text: 'In produzione. Prepara la checklist montaggio.', p: 'info' })
  if (cantiere.fase === 'posa') tips.push({ icon: '📋', text: 'Usa la checklist montaggio step by step!', p: 'warn' })
  if (cantiere.fase === 'chiusura') tips.push({ icon: '✍️', text: 'Raccogli firma cliente e genera il PDF Standard Mastro', p: 'info' })
  if (!cantiere.cliente_telefono) tips.push({ icon: '📞', text: 'Manca il telefono del cliente', p: 'error' })
  if (!cantiere.cliente_email) tips.push({ icon: '✉️', text: 'Aggiungi email per invio documenti', p: 'info' })
  vani.forEach(v => { if (v.ha_cassonetto) tips.push({ icon: '📦', text: `${v.nome || 'Vano ' + v.numero}: ha cassonetto — misura profondità!`, p: 'info' }) })
  if (cantiere.data_consegna_prevista) {
    const diff = Math.ceil((new Date(cantiere.data_consegna_prevista).getTime() - Date.now()) / 86400000)
    if (diff < 0 && cantiere.fase !== 'chiusura') tips.push({ icon: '🚨', text: `Consegna scaduta da ${Math.abs(diff)} giorni!`, p: 'error' })
    else if (diff <= 7 && diff >= 0 && cantiere.fase !== 'chiusura') tips.push({ icon: '⏰', text: `Consegna tra ${diff} giorni — affrettati!`, p: 'warn' })
  }
  if (tips.length === 0) return null
  const col = { info: '#3b82f6', warn: '#f59e0b', error: '#ef4444' }
  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 8 }}>🤖 SUGGERIMENTI</div>
    {tips.slice(0, 5).map((t, i) => <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < Math.min(tips.length, 5) - 1 ? '1px solid #0f172a' : 'none' }}>
      <span style={{ fontSize: 14, marginTop: 1 }}>{t.icon}</span>
      <div style={{ fontSize: 12, color: col[t.p], lineHeight: 1.4, flex: 1 }}>{t.text}</div>
    </div>)}
  </div>
}

// ═══ SCADENZE / NOTIFICHE — dashboard ═══
function ScadenzeAlerts({ cantieri, onOpen }: { cantieri: Cantiere[]; onOpen: (c: Cantiere) => void }) {
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
  type Al = { icon: string; text: string; sub: string; color: string; cantiere: Cantiere }
  const als: Al[] = []
  cantieri.forEach(c => {
    if (c.fase === 'chiusura') return
    if (c.data_consegna_prevista) {
      const diff = Math.ceil((new Date(c.data_consegna_prevista).getTime() - oggi.getTime()) / 86400000)
      if (diff < 0) als.push({ icon: '🚨', text: `Consegna SCADUTA: ${c.cliente_nome}`, sub: `Scaduta da ${Math.abs(diff)}g`, color: '#ef4444', cantiere: c })
      else if (diff === 0) als.push({ icon: '⭐', text: `Consegna OGGI: ${c.cliente_nome}`, sub: 'Consegna prevista oggi!', color: '#f59e0b', cantiere: c })
      else if (diff <= 3) als.push({ icon: '⏰', text: `Consegna imminente: ${c.cliente_nome}`, sub: `Tra ${diff}g`, color: '#f59e0b', cantiere: c })
    }
    if (c.data_sopralluogo) {
      const diff = Math.ceil((new Date(c.data_sopralluogo).getTime() - oggi.getTime()) / 86400000)
      if (diff === 0) als.push({ icon: '🔍', text: `Sopralluogo OGGI: ${c.cliente_nome}`, sub: c.indirizzo, color: '#3b82f6', cantiere: c })
      else if (diff === 1) als.push({ icon: '🔍', text: `Sopralluogo DOMANI: ${c.cliente_nome}`, sub: c.indirizzo, color: '#3b82f6', cantiere: c })
    }
    const stale = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000)
    if (stale > 14) als.push({ icon: '💤', text: `Fermo da ${stale}g: ${c.cliente_nome}`, sub: `Fase: ${FASI.find(f => f.key === c.fase)?.label}`, color: '#64748b', cantiere: c })
  })
  if (als.length === 0) return null
  als.sort((a, b) => { const p: Record<string, number> = { '🚨': 0, '⭐': 1, '⏰': 2, '🔍': 3, '💤': 4 }; return (p[a.icon] ?? 5) - (p[b.icon] ?? 5) })
  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>🔔 SCADENZE & NOTIFICHE</div>
    {als.slice(0, 6).map((a, i) => <div key={i} onClick={() => onOpen(a.cantiere)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
      <span style={{ fontSize: 18 }}>{a.icon}</span>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.text}</div><div style={{ fontSize: 10, color: '#64748b' }}>{a.sub}</div></div>
      <span style={{ color: '#475569', fontSize: 14 }}>→</span>
    </div>)}
  </div>
}

// ═══ FIRMA CLIENTE — touch to sign ═══
function FirmaPanel({ cantiereId, userName }: { cantiereId: string; userName: string }) {
  const [firme, setFirme] = useState<{ id: string; tipo: string; nome_firmatario: string; firma_data: string; created_at: string }[]>([])
  const [showSign, setShowSign] = useState(false)
  const [signType, setSignType] = useState<'cliente' | 'tecnico'>('cliente')
  const [signName, setSignName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const load = useCallback(async () => { const { data } = await supabase.from('firme').select('*').eq('cantiere_id', cantiereId).order('created_at'); if (data) setFirme(data) }, [cantiereId])
  useEffect(() => { load() }, [load])

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    drawing.current = true
    const c = canvasRef.current!; const rect = c.getBoundingClientRect()
    const pos = 'touches' in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
    lastPos.current = pos
  }
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = canvasRef.current!; const ctx = c.getContext('2d')!; const rect = c.getBoundingClientRect()
    const pos = 'touches' in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    lastPos.current = pos
  }
  const stopDraw = () => { drawing.current = false }
  const clearCanvas = () => { const c = canvasRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height) }

  const saveFirma = async () => {
    if (!signName.trim()) return alert('Inserisci nome firmatario')
    const c = canvasRef.current!
    const data = c.toDataURL('image/png')
    // Check if canvas is empty
    const ctx = c.getContext('2d')!
    const px = ctx.getImageData(0, 0, c.width, c.height).data
    let empty = true
    for (let i = 3; i < px.length; i += 4) { if (px[i] > 0) { empty = false; break } }
    if (empty) return alert('Firma richiesta')
    await supabase.from('firme').insert({ cantiere_id: cantiereId, tipo: signType, nome_firmatario: signName.trim(), firma_data: data })
    await supabase.from('log_cantiere').insert({ cantiere_id: cantiereId, utente_nome: userName, tipo: 'nota_interna', testo: `Firma ${signType} raccolta: ${signName.trim()}` }).catch(() => {})
    setShowSign(false); setSignName(''); load()
  }

  const delFirma = async (id: string) => { if (!confirm('Eliminare firma?')) return; await supabase.from('firme').delete().eq('id', id); load() }

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginTop: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>✍️ Firme ({firme.length})</span>
      <button onClick={() => setShowSign(true)} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Firma</button>
    </div>

    {firme.map(f => <div key={f.id} style={{ background: '#0f172a', borderRadius: 8, padding: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={f.firma_data} alt="firma" style={{ width: 80, height: 40, objectFit: 'contain', background: '#1e293b', borderRadius: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{f.nome_firmatario}</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>{f.tipo === 'cliente' ? '👤 Cliente' : '📐 Tecnico'} • {new Date(f.created_at).toLocaleDateString('it-IT')}</div>
      </div>
      <button onClick={() => delFirma(f.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
    </div>)}

    {firme.length === 0 && <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 8 }}>Nessuna firma raccolta</div>}

    {showSign && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '95%', maxWidth: 440, background: '#1e293b', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>✍️ Raccogli Firma</h3><button onClick={() => setShowSign(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button></div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button onClick={() => setSignType('cliente')} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: signType === 'cliente' ? '#3b82f6' : '#0f172a', color: signType === 'cliente' ? '#fff' : '#94a3b8', border: 'none' }}>👤 Cliente</button>
          <button onClick={() => setSignType('tecnico')} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: signType === 'tecnico' ? '#3b82f6' : '#0f172a', color: signType === 'tecnico' ? '#fff' : '#94a3b8', border: 'none' }}>📐 Tecnico</button>
        </div>

        <input value={signName} onChange={e => setSignName(e.target.value)} placeholder="Nome e cognome" style={{ ...iS, marginBottom: 10 }} />

        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Firma qui sotto:</div>
        <canvas ref={canvasRef} width={360} height={150}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          style={{ width: '100%', height: 150, background: '#0f172a', borderRadius: 8, border: '2px solid #334155', touchAction: 'none', cursor: 'crosshair', maxWidth: '100%' }} />

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={clearCanvas} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>🗑 Cancella</button>
          <button onClick={saveFirma} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>✅ Salva Firma</button>
        </div>
      </div>
    </div>}
  </div>
}

// ═══ NOTE & LOG COMUNICAZIONI ═══
const LOG_TIPI = [
  { key: 'nota_interna', label: 'Nota interna', icon: '📝', color: '#64748b' },
  { key: 'comunicazione_cliente', label: 'Al cliente', icon: '👤', color: '#3b82f6' },
  { key: 'email_inviata', label: 'Email inviata', icon: '✉️', color: '#8b5cf6' },
]
function NoteLog({ cantiereId, userName }: { cantiereId: string; userName: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [tipo, setTipo] = useState('nota_interna')
  const [testo, setTesto] = useState('')

  const load = useCallback(async () => { const { data } = await supabase.from('log_cantiere').select('*').eq('cantiere_id', cantiereId).order('created_at', { ascending: false }).limit(50); if (data) setLogs(data) }, [cantiereId])
  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!testo.trim()) return
    await supabase.from('log_cantiere').insert({ cantiere_id: cantiereId, utente_nome: userName, tipo, testo: testo.trim() })
    setTesto(''); setShowAdd(false); load()
  }

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'ora'
    if (s < 3600) return `${Math.floor(s / 60)}m fa`
    if (s < 86400) return `${Math.floor(s / 3600)}h fa`
    return `${Math.floor(s / 86400)}g fa`
  }

  return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginTop: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>💬 Note & Log ({logs.length})</span>
      <button onClick={() => setShowAdd(!showAdd)} style={{ background: '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nota</button>
    </div>

    {showAdd && <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {LOG_TIPI.map(t => <button key={t.key} onClick={() => setTipo(t.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: tipo === t.key ? t.color : '#1e293b', color: tipo === t.key ? '#fff' : '#94a3b8', border: 'none', textAlign: 'center' }}>{t.icon} {t.label}</button>)}
      </div>
      <textarea value={testo} onChange={e => setTesto(e.target.value)} placeholder="Scrivi nota..." autoFocus style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#1e293b', color: '#f8fafc', fontSize: 14, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={add} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Salva</button>
        <button onClick={() => setShowAdd(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Annulla</button>
      </div>
    </div>}

    {logs.length === 0 && !showAdd && <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 8 }}>Nessuna nota</div>}
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {logs.map(l => { const lt = LOG_TIPI.find(t => t.key === l.tipo) || { icon: '📋', color: '#64748b', label: l.tipo }
        return <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: lt.color }}>{lt.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{l.utente_nome}</span>
              <span style={{ fontSize: 9, color: '#475569', padding: '1px 6px', borderRadius: 4, background: `${lt.color}15` }}>{lt.label}</span>
            </div>
            <span style={{ fontSize: 10, color: '#475569' }}>{timeAgo(l.created_at)}</span>
          </div>
          <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4, paddingLeft: 24 }}>{l.testo}</div>
        </div>
      })}
    </div>
  </div>
}

// ═══ TEAM & TASK PANEL ═══
function TeamTaskPanel({ cantiereId }: { cantiereId: string }) {
  const [tab, setTab] = useState<'task' | 'team'>('task')
  const [contatti, setContatti] = useState<Contatto[]>([])
  const [tasks, setTasks] = useState<TaskC[]>([])
  const [showAddC, setShowAddC] = useState(false)
  const [showAddT, setShowAddT] = useState(false)
  const [cNome, setCNome] = useState(''); const [cRuolo, setCRuolo] = useState('tecnico')
  const [cTel, setCTel] = useState(''); const [cEmail, setCEmail] = useState('')
  const [tTitolo, setTTitolo] = useState(''); const [tDesc, setTDesc] = useState('')
  const [tAssegnato, setTAssegnato] = useState<string | null>(null); const [tPri, setTPri] = useState('normale')

  const loadC = useCallback(async () => { const { data } = await supabase.from('contatti_cantiere').select('*').eq('cantiere_id', cantiereId).order('created_at'); if (data) setContatti(data) }, [cantiereId])
  const loadT = useCallback(async () => { const { data } = await supabase.from('task_cantiere').select('*').eq('cantiere_id', cantiereId).order('created_at', { ascending: false }); if (data) setTasks(data) }, [cantiereId])
  useEffect(() => { loadC(); loadT() }, [loadC, loadT])

  const addContatto = async () => {
    if (!cNome) return
    await supabase.from('contatti_cantiere').insert({ cantiere_id: cantiereId, nome: cNome, ruolo: cRuolo, telefono: cTel, email: cEmail })
    setCNome(''); setCTel(''); setCEmail(''); setShowAddC(false); loadC()
  }
  const delContatto = async (id: string) => { await supabase.from('contatti_cantiere').delete().eq('id', id); loadC() }

  const addTask = async () => {
    if (!tTitolo) return
    await supabase.from('task_cantiere').insert({ cantiere_id: cantiereId, titolo: tTitolo, descrizione: tDesc, assegnato_a: tAssegnato, priorita: tPri })
    setTTitolo(''); setTDesc(''); setTAssegnato(null); setShowAddT(false); loadT()
  }
  const updTaskStato = async (id: string, stato: string) => {
    const upd: Record<string, string | null> = { stato }
    if (stato === 'completato') { upd.completato_il = new Date().toISOString() }
    await supabase.from('task_cantiere').update(upd).eq('id', id); loadT()
  }
  const delTask = async (id: string) => { await supabase.from('task_cantiere').delete().eq('id', id); loadT() }

  const getContatto = (id: string | null) => contatti.find(c => c.id === id)
  const msgLinks = (c: Contatto) => {
    const links: { label: string; icon: string; color: string; href: string }[] = []
    if (c.telefono) {
      links.push({ label: 'WhatsApp', icon: '💬', color: '#25d366', href: `https://wa.me/${c.telefono.replace(/\D/g, '')}` })
      links.push({ label: 'Chiama', icon: '📞', color: '#22c55e', href: `tel:${c.telefono}` })
      links.push({ label: 'SMS', icon: '💬', color: '#3b82f6', href: `sms:${c.telefono}` })
    }
    if (c.email) links.push({ label: 'Email', icon: '✉️', color: '#8b5cf6', href: `mailto:${c.email}` })
    return links
  }

  const tasksByStato = (s: string) => tasks.filter(t => t.stato === s)

  return <div style={{ marginTop: 8 }}>
    {/* Tabs */}
    <div style={{ display: 'flex', background: '#1e293b', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
      <button onClick={() => setTab('task')} style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: tab === 'task' ? '#334155' : 'transparent', color: tab === 'task' ? '#f8fafc' : '#64748b', border: 'none' }}>✅ Task ({tasks.length})</button>
      <button onClick={() => setTab('team')} style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: tab === 'team' ? '#334155' : 'transparent', color: tab === 'team' ? '#f8fafc' : '#64748b', border: 'none' }}>👥 Team ({contatti.length})</button>
    </div>

    <div style={{ background: '#1e293b', borderRadius: '0 0 10px 10px', padding: 12 }}>

      {/* TASK TAB */}
      {tab === 'task' && <>
        {STATI_TASK.map(s => { const ts = tasksByStato(s.key); if (ts.length === 0 && s.key !== 'da_fare') return null; return <div key={s.key}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 6, marginTop: 8 }}>{s.icon} {s.label} ({ts.length})</div>
          {ts.map(t => { const ass = getContatto(t.assegnato_a); const ruolo = ass ? RUOLI.find(r => r.key === ass.ruolo) : null
            return <div key={t.id} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px', marginBottom: 6, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{t.titolo}</div>
                  {t.descrizione && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.descrizione}</div>}
                  {ass && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{ruolo?.icon} {ass.nome}
                    {ass.telefono && <> — <a href={`https://wa.me/${ass.telefono.replace(/\D/g, '')}`} style={{ color: '#25d366', textDecoration: 'none', fontWeight: 700 }}>💬 WA</a> <a href={`tel:${ass.telefono}`} style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>📞</a></>}
                  </div>}
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {s.key !== 'completato' && <button onClick={() => updTaskStato(t.id, s.key === 'da_fare' ? 'in_corso' : 'completato')} style={{ background: STATI_TASK[STATI_TASK.findIndex(x => x.key === s.key) + 1]?.color || '#22c55e', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{s.key === 'da_fare' ? '▶️' : '✅'}</button>}
                  <button onClick={() => delTask(t.id)} style={{ background: '#334155', border: 'none', borderRadius: 6, padding: '4px 6px', color: '#f87171', fontSize: 10, cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            </div> })}
        </div> })}

        {showAddT ? <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginTop: 8 }}>
          <input value={tTitolo} onChange={e => setTTitolo(e.target.value)} placeholder="Cosa fare..." style={{ ...iS, fontSize: 16 }} autoFocus />
          <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Dettagli (opzionale)" style={iS} />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>ASSEGNA A</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {contatti.map(c => { const r = RUOLI.find(x => x.key === c.ruolo); return <button key={c.id} onClick={() => setTAssegnato(tAssegnato === c.id ? null : c.id)} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tAssegnato === c.id ? '#3b82f6' : '#1e293b', color: tAssegnato === c.id ? '#fff' : '#94a3b8', border: 'none' }}>{r?.icon} {c.nome}</button> })}
            {contatti.length === 0 && <div style={{ color: '#475569', fontSize: 12 }}>Aggiungi persone nel tab Team prima</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addTask} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Aggiungi</button>
            <button onClick={() => setShowAddT(false)} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Annulla</button>
          </div>
        </div> : <button onClick={() => setShowAddT(true)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '2px dashed #334155', background: 'transparent', color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>+ Nuovo Task</button>}
      </>}

      {/* TEAM TAB */}
      {tab === 'team' && <>
        {contatti.length === 0 && <div style={{ textAlign: 'center', padding: 16, color: '#475569', fontSize: 13 }}>Nessun contatto — aggiungi il team</div>}
        {contatti.map(c => { const r = RUOLI.find(x => x.key === c.ruolo); const links = msgLinks(c)
          return <div key={c.id} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{r?.icon} {c.nome}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{r?.label}{c.telefono ? ` • ${c.telefono}` : ''}{c.email ? ` • ${c.email}` : ''}</div>
              </div>
              <button onClick={() => delContatto(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener" style={{ padding: '6px 12px', borderRadius: 6, background: l.color, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>{l.icon} {l.label}</a>)}
            </div>
          </div> })}

        {showAddC ? <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginTop: 8 }}>
          <input value={cNome} onChange={e => setCNome(e.target.value)} placeholder="Nome e cognome" style={{ ...iS, fontSize: 16 }} autoFocus />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>RUOLO</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {RUOLI.map(r => <button key={r.key} onClick={() => setCRuolo(r.key)} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: cRuolo === r.key ? '#3b82f6' : '#1e293b', color: cRuolo === r.key ? '#fff' : '#94a3b8', border: 'none' }}>{r.icon} {r.label}</button>)}
          </div>
          <input value={cTel} onChange={e => setCTel(e.target.value)} type="tel" placeholder="Telefono (per WhatsApp/SMS)" style={iS} />
          <input value={cEmail} onChange={e => setCEmail(e.target.value)} type="email" placeholder="Email" style={iS} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addContatto} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Aggiungi</button>
            <button onClick={() => setShowAddC(false)} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Annulla</button>
          </div>
        </div> : <button onClick={() => setShowAddC(true)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '2px dashed #334155', background: 'transparent', color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>+ Aggiungi Persona</button>}
      </>}
    </div>
  </div>
}

// ═══ PDF EXPORT — STANDARD MASTRO v1 ═══
async function exportPDF(cantiere: Cantiere, vani: Vano[], azienda: Azienda | null) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF(); let y = 15
  const W = 190; const L = 10; const R = 200
  const gray = (v: number) => { doc.setFillColor(v, v, v) }
  const box = (x: number, yy: number, w: number, h: number, fill = 245) => { gray(fill); doc.roundedRect(x, yy, w, h, 2, 2, 'F') }

  // HEADER
  box(L, y, W, 28, 30)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text(azienda?.nome || 'MASTRO MISURE', L + 8, y + 12)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200)
  doc.text('SCHEDA RILIEVO MISURE — STANDARD MASTRO v1', L + 8, y + 19)
  // Reference code
  const ref = `MM-${cantiere.id.substring(0, 8).toUpperCase()}`
  doc.setFontSize(8); doc.text(`Ref: ${ref}`, R - 5, y + 12, { align: 'right' })
  doc.text(new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), R - 5, y + 19, { align: 'right' })
  y += 34; doc.setTextColor(0, 0, 0)

  // DATI CANTIERE
  box(L, y, W, 32)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('DATI CANTIERE', L + 5, y + 7)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Cliente: ${cantiere.cliente_nome}`, L + 5, y + 14)
  doc.text(`Indirizzo: ${cantiere.indirizzo}${cantiere.citta ? ', ' + cantiere.citta : ''}`, L + 5, y + 20)
  const info2 = [`Tel: ${cantiere.cliente_telefono || '—'}`, cantiere.cliente_email ? `Email: ${cantiere.cliente_email}` : '', `Fase: ${FASI.find(f => f.key === cantiere.fase)?.label || ''}`].filter(Boolean).join('  |  ')
  doc.text(info2, L + 5, y + 26)
  y += 38

  // VANI
  for (const vano of vani) {
    if (y > 220) { doc.addPage(); y = 15 }
    const tv = TIPI_VANO.find(t => t.key === vano.tipo)

    // Vano header
    box(L, y, W, 10, 60)
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(`VANO ${vano.numero}: ${vano.nome || tv?.label || ''} (${tv?.label})`, L + 5, y + 7)
    const loc = [vano.locale, vano.piano].filter(Boolean).join(' - ')
    if (loc) { doc.setFontSize(8); doc.text(loc, R - 5, y + 7, { align: 'right' }) }
    y += 14; doc.setTextColor(0, 0, 0)

    const { data: mis } = await supabase.from('misure').select('*').eq('vano_id', vano.id).order('created_at', { ascending: false }).limit(1).single()
    if (mis) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      // Misure table
      const sections = [
        { title: 'LARGHEZZE', items: [['Alto', mis.larghezza_alto], ['Centro', mis.larghezza_centro], ['Basso', mis.larghezza_basso]] },
        { title: 'ALTEZZE', items: [['Sinistra', mis.altezza_sx], ['Centro', mis.altezza_centro], ['Destra', mis.altezza_dx]] },
        { title: 'DIAGONALI', items: [['Diag. 1', mis.diagonale_1], ['Diag. 2', mis.diagonale_2], ['F. Squadra', mis.fuori_squadra_mm]] },
        { title: 'SPALLETTE', items: [['Sinistra', mis.spalletta_sx], ['Destra', mis.spalletta_dx], ['Sopra', mis.spalletta_sopra]] },
        { title: 'DAVANZ./SOGLIA', items: [['Profondità', mis.davanzale_profondita], ['Sporgenza', mis.davanzale_sporgenza], ['Soglia H', mis.soglia_altezza], ['Imbotte P', mis.imbotte_profondita]] },
      ]
      if (vano.ha_cassonetto) sections.push({ title: 'CASSONETTO', items: [['Larghezza', mis.cassonetto_larghezza], ['Altezza', mis.cassonetto_altezza], ['Profondità', mis.cassonetto_profondita]] })

      for (const sec of sections) {
        if (y > 270) { doc.addPage(); y = 15 }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 100, 100)
        doc.text(sec.title, L + 3, y + 4)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0, 0, 0)
        let xOff = 50
        for (const [label, val] of sec.items) {
          const txt = `${label}: ${val || '—'}`
          doc.text(txt, xOff, y + 4)
          xOff += 40
        }
        doc.setDrawColor(230, 230, 230); doc.line(L, y + 7, R, y + 7)
        y += 9
      }

      // Accessori
      const accData: string[] = []
      if (vano.ha_tapparella) accData.push('Tapparella ✓')
      if (vano.ha_persiana) accData.push('Persiana ✓')
      if (vano.ha_zanzariera) accData.push('Zanzariera ✓')
      if (accData.length > 0) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 100, 100)
        doc.text('ACCESSORI', L + 3, y + 4)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); doc.setFontSize(9)
        doc.text(accData.join('  |  '), 50, y + 4)
        y += 9
      }

      // Note
      const noteClean = (mis.note || '').replace(/\{AD:.*?\}EA/, '').trim()
      if (noteClean) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
        doc.text(`Note: ${noteClean}`, L + 3, y + 4)
        y += 7
      }
    } else {
      doc.setFontSize(9); doc.setTextColor(180, 0, 0); doc.text('⚠ Misure non inserite', L + 5, y + 5); doc.setTextColor(0, 0, 0); y += 8
    }
    y += 6
  }

  // CHECKLIST SICUREZZA MISURE
  if (y > 230) { doc.addPage(); y = 15 }
  box(L, y, W, 40, 250)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('CHECK-LIST SICUREZZA MISURE', L + 5, y + 8)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  const checks = ['Luce muro rilevata', 'Fuori squadra verificato', 'Cassonetto misurato (se presente)', 'Foto panoramica scattata', 'Soglia / davanzale controllato']
  checks.forEach((c, i) => { doc.rect(L + 5, y + 12 + (i * 5.5), 3, 3); doc.text(c, L + 12, y + 14.5 + (i * 5.5)) })
  y += 46

  // FIRMA — include digital signatures if available
  if (y > 220) { doc.addPage(); y = 15 }
  const { data: firmeData } = await supabase.from('firme').select('*').eq('cantiere_id', cantiere.id).order('created_at')
  const firmeArr = firmeData || []

  box(L, y, W, firmeArr.length > 0 ? 50 : 35, 252)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.text('FIRME', L + 5, y + 8)

  if (firmeArr.length > 0) {
    let fx = L + 5
    for (const firma of firmeArr) {
      try {
        doc.addImage(firma.firma_data, 'PNG', fx, y + 12, 50, 25)
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
        doc.text(`${firma.tipo === 'cliente' ? 'Cliente' : 'Tecnico'}: ${firma.nome_firmatario}`, fx, y + 42)
        doc.text(new Date(firma.created_at).toLocaleDateString('it-IT'), fx, y + 46)
      } catch {}
      fx += 65
    }
    y += 52
  } else {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text('Tecnico: ________________________________', L + 5, y + 18)
    doc.text('Data: ___/___/______', L + 5, y + 25)
    doc.text('Cliente (presa visione): ________________________________', 105, y + 18)
    doc.text('Data: ___/___/______', 105, y + 25)
    y += 40
  }

  // FOOTER
  doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150)
  doc.text(`STANDARD MASTRO v1 — ${azienda?.nome || 'MASTRO MISURE'} — Ref: ${ref} — Generato il ${new Date().toLocaleString('it-IT')}`, 105, 290, { align: 'center' })
  doc.text('Documento generato con MASTRO MISURE — mastro-misure.vercel.app', 105, 294, { align: 'center' })

  doc.save(`StandardMastro_${cantiere.cliente_nome.replace(/\s+/g, '_')}_${ref}.pdf`)
}

// ═══ MAIN APP ═══
export default function App() {
  const [user, setUser] = useState<Utente | null>(null); const [azienda, setAzienda] = useState<Azienda | null>(null)
  const [loading, setLoading] = useState(true); const [view, setView] = useState<'dash' | 'cant' | 'mis'>('dash')
  const [cantieri, setCantieri] = useState<Cantiere[]>([]); const [selC, setSelC] = useState<Cantiere | null>(null)
  const [vani, setVani] = useState<Vano[]>([]); const [selV, setSelV] = useState<Vano | null>(null); const [misura, setMisura] = useState<Misura | null>(null)
  const [showCF, setShowCF] = useState(false); const [editC, setEditC] = useState<Cantiere | null>(null)
  const [showVF, setShowVF] = useState(false); const [editV, setEditV] = useState<Vano | null>(null); const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showFase, setShowFase] = useState(false); const [cfm, setCfm] = useState<{ t: string; id: string; n: string } | null>(null)
  const [search, setSearch] = useState('')
  const [archivio, setArchivio] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'nome' | 'fase'>('recent')
  const [filt, setFilt] = useState<{ type: string; val: string } | null>(null)
  const [vaniMap, setVaniMap] = useState<Record<string, number>>({}) // cantiere_id → n. vani

  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: u } = await supabase.from('utenti').select('*').eq('id', session.user.id).single()
      if (u) { setUser(u); const { data: a } = await supabase.from('aziende').select('*').eq('id', u.azienda_id).single(); if (a) setAzienda(a) }
    }; setLoading(false)
  }, [])
  useEffect(() => { checkSession() }, [checkSession])

  const loadC = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('cantieri').select('*').eq('azienda_id', user.azienda_id).order('created_at', { ascending: false })
    if (data) {
      setCantieri(data)
      // Load vani counts for semaphore
      const { data: allVani } = await supabase.from('vani').select('cantiere_id').in('cantiere_id', data.map(c => c.id))
      if (allVani) {
        const map: Record<string, number> = {}
        allVani.forEach(v => { map[v.cantiere_id] = (map[v.cantiere_id] || 0) + 1 })
        setVaniMap(map)
      }
    }
  }, [user])
  useEffect(() => { if (user) loadC() }, [user, loadC])

  const loadV = useCallback(async (cid: string) => { const { data } = await supabase.from('vani').select('*').eq('cantiere_id', cid).order('numero'); if (data) setVani(data) }, [])
  const loadM = useCallback(async (vid: string) => { const { data } = await supabase.from('misure').select('*').eq('vano_id', vid).order('created_at', { ascending: false }).limit(1).single(); setMisura(data || null) }, [])

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setAzienda(null); setView('dash') }
  const clients = [...new Set(cantieri.map(c => c.cliente_nome))]

  const saveC = async (d: Partial<Cantiere>) => { if (!user) return; if (editC) { await supabase.from('cantieri').update(d).eq('id', editC.id); setSelC({ ...editC, ...d } as Cantiere) } else { await supabase.from('cantieri').insert({ ...d, azienda_id: user.azienda_id, creato_da: user.id }) }; setShowCF(false); setEditC(null); loadC() }
  const delC = async (id: string) => { await supabase.from('cantieri').delete().eq('id', id); setCfm(null); setSelC(null); setView('dash'); loadC() }
  const chFase = async (f: string) => {
    if (!selC || !user) return
    const oldFase = FASI.find(x => x.key === selC.fase)?.label
    const newFase = FASI.find(x => x.key === f)?.label
    await supabase.from('cantieri').update({ fase: f }).eq('id', selC.id)
    await supabase.from('log_cantiere').insert({ cantiere_id: selC.id, utente_nome: user.nome, tipo: 'cambio_fase', testo: `Fase cambiata: ${oldFase} → ${newFase}` }).catch(() => {})
    setSelC({ ...selC, fase: f }); loadC()
  }

  const saveV = async (d: Partial<Vano>) => {
    if (!selC) return
    if (editV) { await supabase.from('vani').update(d).eq('id', editV.id); setShowVF(false); setEditV(null); loadV(selC.id) }
    else {
      const { data: nv } = await supabase.from('vani').insert({ ...d, cantiere_id: selC.id, numero: vani.length + 1 }).select().single()
      setShowVF(false); setEditV(null); loadV(selC.id)
      if (nv) { setSelV(nv); setMisura(null); setView('mis') }
    }
  }
  const quickAddVano = async (tipo: string) => {
    if (!selC) return
    const tv = TIPI_VANO.find(t => t.key === tipo)
    const num = vani.length + 1
    const nome = `${tv?.label || 'Vano'} ${num}`
    const { data: nv } = await supabase.from('vani').insert({ tipo, nome, cantiere_id: selC.id, numero: num }).select().single()
    setShowQuickAdd(false); loadV(selC.id)
    if (nv) { setSelV(nv); setMisura(null); setView('mis') }
  }
  const delV = async (id: string) => { if (!selC) return; await supabase.from('vani').delete().eq('id', id); setCfm(null); loadV(selC.id) }
  const saveM = async (d: Partial<Misura>) => {
    if (!selV || !user) return
    if (misura?.id) {
      // Save previous version
      await supabase.from('misure_versioni').insert({ misura_id: misura.id, vano_id: selV.id, dati: misura as any, modificato_da: user.nome }).catch(() => {})
      await supabase.from('misure').update(d).eq('id', misura.id)
      // Log change
      if (selC) await supabase.from('log_cantiere').insert({ cantiere_id: selC.id, utente_nome: user.nome, tipo: 'modifica', testo: `Misure aggiornate: ${selV.nome || 'Vano ' + selV.numero}` }).catch(() => {})
    } else {
      await supabase.from('misure').insert({ ...d, vano_id: selV.id, rilevato_da: user.id, tipo_rilevazione: 'sopralluogo' })
    }
    loadM(selV.id); alert('✅ Salvato!')
  }

  const openC = (c: Cantiere) => { setSelC(c); loadV(c.id); setView('cant') }
  const openM = (v: Vano) => { setSelV(v); loadM(v.id); setView('mis') }


  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter',sans-serif" }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>📐</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>Caricamento...</div></div></div>
  if (!user) return <LoginPage onLogin={checkSession} />

  // MISURE VIEW
  const updateVano = async (d: Partial<Vano>) => { if (!selV) return; await supabase.from('vani').update(d).eq('id', selV.id); setSelV({ ...selV, ...d } as Vano) }
  if (view === 'mis' && selV) return <InteractiveMisure vano={selV} misura={misura} userId={user.id} onSave={saveM} onUpdateVano={updateVano} onBack={() => setView('cant')} />

  // CANTIERE VIEW
  if (view === 'cant' && selC) {
    const fase = FASI.find(f => f.key === selC.fase)
    return <div style={{ minHeight: '100vh', background: '#0f172a', overflowX: 'hidden', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { setView('dash'); setSelC(null); loadC() }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 16, cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>🏗️ {selC.cliente_nome}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => exportPDF(selC, vani, azienda)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>📄</button>
          <button onClick={() => { setEditC(selC); setShowCF(true) }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✏️</button>
          <button onClick={() => setCfm({ t: 'c', id: selC.id, n: selC.cliente_nome })} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>🗑</button>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Esci</button>
        </div>
      </div>
      <div style={CONT_STYLE}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, borderLeft: `4px solid ${fase?.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <button onClick={() => setShowFase(true)} style={{ fontSize: 13, fontWeight: 700, color: fase?.color, background: `${fase?.color}20`, border: `1px solid ${fase?.color}40`, borderRadius: 20, padding: '4px 14px', cursor: 'pointer' }}>{fase?.icon} {fase?.label} ▼</button>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: (PRIORITA.find(p => p.key === selC.priorita)?.color || '') + '20', color: PRIORITA.find(p => p.key === selC.priorita)?.color }}>{selC.priorita}</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, cursor: 'pointer' }} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selC.indirizzo + (selC.citta ? ', ' + selC.citta : ''))}`, '_blank')}>📍 {selC.indirizzo}{selC.citta ? `, ${selC.citta}` : ''} <span style={{ color: '#3b82f6', fontSize: 10 }}>→ Mappa</span></div>
          {selC.note && <div style={{ color: '#64748b', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>{selC.note}</div>}
          {(selC.data_sopralluogo || selC.data_consegna_prevista) && <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {selC.data_sopralluogo && <span style={{ fontSize: 10, color: '#3b82f6', background: '#3b82f615', padding: '3px 8px', borderRadius: 6 }}>🔍 Sopr: {new Date(selC.data_sopralluogo).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>}
            {selC.data_consegna_prevista && <span style={{ fontSize: 10, color: '#8b5cf6', background: '#8b5cf615', padding: '3px 8px', borderRadius: 6 }}>📦 Cons: {new Date(selC.data_consegna_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>}
          </div>}
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {selC.cliente_telefono && <a href={`tel:${selC.cliente_telefono}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>📞 Chiama</a>}
          <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selC.indirizzo + (selC.citta ? ', ' + selC.citta : ''))}`, '_blank')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🗺️ Naviga</button>
          {selC.cliente_email && <a href={`mailto:${selC.cliente_email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#8b5cf6', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>✉️ Email</a>}
        </div>

        {/* AI SUGGERIMENTI */}
        <AISuggerimenti cantiere={selC} vani={vani} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Vani ({vani.length})</h3>
          <button onClick={() => setShowQuickAdd(true)} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⚡ Aggiungi</button>
        </div>

        {vani.length === 0 ? <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, textAlign: 'center' }}><div style={{ fontSize: 36 }}>🪟</div><div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Nessun vano — aggiungi il primo</div></div> :
          vani.map(v => { const tv = TIPI_VANO.find(t => t.key === v.tipo); return <div key={v.id} style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 6, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div onClick={() => openM(v)} style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{tv?.icon} V{v.numero} — {v.nome || tv?.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{v.locale && `${v.locale} • `}{v.piano || ''}{v.ha_cassonetto ? ' • 📦' : ''}{v.ha_tapparella ? ' • 🔲' : ''}{v.ha_persiana ? ' • 🪟' : ''}{v.ha_zanzariera ? ' • 🦟' : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => { setEditV(v); setShowVF(true) }} style={{ background: '#334155', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => setCfm({ t: 'v', id: v.id, n: v.nome || tv?.label || 'Vano' })} style={{ background: '#334155', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                <button onClick={() => openM(v)} style={{ background: '#3b82f6', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📐</button>
              </div>
            </div>
          </div> })
        }

        {/* TEAM & TASK */}
        <TeamTaskPanel cantiereId={selC.id} />

        {/* CHECKLIST MONTAGGIO — visible from produzione in poi */}
        {FASI.findIndex(f => f.key === selC.fase) >= 4 && <ChecklistPosa cantiereId={selC.id} userName={user.nome} />}

        {/* NOTE & LOG */}
        <NoteLog cantiereId={selC.id} userName={user.nome} />

        {/* FIRME */}
        <FirmaPanel cantiereId={selC.id} userName={user.nome} />

      </div>
      {showCF && <CantiereForm c={editC} clients={clients} onSave={saveC} onClose={() => { setShowCF(false); setEditC(null) }} />}
      {showVF && editV && <VanoEditForm v={editV} onSave={saveV} onClose={() => { setShowVF(false); setEditV(null) }} />}
      {showQuickAdd && <QuickAddVano onAdd={quickAddVano} onClose={() => setShowQuickAdd(false)} />}
      {showFase && <FaseSel cur={selC.fase} onChange={chFase} onClose={() => setShowFase(false)} nVani={vani.length} warnings={(() => { const w: string[] = []; if (vani.length === 0) w.push('Nessun vano inserito'); if (!selC.cliente_telefono) w.push('Telefono cliente mancante'); return w })()} />}
      {cfm && <Confirm msg={`Eliminare "${cfm.n}"? Azione irreversibile.`} onYes={() => cfm.t === 'c' ? delC(cfm.id) : delV(cfm.id)} onNo={() => setCfm(null)} />}
    </div>
  }

  // DASHBOARD — COMMAND CENTER
  const faseStats = FASI.map(f => ({ ...f, count: cantieri.filter(c => c.fase === f.key).length }))
  const filteredDash = cantieri.filter(c => {
    if (filt) {
      if (filt.type === 'fase' && c.fase !== filt.val) return false
      if (filt.type === 'sem') {
        const s = semaforo(c)
        if (filt.val === 'ok' && s.color !== '#22c55e') return false
        if (filt.val === 'inc' && s.color === '#22c55e') return false
        if (filt.val === 'rosso' && s.color !== '#ef4444') return false
      }
      if (filt.type === 'pri' && filt.val === 'urgente' && c.priorita !== 'urgente' && c.priorita !== 'alta') return false
      if (filt.type === 'group') {
        if (filt.val === 'produzione' && c.fase !== 'produzione' && c.fase !== 'ordini') return false
        if (filt.val === 'posa' && c.fase !== 'posa') return false
        if (filt.val === 'chiusura' && c.fase !== 'chiusura') return false
        if (filt.val === 'sopralluogo' && c.fase !== 'sopralluogo') return false
      }
    }
    if (!search) return true
    const s = search.toLowerCase()
    return c.cliente_nome.toLowerCase().includes(s) || c.indirizzo.toLowerCase().includes(s) || (c.citta || '').toLowerCase().includes(s)
  })
  const filtLabel = (): string => {
    if (!filt) return ''
    if (filt.type === 'fase') { const f = FASI.find(x => x.key === filt.val); return `${f?.icon} ${f?.label}` }
    if (filt.type === 'sem' && filt.val === 'ok') return '🟢 Completi'
    if (filt.type === 'sem' && filt.val === 'inc') return '⚠️ Incompleti'
    if (filt.type === 'sem' && filt.val === 'rosso') return '🔴 Critici'
    if (filt.type === 'pri') return '🔴 Urgenti'
    if (filt.type === 'group' && filt.val === 'produzione') return '🏭 In produzione'
    if (filt.type === 'group' && filt.val === 'posa') return '🔧 Da posare'
    if (filt.type === 'group' && filt.val === 'chiusura') return '✅ Da chiudere'
    if (filt.type === 'group' && filt.val === 'sopralluogo') return '🔍 Sopralluogo'
    return ''
  }
  const toggleFilt = (type: string, val: string) => setFilt(filt?.type === type && filt?.val === val ? null : { type, val })

  // Semaphore: check completeness per cantiere
  const semaforo = (c: Cantiere): { color: string; icon: string; tip: string } => {
    const nVani = vaniMap[c.id] || 0
    const problems: string[] = []
    if (!c.cliente_telefono) problems.push('tel')
    if (!c.indirizzo) problems.push('indirizzo')
    if (nVani === 0) problems.push('nessun vano')
    if (c.fase !== 'sopralluogo' && nVani === 0) problems.push('vani mancanti!')
    if (c.fase === 'ordini' && !c.data_consegna_prevista) problems.push('data consegna')
    if (problems.length >= 2) return { color: '#ef4444', icon: '🔴', tip: problems.join(', ') }
    if (problems.length === 1) return { color: '#f59e0b', icon: '🟡', tip: problems[0] }
    return { color: '#22c55e', icon: '🟢', tip: 'Completo' }
  }

  // Smart data
  const urgenti = cantieri.filter(c => c.priorita === 'urgente' || c.priorita === 'alta')
  const inProduzione = cantieri.filter(c => c.fase === 'produzione' || c.fase === 'ordini')
  const daPosare = cantieri.filter(c => c.fase === 'posa')
  const daChiudere = cantieri.filter(c => c.fase === 'chiusura')
  const oggi = new Date()
  const giorno = oggi.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  // Progress: how far along are all cantieri (0-100)
  const faseIdx = (f: string) => FASI.findIndex(x => x.key === f)
  const avgProgress = cantieri.length > 0 ? Math.round(cantieri.reduce((s, c) => s + (faseIdx(c.fase) / (FASI.length - 1)) * 100, 0) / cantieri.length) : 0

  return <div style={{ minHeight: '100vh', background: '#0f172a', overflowX: 'hidden', fontFamily: "'Inter',sans-serif" }}>
    {/* Header */}
    <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', padding: '16px 16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>📐 MASTRO MISURE</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Ciao {user.nome}! • {giorno}</div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Esci</button>
      </div>

      {/* Hero stats — TUTTI TOCCABILI */}
      <div style={{ display: 'flex', gap: 4, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setFilt(null)} style={{ flex: 1, background: filt === null ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', textAlign: 'center', border: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{cantieri.length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>TUTTI</div>
        </button>
        <button onClick={() => toggleFilt('sem', 'ok')} style={{ flex: 1, background: filt?.val === 'ok' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', textAlign: 'center', border: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{cantieri.filter(c => semaforo(c).color === '#22c55e').length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>🟢 OK</div>
        </button>
        <button onClick={() => toggleFilt('sem', 'inc')} style={{ flex: 1, background: filt?.val === 'inc' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', textAlign: 'center', border: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{cantieri.filter(c => semaforo(c).color !== '#22c55e').length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>⚠️ INCOMPL.</div>
        </button>
        <button onClick={() => toggleFilt('pri', 'urgente')} style={{ flex: 1, background: filt?.val === 'urgente' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', textAlign: 'center', border: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{urgenti.length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>🔴 URGENTI</div>
        </button>
      </div>
    </div>

    <div style={CONT_STYLE}>

      {/* ═══ SCADENZE & NOTIFICHE ═══ */}
      <ScadenzeAlerts cantieri={cantieri} onOpen={openC} />

      {/* ═══ CALENDARIO / AGENDA ═══ */}
      <CalendarioView cantieri={cantieri} onOpen={openC} />

      {/* ═══ ATTENZIONE — smart alerts ═══ */}
      {(() => {
        const rossi = cantieri.filter(c => semaforo(c).color === '#ef4444' && !urgenti.includes(c))
        const showAlert = urgenti.length > 0 || daPosare.length > 0 || daChiudere.length > 0 || rossi.length > 0
        if (!showAlert) return null
        return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>⚡ RICHIEDE ATTENZIONE</div>
        {urgenti.map(c => <div key={c.id + 'u'} onClick={() => openC(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>🔴</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{c.cliente_nome}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Priorità {c.priorita} • {FASI.find(f => f.key === c.fase)?.label}</div></div>
          <span style={{ color: '#475569', fontSize: 14 }}>→</span>
        </div>)}
        {rossi.map(c => <div key={c.id + 'r'} onClick={() => openC(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{c.cliente_nome}</div><div style={{ fontSize: 10, color: '#f87171' }}>Dati incompleti: {semaforo(c).tip}</div></div>
          <span style={{ color: '#475569', fontSize: 14 }}>→</span>
        </div>)}
        {daPosare.map(c => <div key={c.id + 'p'} onClick={() => openC(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>🔧</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{c.cliente_nome}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Pronto per la posa</div></div>
          <span style={{ color: '#475569', fontSize: 14 }}>→</span>
        </div>)}
        {daChiudere.map(c => <div key={c.id + 'ch'} onClick={() => openC(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{c.cliente_nome}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Da chiudere — fattura?</div></div>
          <span style={{ color: '#475569', fontSize: 14 }}>→</span>
        </div>)}
      </div> })()}

      {/* ═══ PIPELINE — visual progress ═══ */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>📊 PIPELINE — tocca per filtrare</div>
        {/* Progress bar */}
        <div style={{ height: 6, background: '#0f172a', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${avgProgress}%`, background: 'linear-gradient(90deg, #3b82f6, #22c55e)', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {faseStats.map((f, i) => { const active = filt?.type === 'fase' && filt?.val === f.key; return <button key={f.key} onClick={() => toggleFilt('fase', f.key)} style={{ flex: 1, padding: '8px 2px', borderRadius: 8, background: active ? f.color : f.count > 0 ? `${f.color}15` : '#0f172a', border: active ? `2px solid ${f.color}` : '2px solid transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: active ? '#fff' : f.count > 0 ? f.color : '#1e293b' }}>{f.count}</div>
            <div style={{ fontSize: 7, color: active ? '#fff' : '#64748b', fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>{f.label.substring(0, 5)}</div>
          </button> })}
        </div>
        {filt && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '6px 10px', background: '#334155', borderRadius: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{filtLabel()}</span>
          <button onClick={() => setFilt(null)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>✕ Reset</button>
        </div>}
      </div>

      {/* ═══ QUICK SITUAZIONE — TOCCA PER FILTRARE ═══ */}
      {cantieri.length > 0 && <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          { l: 'Sopralluogo', v: faseStats[0]?.count || 0, c: '#3b82f6', i: '🔍', ft: 'group', fv: 'sopralluogo' },
          { l: 'In produzione', v: inProduzione.length, c: '#a855f7', i: '🏭', ft: 'group', fv: 'produzione' },
          { l: 'Da posare', v: daPosare.length, c: '#f59e0b', i: '🔧', ft: 'group', fv: 'posa' },
          { l: 'Completati', v: cantieri.filter(c => c.fase === 'chiusura').length, c: '#22c55e', i: '✅', ft: 'group', fv: 'chiusura' },
        ].map(s => { const active = filt?.type === s.ft && filt?.val === s.fv; return <button key={s.l} onClick={() => toggleFilt(s.ft, s.fv)} style={{ flex: 1, background: active ? `${s.c}30` : '#1e293b', borderRadius: 8, padding: '8px 6px', textAlign: 'center', border: active ? `2px solid ${s.c}` : '2px solid transparent', cursor: 'pointer' }}>
          <div style={{ fontSize: 14 }}>{s.i}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: s.v > 0 ? s.c : '#1e293b' }}>{s.v}</div>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{s.l}</div>
        </button> })}
      </div>}

      {/* ═══ ANALYTICS AVANZATE ═══ */}
      {cantieri.length > 0 && (() => {
        const totalV = Object.values(vaniMap).reduce((a, b) => a + b, 0)
        const chiuse = cantieri.filter(c => c.fase === 'chiusura')
        const tempoMedio = chiuse.length > 0 ? Math.round(chiuse.reduce((s, c) => s + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()), 0) / chiuse.length / 86400000) : null
        const thisMonth = cantieri.filter(c => { const d = new Date(c.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() })
        const lastMonth = cantieri.filter(c => { const d = new Date(c.created_at); const n = new Date(); const lm = new Date(n.getFullYear(), n.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() })
        const maxFase = Math.max(...faseStats.map(f => f.count), 1)

        return <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>📊 ANALYTICS</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { v: totalV, l: 'VANI TOTALI', c: '#3b82f6' },
              { v: tempoMedio !== null ? `${tempoMedio}g` : '—', l: 'TEMPO MEDIO', c: '#22c55e' },
              { v: thisMonth.length, l: 'QUESTO MESE', c: '#f59e0b' },
              { v: lastMonth.length, l: 'MESE SCORSO', c: '#64748b' },
            ].map(s => <div key={s.l} style={{ flex: 1, background: '#0f172a', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 7, color: '#64748b', fontWeight: 600 }}>{s.l}</div>
            </div>)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 6 }}>DISTRIBUZIONE PIPELINE</div>
          {faseStats.map(f => <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, cursor: 'pointer' }} onClick={() => toggleFilt('fase', f.key)}>
            <div style={{ width: 18, fontSize: 10, textAlign: 'center' }}>{f.icon}</div>
            <div style={{ flex: 1, height: 14, background: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(f.count / maxFase) * 100}%`, background: f.color, borderRadius: 3, minWidth: f.count > 0 ? 4 : 0 }} />
            </div>
            <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: f.count > 0 ? f.color : '#1e293b', textAlign: 'right' }}>{f.count}</div>
          </div>)}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>COMPLETEZZA</div>
            <div style={{ flex: 1, height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
              {(() => { const ok = cantieri.filter(c => semaforo(c).color === '#22c55e').length; const pct = cantieri.length > 0 ? Math.round((ok / cantieri.length) * 100) : 0; return <div style={{ height: '100%', width: `${pct}%`, background: pct > 70 ? '#22c55e' : pct > 40 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} /> })()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{cantieri.length > 0 ? Math.round((cantieri.filter(c => semaforo(c).color === '#22c55e').length / cantieri.length) * 100) : 0}%</div>
          </div>
        </div>
      })()}

      {/* Search + Archive + New */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cerca cliente, indirizzo, città..." style={{ ...iS, flex: 1, marginBottom: 0, background: '#1e293b' }} />
        <button onClick={() => setArchivio(!archivio)} style={{ background: archivio ? '#3b82f6' : '#1e293b', border: archivio ? '1px solid #3b82f6' : '1px solid #334155', borderRadius: 8, padding: '0 12px', color: archivio ? '#fff' : '#64748b', fontSize: 14, cursor: 'pointer' }}>🗄️</button>
        <button onClick={() => { setEditC(null); setShowCF(true) }} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8, padding: '0 20px', color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
      </div>

      {/* Advanced filters */}
      {archivio && <div style={{ background: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>🗄️ ARCHIVIO — ORDINA PER</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {([['recent', '🕐 Recenti'], ['nome', '👤 Nome'], ['fase', '📊 Fase']] as [string, string][]).map(([k, l]) =>
            <button key={k} onClick={() => setSortBy(k as 'recent' | 'nome' | 'fase')} style={{ flex: 1, padding: 8, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: sortBy === k ? '#3b82f6' : '#0f172a', color: sortBy === k ? '#fff' : '#94a3b8', border: 'none' }}>{l}</button>
          )}
        </div>
        <div style={{ fontSize: 10, color: '#475569' }}>
          Trovati: {filteredDash.length} • Totale vani: {Object.values(vaniMap).reduce((a, b) => a + b, 0)} • Cerca per nome, indirizzo o città
        </div>
      </div>}

      {/* Cantieri list */}
      {filt && <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>{filtLabel()} ({filteredDash.length})</div>}
      {(() => {
        const sorted = [...filteredDash].sort((a, b) => {
          if (sortBy === 'nome') return a.cliente_nome.localeCompare(b.cliente_nome)
          if (sortBy === 'fase') return faseIdx(a.fase) - faseIdx(b.fase)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        return sorted.length === 0 ? <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, textAlign: 'center' }}><div style={{ fontSize: 42 }}>🏗️</div><div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{search || filt ? 'Nessun risultato' : 'Nessun cantiere — inizia!'}</div>{!search && !filt && <button onClick={() => { setEditC(null); setShowCF(true) }} style={{ marginTop: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 10, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Crea il primo cantiere</button>}</div> :
        sorted.map(c => { const fase = FASI.find(f => f.key === c.fase); const pri = PRIORITA.find(p => p.key === c.priorita); const prog = Math.round((faseIdx(c.fase) / (FASI.length - 1)) * 100); const sem = semaforo(c); const nv = vaniMap[c.id] || 0
          return <div key={c.id} onClick={() => openC(c)} style={{ background: '#1e293b', borderRadius: 12, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', border: c.priorita === 'urgente' ? '2px solid #ef4444' : '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{sem.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{c.cliente_nome}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>📍 {c.indirizzo}{c.citta ? `, ${c.citta}` : ''}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{nv > 0 ? `🪟 ${nv} vani` : '⚠️ Nessun vano'}{sem.tip !== 'Completo' ? ` • ${sem.tip}` : ''}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700, background: `${fase?.color}20`, color: fase?.color }}>{fase?.icon} {fase?.label}</span>
              {c.priorita !== 'normale' && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, fontWeight: 700, background: `${pri?.color}20`, color: pri?.color }}>{pri?.label}</span>}
            </div>
          </div>
          {/* Mini progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: '#0f172a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prog}%`, background: fase?.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, minWidth: 30, textAlign: 'right' }}>{prog}%</span>
          </div>
        </div> })
      })()}
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#1e293b', fontSize: 11 }}>{azienda?.nome} • MASTRO MISURE v4.0</div>
    </div>
    {showCF && <CantiereForm c={editC} clients={clients} onSave={saveC} onClose={() => { setShowCF(false); setEditC(null) }} />}
  </div>
}