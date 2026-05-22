import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SUPA_URL = "https://vxovcrmkecnmbfpjufcu.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b3Zjcm1rZWNubWJmcGp1ZmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNDMxMTgsImV4cCI6MjA5NDgxOTExOH0.VI12rqzRB7yDyg8ELChKNyyBTWkcoj-IcDCCB2ioffE";

const supa = {
  authHeaders(token) {
    return { "apikey":SUPA_KEY, "Authorization":`Bearer ${token}`, "Content-Type":"application/json", "Prefer":"return=representation" };
  },
  async signUp(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/signup`, { method:"POST", headers:{ "apikey":SUPA_KEY,"Content-Type":"application/json" }, body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:{ "apikey":SUPA_KEY,"Content-Type":"application/json" }, body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPA_URL}/auth/v1/logout`, { method:"POST", headers:{ "apikey":SUPA_KEY,"Authorization":`Bearer ${token}` } });
  },
  async get(token, table, query="") {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { headers: this.authHeaders(token) });
    return r.json();
  },
  async post(token, table, body) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method:"POST", headers: this.authHeaders(token), body: JSON.stringify(body) });
    return r.json();
  },
  async patch(token, table, query, body) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { method:"PATCH", headers: this.authHeaders(token), body: JSON.stringify(body) });
    return r.json();
  },
  async delete(token, table, query) {
    await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, { method:"DELETE", headers: this.authHeaders(token) });
  },
  async upsert(token, table, body, onConflict) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?on_conflict=${onConflict}`, { method:"POST", headers:{ ...this.authHeaders(token), "Prefer":"resolution=merge-duplicates,return=representation" }, body: JSON.stringify(body) });
    return r.json();
  },
};

const EMOJI_OPTIONS = ["🦁","🦊","🐸","🦋","🐬","🦄","🐻","🐼","🐨","🦸","🧒","👦","👧","🐯","🐺","🦅","🐉","🌟","🚀","🎨"];
const COLOR_OPTIONS = [
  { color:"#FF6B6B", light:"#FFE8E8" }, { color:"#FF9F43", light:"#FFF3E0" },
  { color:"#55C57A", light:"#E8F8EE" }, { color:"#54A0FF", light:"#E8F2FF" },
  { color:"#5F27CD", light:"#EDE8FF" }, { color:"#FF6CAE", light:"#FFE8F4" },
  { color:"#E67E22", light:"#FDF3E3" }, { color:"#00B894", light:"#E0FAF5" },
  { color:"#E84393", light:"#FFE0F3" }, { color:"#636E72", light:"#F0F0F0" },
];
const SUGGESTIONS = [
  { label:"Arrumar a cama",icon:"🛏️" }, { label:"Retirar louça da mesa",icon:"🍽️" },
  { label:"Guardar louça na lava-louça",icon:"🫧" }, { label:"Organizar o quarto",icon:"🧹" },
  { label:"Jogar lixo fora",icon:"🗑️" }, { label:"Dobrar a roupa",icon:"👕" },
  { label:"Cuidar do pet",icon:"🐾" }, { label:"Varrer a casa",icon:"🧹" },
  { label:"Organizar brinquedos",icon:"🧸" }, { label:"Regar as plantas",icon:"🪴" },
  { label:"Limpar a mesa",icon:"🧽" }, { label:"Arrumar a mochila",icon:"🎒" },
  { label:"Escovar os dentes",icon:"🦷" }, { label:"Tomar banho",icon:"🚿" },
  { label:"Fazer a lição",icon:"📚" },
];
const ICONS = ["🛏️","🍽️","🫧","🧹","🗑️","👕","🐾","🧸","🪴","🧽","🎒","🦷","🚿","✨","📚","🎨","🧺","🪣","⭐","🏠"];
const TODAY = new Date().toISOString().slice(0,10);

function getMedal(pct) {
  if (pct===100) return { icon:"🥇",label:"Ouro",  color:"#B8860B",bg:"#FFF9E0",border:"#FFD700" };
  if (pct>=80)   return { icon:"🥈",label:"Prata", color:"#707070",bg:"#F5F5F5",border:"#C0C0C0" };
  if (pct>=60)   return { icon:"🥉",label:"Bronze",color:"#8B5E3C",bg:"#FDF3E3",border:"#CD7F32" };
  return null;
}
function fmtDate(iso) { const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');
  * { box-sizing: border-box; }
  @keyframes pop      { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes party    { 0%,100%{transform:scale(1)} 30%{transform:scale(1.04) rotate(-1deg)} 70%{transform:scale(1.04) rotate(1deg)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  .task-row { cursor:pointer;display:flex;align-items:center;gap:.5rem;border-radius:12px;padding:.48rem .7rem;transition:all .18s cubic-bezier(.34,1.56,.64,1);border:2px solid #E8E8E8;background:#F7F7F7;margin-bottom:.38rem; }
  .task-row:hover { transform:scale(1.025);box-shadow:0 2px 8px rgba(0,0,0,.07); }
  .task-row.done { animation:pop .28s ease; }
  .child-card { background:white;border-radius:22px;box-shadow:0 4px 20px rgba(0,0,0,.10);transition:box-shadow .2s;animation:fadeIn .4s ease both;overflow:hidden; }
  .child-card:hover { box-shadow:0 10px 36px rgba(0,0,0,.16); }
  .child-card.party { animation:party 1.2s ease infinite; }
  .edit-btn { background:rgba(255,255,255,.22);border:none;border-radius:8px;color:white;cursor:pointer;font-size:.78rem;padding:3px 9px;font-family:'Nunito',sans-serif;font-weight:800;transition:all .15s; }
  .edit-btn:hover { background:rgba(255,255,255,.38);transform:scale(1.05); }
  .btn { border:none;cursor:pointer;border-radius:12px;font-family:'Nunito',sans-serif;font-weight:800;transition:all .15s; }
  .btn:hover { transform:scale(1.06); }
  .btn:disabled { opacity:.5;cursor:default;transform:none; }
  .inp { font-family:'Nunito',sans-serif;border:2px solid #ddd;border-radius:10px;padding:.45rem .75rem;font-size:.95rem;outline:none;transition:border .2s;width:100%; }
  .inp:focus { border-color:#667eea; }
  .tab-btn { border:none;cursor:pointer;border-radius:99px;font-family:'Nunito',sans-serif;font-weight:800;padding:.35rem 1rem;font-size:.82rem;transition:all .15s; }
  .child-pill { border:2px solid transparent;border-radius:99px;padding:4px 14px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:800;font-size:.8rem;transition:all .15s; }
  .child-pill:hover { transform:scale(1.06); }
  .summary-card { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:1rem 1.2rem;animation:fadeIn .35s ease both; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:99px}
`;

function Spinner({ size=24, color="white" }) {
  return <div style={{ width:size,height:size,border:`3px solid ${color}33`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block" }} />;
}function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="signup") {
        if (password !== confirm) { setError("As senhas não coincidem."); setLoading(false); return; }
        if (password.length < 6)  { setError("A senha deve ter ao menos 6 caracteres."); setLoading(false); return; }
        const res = await supa.signUp(email, password);
        if (res.error) { setError(res.error.message || "Erro ao criar conta."); setLoading(false); return; }
        const res2 = await supa.signIn(email, password);
        if (res2.error || !res2.access_token) { setError("Conta criada! Faça login."); setMode("login"); setLoading(false); return; }
        onAuth(res2.access_token, res2.user);
      } else {
        const res = await supa.signIn(email, password);
        if (res.error || !res.access_token) { setError("Email ou senha incorretos."); setLoading(false); return; }
        onAuth(res.access_token, res.user);
      }
    } catch(e) { setError("Erro de conexão. Tente novamente."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",fontFamily:"'Nunito',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background:"white",borderRadius:"28px",width:"100%",maxWidth:"420px",boxShadow:"0 24px 80px rgba(0,0,0,.25)",overflow:"hidden",animation:"slideUp .35s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"2rem 2rem 1.5rem",textAlign:"center" }}>
          <div style={{ fontSize:"3rem",marginBottom:".3rem" }}>🏠</div>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.8rem",color:"white" }}>Tarefas da Casa</div>
          <div style={{ color:"rgba(255,255,255,.8)",fontSize:".85rem",fontWeight:600,marginTop:".3rem" }}>Organização e diversão para toda a família!</div>
        </div>
        <div style={{ padding:"1.8rem 2rem" }}>
          <div style={{ display:"flex",background:"#F3F4F6",borderRadius:"12px",padding:"3px",marginBottom:"1.4rem" }}>
            {[["login","Entrar"],["signup","Criar conta"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex:1,border:"none",borderRadius:"10px",padding:".5rem",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:".88rem",cursor:"pointer",background:mode===m?"white":"transparent",color:mode===m?"#667eea":"#888",boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.1)":"none",transition:"all .2s" }}>{l}</button>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:".8rem" }}>
            <div>
              <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px" }}>Email</label>
              <input className="inp" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handle()} />
            </div>
            <div>
              <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px" }}>Senha</label>
              <input className="inp" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handle()} />
            </div>
            {mode==="signup" && (
              <div>
                <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".5px" }}>Confirmar senha</label>
                <input className="inp" type="password" placeholder="Repita a senha" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key==="Enter" && handle()} />
              </div>
            )}
            {error && <div style={{ background:"#FFE8E8",border:"1.5px solid #FF6B6B",borderRadius:"10px",padding:".6rem .9rem",color:"#C0392B",fontSize:".85rem",fontWeight:700 }}>⚠️ {error}</div>}
            <button className="btn" onClick={handle} disabled={loading || !email || !password}
              style={{ background:"linear-gradient(135deg,#667eea,#764ba2)",color:"white",padding:".75rem",fontSize:"1rem",marginTop:".2rem",display:"flex",alignItems:"center",justifyContent:"center",gap:".6rem" }}>
              {loading ? <Spinner /> : (mode==="login" ? "Entrar 🚀" : "Criar minha conta 🎉")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddChildModal({ token, familyId, onClose, onSaved, editChild }) {
  const [name, setName]         = useState(editChild?.name || "");
  const [emoji, setEmoji]       = useState(editChild?.emoji || "🦁");
  const [colorIdx, setColorIdx] = useState(() => editChild ? Math.max(0,COLOR_OPTIONS.findIndex(c=>c.color===editChild.color)) : 0);
  const [loading, setLoading]   = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { color, light } = COLOR_OPTIONS[colorIdx];
    const body = { name:name.trim(), emoji, color, light };
    if (editChild) {
      await supa.patch(token, "children", `id=eq.${editChild.id}`, body);
    } else {
      await supa.post(token, "children", { ...body, family_id:familyId, position:Date.now() });
    }
    setLoading(false); onSaved();
  };

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(20,10,50,.65)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",animation:"fadeIn .2s ease" }}>
      <div style={{ background:"white",borderRadius:"24px",width:"100%",maxWidth:"420px",boxShadow:"0 24px 70px rgba(0,0,0,.3)",animation:"slideUp .25s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ background:`linear-gradient(135deg,${COLOR_OPTIONS[colorIdx].color},${COLOR_OPTIONS[colorIdx].color}bb)`,borderRadius:"24px 24px 0 0",padding:"1.1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.2rem",color:"white" }}>{emoji} {editChild ? "Editar criança" : "Nova criança"}</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.25)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",color:"white",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"1.3rem 1.4rem",display:"flex",flexDirection:"column",gap:"1rem" }}>
          <div>
            <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"5px",textTransform:"uppercase",letterSpacing:".5px" }}>Nome</label>
            <input className="inp" type="text" placeholder="Nome da criança..." value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"5px",textTransform:"uppercase",letterSpacing:".5px" }}>Emoji</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>
              {EMOJI_OPTIONS.map(em => (
                <button key={em} onClick={() => setEmoji(em)} style={{ background:em===emoji?COLOR_OPTIONS[colorIdx].light:"#F5F5F5",border:`2px solid ${em===emoji?COLOR_OPTIONS[colorIdx].color:"#EEE"}`,borderRadius:"8px",padding:"4px 7px",cursor:"pointer",fontSize:"1.2rem" }}>{em}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:".78rem",fontWeight:800,color:"#555",display:"block",marginBottom:"5px",textTransform:"uppercase",letterSpacing:".5px" }}>Cor</label>
            <div style={{ display:"flex",gap:"7px",flexWrap:"wrap" }}>
              {COLOR_OPTIONS.map((c,i) => (
                <div key={i} onClick={() => setColorIdx(i)} style={{ width:30,height:30,borderRadius:"50%",background:c.color,cursor:"pointer",border:`3px solid ${i===colorIdx?"#333":"transparent"}`,transition:"all .15s",transform:i===colorIdx?"scale(1.2)":"scale(1)" }} />
              ))}
            </div>
          </div>
          <div style={{ display:"flex",gap:".6rem",justifyContent:"flex-end" }}>
            <button className="btn" onClick={onClose} style={{ background:"#EEE",color:"#666",padding:".55rem 1.1rem",fontSize:".88rem" }}>Cancelar</button>
            <button className="btn" onClick={save} disabled={loading||!name.trim()} style={{ background:`linear-gradient(135deg,${COLOR_OPTIONS[colorIdx].color},${COLOR_OPTIONS[colorIdx].color}bb)`,color:"white",padding:".55rem 1.4rem",fontSize:".88rem",display:"flex",alignItems:"center",gap:".5rem" }}>
              {loading ? <Spinner size={16} /> : "✅ Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditTasksModal({ token, child, onClose, onSaved }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [label, setLabel]     = useState("");
  const [icon, setIcon]       = useState("✨");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    supa.get(token, "tasks", `child_id=eq.${child.id}&order=position.asc`).then(data => {
      setTasks(Array.isArray(data) ? data : []); setLoading(false);
    });
  }, []);

  const add = async (lbl, ico) => {
    if (!lbl.trim()) return;
    const pos = (tasks.length ? Math.max(...tasks.map(t=>t.position||0)) : 0) + 1000;
    const res = await supa.post(token, "tasks", { child_id:child.id, label:lbl.trim(), icon:ico, position:pos });
    setTasks(p => [...p, ...(Array.isArray(res)?res:[res])]);
    setLabel(""); setIcon("✨"); setShowPicker(false);
  };

  const remove = async (id) => {
    await supa.delete(token, "tasks", `id=eq.${id}`);
    setTasks(p => p.filter(t => t.id!==id));
  };

  const move = (idx, dir) => {
    setTasks(p => { const a=[...p],s=idx+dir; if(s<0||s>=a.length)return a; [a[idx],a[s]]=[a[s],a[idx]]; return a; });
  };

  const editLabel = (id,val) => setTasks(p => p.map(t => t.id===id?{...t,label:val}:t));
  const editIcon  = (id,val) => setTasks(p => p.map(t => t.id===id?{...t,icon:val}:t));

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(tasks.map((t,i) => supa.patch(token,"tasks",`id=eq.${t.id}`,{ label:t.label,icon:t.icon,position:(i+1)*1000 })));
    setSaving(false); onSaved();
  };

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(20,10,50,.65)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",animation:"fadeIn .2s ease" }}>
      <div style={{ background:"white",borderRadius:"26px",width:"100%",maxWidth:"490px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 70px rgba(0,0,0,.35)",animation:"slideUp .25s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ background:`linear-gradient(135deg,${child.color},${child.color}aa)`,borderRadius:"26px 26px 0 0",padding:"1.1rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:".7rem" }}>
            <span style={{ fontSize:"2rem" }}>{child.emoji}</span>
            <div>
              <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.15rem",color:"white" }}>{child.name}</div>
              <div style={{ color:"rgba(255,255,255,.8)",fontSize:".75rem",fontWeight:700 }}>Editar tarefas</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.25)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",color:"white",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"1.2rem 1.4rem" }}>
          {loading ? <div style={{ textAlign:"center",padding:"2rem" }}><Spinner color="#667eea" /></div> : (
            <>
              <div style={{ marginBottom:"1.1rem" }}>
                <div style={{ fontWeight:900,color:"#555",fontSize:".78rem",marginBottom:".55rem",textTransform:"uppercase",letterSpacing:".8px" }}>Tarefas ({tasks.length})</div>
                {tasks.length===0 && <div style={{ color:"#ccc",fontSize:".88rem",textAlign:"center",padding:"1rem 0" }}>Adicione tarefas abaixo 👇</div>}
                {tasks.map((t,idx) => (
                  <div key={t.id} style={{ display:"flex",alignItems:"center",gap:".4rem",background:"#F9F9F9",borderRadius:"12px",padding:".45rem .6rem",marginBottom:".35rem",border:"1.5px solid #EFEFEF" }}>
                    <button onClick={() => { const c=ICONS.indexOf(t.icon); editIcon(t.id,ICONS[(c+1)%ICONS.length]); }} style={{ background:"none",border:"none",fontSize:"1.1rem",cursor:"pointer",flexShrink:0,padding:"0 2px" }}>{t.icon}</button>
                    <input type="text" value={t.label} onChange={e => editLabel(t.id,e.target.value)} style={{ flex:1,border:"none",background:"transparent",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:".88rem",color:"#333",outline:"none",minWidth:0 }} />
                    <button onClick={() => move(idx,-1)} disabled={idx===0} style={{ background:"none",border:"none",cursor:idx===0?"default":"pointer",opacity:idx===0?.25:.6,fontSize:".8rem",padding:"1px 3px" }}>▲</button>
                    <button onClick={() => move(idx,1)} disabled={idx===tasks.length-1} style={{ background:"none",border:"none",cursor:idx===tasks.length-1?"default":"pointer",opacity:idx===tasks.length-1?.25:.6,fontSize:".8rem",padding:"1px 3px" }}>▼</button>
                    <button onClick={() => remove(t.id)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:".95rem",color:"#FF6B6B",padding:"1px 3px" }}>🗑️</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:"2px dashed #EEE",paddingTop:"1rem",marginBottom:"1rem" }}>
                <div style={{ fontWeight:900,color:"#555",fontSize:".78rem",marginBottom:".55rem",textTransform:"uppercase",letterSpacing:".8px" }}>➕ Nova tarefa</div>
                <div style={{ display:"flex",gap:".45rem",marginBottom:".5rem" }}>
                  <button onClick={() => setShowPicker(v=>!v)} style={{ background:"#F0F0F0",border:"2px solid #DDD",borderRadius:"10px",padding:".35rem .55rem",fontSize:"1.2rem",cursor:"pointer",flexShrink:0 }}>{icon}</button>
                  <input className="inp" type="text" placeholder="Nome da tarefa..." value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key==="Enter" && add(label,icon)} style={{ flex:1,minWidth:0 }} />
                  <button onClick={() => add(label,icon)} style={{ background:child.color,color:"white",border:"none",borderRadius:"10px",padding:".35rem .8rem",fontFamily:"'Nunito',sans-serif",fontWeight:800,cursor:"pointer",fontSize:".88rem",flexShrink:0 }}>Adicionar</button>
                </div>
                {showPicker && (
                  <div style={{ background:"#F8F8F8",borderRadius:"12px",padding:".55rem",display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:".5rem" }}>
                    {ICONS.map(ic => <button key={ic} onClick={() => { setIcon(ic); setShowPicker(false); }} style={{ background:ic===icon?child.light:"white",border:`2px solid ${ic===icon?child.color:"#EEE"}`,borderRadius:"8px",padding:"4px 6px",cursor:"pointer",fontSize:"1.05rem" }}>{ic}</button>)}
                  </div>
                )}
                <div style={{ fontSize:".75rem",fontWeight:800,color:"#AAA",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".5px" }}>Sugestões:</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:".35rem" }}>
                  {SUGGESTIONS.filter(s => !tasks.find(t => t.label===s.label)).slice(0,9).map(s => (
                    <button key={s.label} onClick={() => add(s.label,s.icon)} style={{ background:"#F2F2F2",border:"1.5px solid #E5E5E5",borderRadius:"99px",padding:"3px 10px",fontSize:".75rem",fontFamily:"'Nunito',sans-serif",fontWeight:700,cursor:"pointer",color:"#555" }}>{s.icon} {s.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex",gap:".6rem",justifyContent:"flex-end" }}>
                <button className="btn" onClick={onClose} style={{ background:"#EEE",color:"#666",padding:".55rem 1.1rem",fontSize:".88rem" }}>Cancelar</button>
                <button className="btn" onClick={saveAll} disabled={saving} style={{ background:`linear-gradient(135deg,${child.color},${child.color}bb)`,color:"white",padding:".55rem 1.4rem",fontSize:".88rem",display:"flex",alignItems:"center",gap:".5rem" }}>
                  {saving ? <Spinner size={16} /> : "✅ Salvar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryView({ token, children, onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("chart");

  useEffect(() => {
    if (!children.length) { setLoading(false); return; }
    const ids = children.map(c=>c.id);
    supa.get(token,"daily_records",`child_id=in.(${ids.join(",")})&order=date.asc`).then(data => {
      setRecords(Array.isArray(data)?data:[]); setLoading(false);
    });
  }, []);

  const getStats = () => {
    const map = {};
    records.forEach(r => {
      if (!map[r.date]) map[r.date]={};
      if (!map[r.date][r.child_id]) map[r.date][r.child_id]={ done:0, total:0 };
      map[r.date][r.child_id].total++;
      if (r.completed) map[r.date][r.child_id].done++;
    });
    return map;
  };

  const stats = getStats();
  const dates = Object.keys(stats).sort().slice(-14);
  const toShow = selected ? children.filter(c=>c.id===selected) : children;

  const chartData = dates.map(date => {
    const row = { date: fmtDate(date) };
    children.forEach(c => {
      const s = stats[date]?.[c.id];
      row[`c_${c.id}`] = s && s.total>0 ? Math.round(s.done/s.total*100) : null;
    });
    return row;
  });

  const getSummary = (cid) => Object.entries(stats).sort(([a],[b])=>a>b?1:-1).map(([date,ds]) => {
    const s=ds[cid]; if(!s||!s.total) return null;
    const pct=Math.round(s.done/s.total*100);
    return { date, pct, done:s.done, total:s.total, medal:getMedal(pct) };
  }).filter(Boolean);

  const getAvg = (cid) => { const r=getSummary(cid); return r.length?Math.round(r.reduce((s,x)=>s+x.pct,0)/r.length):0; };
  const getStreak = (cid) => { const r=getSummary(cid); let s=0; for(let j=r.length-1;j>=0;j--){ if(r[j].pct>=60)s++; else break; } return s; };

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",fontFamily:"'Nunito',sans-serif",padding:"1.5rem 1rem 3rem",color:"white" }}>
      <style>{CSS}</style>
      <div style={{ display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.8rem",flexWrap:"wrap" }}>
        <button className="btn" onClick={onBack} style={{ background:"rgba(255,255,255,.15)",color:"white",padding:".5rem 1rem",fontSize:".9rem" }}>← Voltar</button>
        <div>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"clamp(1.6rem,5vw,2.4rem)" }}>📊 Histórico de Desempenho</div>
          <div style={{ color:"rgba(255,255,255,.6)",fontSize:".85rem",fontWeight:600 }}>{Object.keys(stats).length} dias registrados</div>
        </div>
      </div>
      {loading ? <div style={{ textAlign:"center",padding:"4rem" }}><Spinner /></div> : Object.keys(stats).length===0 ? (
        <div style={{ textAlign:"center",padding:"4rem",color:"rgba(255,255,255,.5)" }}>
          <div style={{ fontSize:"3rem",marginBottom:"1rem" }}>📭</div>
          <div style={{ fontSize:"1.1rem",fontWeight:700 }}>Nenhum histórico ainda.</div>
          <div style={{ fontSize:".9rem",marginTop:".4rem" }}>Complete as tarefas e salve o dia para começar!</div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex",gap:".5rem",flexWrap:"wrap",marginBottom:"1.2rem",alignItems:"center" }}>
            <span style={{ color:"rgba(255,255,255,.6)",fontSize:".8rem",fontWeight:700 }}>Filtrar:</span>
            <span className="child-pill" onClick={() => setSelected(null)} style={{ background:selected===null?"white":"transparent",color:selected===null?"#333":"rgba(255,255,255,.7)",borderColor:"rgba(255,255,255,.3)" }}>Todos</span>
            {children.map(c => (
              <span key={c.id} className="child-pill" onClick={() => setSelected(selected===c.id?null:c.id)} style={{ background:selected===c.id?c.color:"transparent",color:selected===c.id?"white":"rgba(255,255,255,.7)",borderColor:selected===c.id?c.color:"rgba(255,255,255,.3)" }}>{c.emoji} {c.name}</span>
            ))}
          </div>
          <div style={{ display:"flex",gap:".4rem",marginBottom:"1.4rem" }}>
            {[["chart","📈 Gráfico"],["table","📋 Tabela"]].map(([v,l]) => (
              <button key={v} className="tab-btn" onClick={() => setView(v)} style={{ background:view===v?"white":"rgba(255,255,255,.12)",color:view===v?"#333":"white" }}>{l}</button>
            ))}
          </div>
          {view==="chart" && (
            <div style={{ background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"1.2rem",marginBottom:"1.5rem" }}>
              <div style={{ fontWeight:800,marginBottom:"1rem",fontSize:".9rem",color:"rgba(255,255,255,.8)" }}>Desempenho (%) — últimos {dates.length} dias</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top:5,right:10,left:-20,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" />
                  <XAxis dataKey="date" tick={{ fill:"rgba(255,255,255,.6)",fontSize:11 }} />
                  <YAxis domain={[0,100]} tick={{ fill:"rgba(255,255,255,.6)",fontSize:11 }} tickFormatter={v=>`${v}%`} />
                  <Tooltip contentStyle={{ background:"#1a1a2e",border:"1px solid rgba(255,255,255,.2)",borderRadius:"12px",fontFamily:"'Nunito',sans-serif" }} labelStyle={{ color:"white",fontWeight:800 }} formatter={(v,name)=>[v!=null?`${v}%`:"—",name]} />
                  <Legend wrapperStyle={{ color:"rgba(255,255,255,.7)",fontFamily:"'Nunito',sans-serif",fontSize:"12px" }} />
                  {toShow.map(c => <Line key={c.id} type="monotone" dataKey={`c_${c.id}`} name={`${c.emoji} ${c.name}`} stroke={c.color} strokeWidth={2.5} dot={{ r:4,fill:c.color,stroke:"white",strokeWidth:2 }} activeDot={{ r:6 }} connectNulls />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {view==="table" && (
            <div style={{ background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"1.2rem",marginBottom:"1.5rem",overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"'Nunito',sans-serif",fontSize:".82rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left",padding:".5rem .7rem",color:"rgba(255,255,255,.5)",fontWeight:800,borderBottom:"1px solid rgba(255,255,255,.1)" }}>Data</th>
                    {toShow.map(c => <th key={c.id} style={{ textAlign:"center",padding:".5rem .7rem",color:c.color,fontWeight:800,borderBottom:"1px solid rgba(255,255,255,.1)",whiteSpace:"nowrap" }}>{c.emoji} {c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(stats).sort((a,b)=>b>a?1:-1).map((date,ri) => (
                    <tr key={date} style={{ background:ri%2===0?"transparent":"rgba(255,255,255,.03)" }}>
                      <td style={{ padding:".5rem .7rem",color:"rgba(255,255,255,.8)",fontWeight:700,whiteSpace:"nowrap" }}>{fmtDate(date)}</td>
                      {toShow.map(c => {
                        const s=stats[date]?.[c.id];
                        if(!s||!s.total) return <td key={c.id} style={{ textAlign:"center",padding:".5rem .7rem",color:"rgba(255,255,255,.2)" }}>—</td>;
                        const pct=Math.round(s.done/s.total*100); const medal=getMedal(pct);
                        return <td key={c.id} style={{ textAlign:"center",padding:".5rem .7rem" }}><span style={{ fontWeight:800,color:pct===100?"#FFD700":pct>=80?"#C0C0C0":pct>=60?"#CD7F32":"rgba(255,255,255,.6)" }}>{medal?.icon} {pct}%</span><div style={{ fontSize:".7rem",color:"rgba(255,255,255,.35)" }}>{s.done}/{s.total}</div></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.2rem",marginBottom:"1rem" }}>🏆 Resumo por Criança</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:".8rem" }}>
            {toShow.map((c,i) => {
              const avg=getAvg(c.id), best=getSummary(c.id).reduce((b,r)=>r.pct>b?r.pct:b,0), streak=getStreak(c.id), days=getSummary(c.id).length;
              return (
                <div key={c.id} className="summary-card" style={{ animationDelay:`${i*.07}s` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:".6rem",marginBottom:".7rem" }}>
                    <span style={{ fontSize:"1.7rem" }}>{c.emoji}</span>
                    <div><div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1rem" }}>{c.name}</div><div style={{ fontSize:".72rem",color:"rgba(255,255,255,.5)",fontWeight:700 }}>{days} dias</div></div>
                    {getMedal(avg) && <div style={{ marginLeft:"auto",fontSize:"1.3rem" }}>{getMedal(avg).icon}</div>}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:".4rem",textAlign:"center" }}>
                    {[{ label:"Média",value:`${avg}%`,color:c.color },{ label:"Melhor",value:`${best}%`,color:"#FFD700" },{ label:"Sequência",value:`${streak}d 🔥`,color:"#FF6B6B" }].map(st => (
                      <div key={st.label} style={{ background:"rgba(0,0,0,.2)",borderRadius:"10px",padding:".4rem .3rem" }}>
                        <div style={{ fontSize:".65rem",color:"rgba(255,255,255,.4)",fontWeight:800,marginBottom:"2px",textTransform:"uppercase" }}>{st.label}</div>
                        <div style={{ fontSize:".9rem",fontWeight:900,color:st.color }}>{st.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:".7rem",height:6,borderRadius:99,background:"rgba(255,255,255,.1)",overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:99,width:`${avg}%`,background:`linear-gradient(90deg,${c.color}88,${c.color})`,transition:"width .6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken]       = useState(() => sessionStorage.getItem("supa_token")||"");
  const [screen, setScreen]     = useState("today");
  const [loading, setLoading]   = useState(true);
  const [familyId, setFamilyId] = useState(null);
  const [children, setChildren] = useState([]);
  const [tasksByChild, setTasksByChild] = useState({});
  const [checked, setChecked]   = useState({});
  const [savedToday, setSavedToday] = useState(false);
  const [saveFlash, setSaveFlash]   = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [savingDay, setSavingDay]   = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [addChildModal, setAddChildModal] = useState(false);
  const [editChildData, setEditChildData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAuth = (tok) => { sessionStorage.setItem("supa_token", tok); setToken(tok); };
  const handleLogout = async () => { await supa.signOut(token); sessionStorage.removeItem("supa_token"); setToken(""); setFamilyId(null); setChildren([]); };

  const loadAll = useCallback(async (tok) => {
    setLoading(true);
    try {
let fams = await supa.get(tok, "families", "select=id");
      if (!Array.isArray(fams) || !fams.length) {
        const created = await supa.post(tok, "families", { user_id: (await supa.getUser(tok)).id });
        fams = Array.isArray(created)?created:[created];
      }
      const fid = fams[0].id; setFamilyId(fid);
      const kids = await supa.get(tok, "children", `family_id=eq.${fid}&order=position.asc`);
      const kidsArr = Array.isArray(kids)?kids:[];
      setChildren(kidsArr);
      if (kidsArr.length) {
        const ids = kidsArr.map(c=>c.id);
        const allTasks = await supa.get(tok, "tasks", `child_id=in.(${ids.join(",")})&order=position.asc`);
        const taskMap = {}; kidsArr.forEach(c => { taskMap[c.id]=[]; });
        (Array.isArray(allTasks)?allTasks:[]).forEach(t => { if(taskMap[t.child_id]) taskMap[t.child_id].push(t); });
        setTasksByChild(taskMap);
        const recs = await supa.get(tok, "daily_records", `child_id=in.(${ids.join(",")})&date=eq.${TODAY}`);
        const chk={}; kidsArr.forEach(c => { chk[c.id]={}; });
        (Array.isArray(recs)?recs:[]).forEach(r => { if(chk[r.child_id]) chk[r.child_id][r.task_id]=r.completed; });
        setChecked(chk); setSavedToday(Array.isArray(recs)&&recs.length>0);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (token) loadAll(token); else setLoading(false); }, [token]);

  const toggle = async (cid, tid) => {
    const cur = !!checked[cid]?.[tid];
    setChecked(p => ({ ...p, [cid]:{ ...p[cid], [tid]:!cur } }));
    await supa.upsert(token, "daily_records", { child_id:cid, task_id:tid, date:TODAY, completed:!cur }, "child_id,date,task_id");
    setSavedToday(true);
  };

  const getPct = (cid) => { const ts=tasksByChild[cid]||[]; if(!ts.length) return 0; return Math.round(ts.filter(t=>checked[cid]?.[t.id]).length/ts.length*100); };

  const handleSaveDay = async () => {
    setSavingDay(true);
    const ops = [];
    children.forEach(c => { (tasksByChild[c.id]||[]).forEach(t => { ops.push(supa.upsert(token,"daily_records",{ child_id:c.id,task_id:t.id,date:TODAY,completed:!!checked[c.id]?.[t.id] },"child_id,date,task_id")); }); });
    await Promise.all(ops);
    setSavingDay(false); setSavedToday(true); setSaveFlash(true); setTimeout(()=>setSaveFlash(false),2200);
  };

  const handleReset = async () => {
    const ids=children.map(c=>c.id);
    if(ids.length) await supa.delete(token,"daily_records",`child_id=in.(${ids.join(",")})&date=eq.${TODAY}`);
    const chk={}; children.forEach(c=>{chk[c.id]={};});
    setChecked(chk); setSavedToday(false); setResetConfirm(false);
  };

  const handleDeleteChild = async (cid) => { await supa.delete(token,"children",`id=eq.${cid}`); setDeleteConfirm(null); loadAll(token); };

  if (!token) return <AuthScreen onAuth={handleAuth} />;
  if (screen==="history") return <><style>{CSS}</style><HistoryView token={token} children={children} onBack={() => setScreen("today")} /></>;
  if (loading) return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem" }}>
      <style>{CSS}</style><Spinner size={40} /><div style={{ color:"white",fontFamily:"'Fredoka One',cursive",fontSize:"1.3rem" }}>Carregando...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)",fontFamily:"'Nunito',sans-serif",padding:"1.5rem 1rem 3rem" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center",marginBottom:"1.7rem" }}>
        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:".5rem" }}>
          <button className="btn" onClick={handleLogout} style={{ background:"rgba(255,255,255,.15)",color:"white",padding:".3rem .8rem",fontSize:".78rem" }}>Sair 👋</button>
        </div>
        <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"clamp(2rem,6vw,3rem)",color:"white",textShadow:"0 3px 12px rgba(0,0,0,.25)" }}>🏠 Tarefas da Casa</div>
        <div style={{ color:"rgba(255,255,255,.85)",fontSize:"1rem",marginTop:".3rem",fontWeight:600 }}>📅 {fmtDate(TODAY)}</div>
        <div style={{ marginTop:"1rem",display:"flex",gap:".6rem",justifyContent:"center",flexWrap:"wrap" }}>
          <button className="btn" onClick={handleSaveDay} disabled={savingDay} style={{ background:saveFlash?"#27ae60":savedToday?"rgba(39,174,96,.7)":"rgba(39,174,96,.9)",color:"white",padding:".5rem 1.2rem",fontSize:".9rem",display:"flex",alignItems:"center",gap:".5rem" }}>
            {savingDay?<Spinner size={16}/>:(savedToday?"✅ Salvo!":"💾 Salvar dia")}
          </button>
          <button className="btn" onClick={() => setScreen("history")} style={{ background:"rgba(255,255,255,.2)",color:"white",padding:".5rem 1.2rem",fontSize:".9rem" }}>📊 Histórico</button>
          <button className="btn" onClick={() => { setEditChildData(null); setAddChildModal(true); }} style={{ background:"rgba(255,255,255,.2)",color:"white",padding:".5rem 1.2rem",fontSize:".9rem" }}>➕ Criança</button>
          <button className="btn" onClick={() => setResetConfirm(true)} style={{ background:"rgba(255,100,100,.3)",color:"white",padding:".5rem 1rem",fontSize:".9rem" }}>🔄 Reiniciar</button>
        </div>
        {resetConfirm && (
          <div style={{ marginTop:".8rem",background:"rgba(255,255,255,.2)",borderRadius:"14px",padding:".8rem 1.2rem",display:"inline-block" }}>
            <span style={{ color:"white",fontWeight:700,marginRight:".7rem" }}>Apagar todos os checks de hoje?</span>
            <button className="btn" onClick={handleReset} style={{ background:"#FF6B6B",color:"white",padding:".3rem .9rem",fontSize:".85rem",marginRight:".4rem" }}>Sim!</button>
            <button className="btn" onClick={() => setResetConfirm(false)} style={{ background:"rgba(255,255,255,.3)",color:"white",padding:".3rem .9rem",fontSize:".85rem" }}>Cancelar</button>
          </div>
        )}
      </div>
      <div style={{ display:"flex",gap:".7rem",justifyContent:"center",marginBottom:"1.5rem",flexWrap:"wrap" }}>
        {[{ icon:"🥇",label:"Ouro — 100%" },{ icon:"🥈",label:"Prata — 80%+" },{ icon:"🥉",label:"Bronze — 60%+" }].map(m => (
          <div key={m.label} style={{ background:"rgba(255,255,255,.2)",borderRadius:"99px",padding:"4px 14px",color:"white",fontSize:".82rem",fontWeight:700,display:"flex",alignItems:"center",gap:"5px" }}>{m.icon} {m.label}</div>
        ))}
      </div>
      {children.length===0 && (
        <div style={{ textAlign:"center",padding:"3rem 1rem",color:"rgba(255,255,255,.7)" }}>
          <div style={{ fontSize:"3.5rem",marginBottom:"1rem" }}>👨‍👩‍👧‍👦</div>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.4rem",marginBottom:".5rem" }}>Sua família está vazia!</div>
          <div style={{ fontSize:".9rem",marginBottom:"1.5rem" }}>Adicione suas crianças para começar.</div>
          <button className="btn" onClick={() => setAddChildModal(true)} style={{ background:"white",color:"#667eea",padding:".7rem 1.8rem",fontSize:"1rem" }}>➕ Adicionar primeira criança</button>
        </div>
      )}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1.2rem",maxWidth:"1400px",margin:"0 auto" }}>
        {children.map((child,ci) => {
          const tasks=tasksByChild[child.id]||[], pct=getPct(child.id), medal=getMedal(pct), done=tasks.filter(t=>checked[child.id]?.[t.id]).length, isParty=pct===100&&tasks.length>0;
          return (
            <div key={child.id} className={`child-card${isParty?" party":""}`} style={{ animationDelay:`${ci*.07}s` }}>
              <div style={{ background:`linear-gradient(135deg,${child.color},${child.color}cc)`,padding:"1rem 1.1rem .9rem",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:".55rem",minWidth:0 }}>
                  <span style={{ fontSize:"2rem",flexShrink:0 }}>{child.emoji}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1.1rem",color:"white",textShadow:"0 1px 4px rgba(0,0,0,.2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"130px" }}>{child.name}</div>
                    <div style={{ display:"flex",gap:"4px",marginTop:"4px",flexWrap:"wrap" }}>
                      <button className="edit-btn" onClick={() => setEditingChild(child.id)}>✏️ Tarefas</button>
                      <button className="edit-btn" onClick={() => { setEditChildData(child); setAddChildModal(true); }}>🎨 Editar</button>
                      <button className="edit-btn" onClick={() => setDeleteConfirm(child.id)} style={{ background:"rgba(255,100,100,.35)" }}>🗑️</button>
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink:0,textAlign:"right" }}>
                  {medal?<div style={{ background:medal.bg,border:`2px solid ${medal.border}`,borderRadius:"12px",padding:"3px 10px",fontSize:".8rem",fontWeight:800,color:medal.color,display:"inline-flex",alignItems:"center",gap:"4px" }}>{medal.icon} {medal.label}</div>:<div style={{ color:"rgba(255,255,255,.8)",fontSize:".78rem",fontWeight:700 }}>{done}/{tasks.length}<br/><span style={{ fontSize:".68rem" }}>tarefas</span></div>}
                </div>
              </div>
              <div style={{ padding:".65rem 1.1rem .2rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:".73rem",color:"#999",fontWeight:700,marginBottom:"3px" }}><span>{done} de {tasks.length} concluídas</span><span style={{ color:child.color }}>{pct}%</span></div>
                <div style={{ height:9,borderRadius:99,background:"#EEE",overflow:"hidden" }}>
                  <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:isParty?"linear-gradient(90deg,#FFD700,#FFA500,#FFD700)":`linear-gradient(90deg,${child.color}88,${child.color})`,backgroundSize:isParty?"200% auto":"auto",animation:isParty?"shimmer 2s linear infinite":"none",transition:"width .5s cubic-bezier(.34,1.56,.64,1)" }} />
                </div>
              </div>
              <div style={{ padding:".6rem 1rem .8rem" }}>
                {tasks.length===0?<div style={{ textAlign:"center",color:"#ccc",fontSize:".85rem",padding:"1.2rem 0" }}>Sem tarefas ainda.<br/><span style={{ cursor:"pointer",color:child.color,fontWeight:800 }} onClick={() => setEditingChild(child.id)}>✏️ Clique para adicionar!</span></div>:tasks.map(task => {
                  const isDone=!!checked[child.id]?.[task.id];
                  return (
                    <div key={task.id} className={`task-row${isDone?" done":""}`} onClick={() => toggle(child.id,task.id)} style={{ background:isDone?child.light:"#F7F7F7",borderColor:isDone?child.color:"#E8E8E8" }}>
                      <div style={{ width:22,height:22,borderRadius:7,flexShrink:0,border:`2.5px solid ${isDone?child.color:"#CCC"}`,background:isDone?child.color:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s" }}>{isDone&&<span style={{ color:"white",fontSize:".72rem",fontWeight:900 }}>✓</span>}</div>
                      <span style={{ fontSize:"1rem",flexShrink:0 }}>{task.icon}</span>
                      <span style={{ fontSize:".86rem",fontWeight:700,color:isDone?child.color:"#555",textDecoration:isDone?"line-through":"none",opacity:isDone?.75:1,transition:"all .2s",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.label}</span>
                    </div>
                  );
                })}
              </div>
              {isParty&&<div style={{ margin:"0 1rem 1rem",background:"linear-gradient(135deg,#FFF9E0,#FFF0A0)",border:"2px solid #FFD700",borderRadius:"14px",padding:".65rem",textAlign:"center" }}><div style={{ fontFamily:"'Fredoka One',cursive",fontSize:"1rem",color:"#B8860B" }}>🎉 Incrível! Tudo feito! 🎉</div><div style={{ fontSize:"1.5rem",marginTop:"2px",letterSpacing:"4px" }}>⭐⭐⭐</div></div>}
            </div>
          );
        })}
      </div>
      {addChildModal&&<AddChildModal token={token} familyId={familyId} editChild={editChildData} onClose={() => { setAddChildModal(false); setEditChildData(null); }} onSaved={() => { setAddChildModal(false); setEditChildData(null); loadAll(token); }} />}
      {editingChild&&<EditTasksModal token={token} child={children.find(c=>c.id===editingChild)} onClose={() => setEditingChild(null)} onSaved={() => { setEditingChild(null); loadAll(token); }} />}
      {deleteConfirm&&(
        <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
          <div style={{ background:"white",borderRadius:"20px",padding:"1.8rem",maxWidth:"340px",width:"100%",textAlign:"center",fontFamily:"'Nunito',sans-serif" }}>
            <div style={{ fontSize:"2.5rem",marginBottom:".5rem" }}>⚠️</div>
            <div style={{ fontWeight:800,fontSize:"1.1rem",marginBottom:".4rem" }}>Remover criança?</div>
            <div style={{ color:"#888",fontSize:".88rem",marginBottom:"1.2rem" }}>Isso vai apagar a criança, todas as tarefas e o histórico dela permanentemente.</div>
            <div style={{ display:"flex",gap:".6rem",justifyContent:"center" }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ background:"#EEE",color:"#666",padding:".55rem 1.1rem" }}>Cancelar</button>
              <button className="btn" onClick={() => handleDeleteChild(deleteConfirm)} style={{ background:"#FF6B6B",color:"white",padding:".55rem 1.3rem" }}>Sim, remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
