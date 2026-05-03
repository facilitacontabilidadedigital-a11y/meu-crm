import { useState, useEffect, useCallback, useRef } from "react";

// ─── FONTS & GLOBAL CSS ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background: #080c14; color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.5; overflow: hidden; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  input:focus, textarea:focus, select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-in { animation: fadeIn 0.2s ease both; }
  .slide-in { animation: slideIn 0.25s ease both; }
  .hover-lift { transition: transform 0.15s, box-shadow 0.15s; }
  .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
`;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:          "#080c14",
  bgMid:       "#0d1220",
  surface:     "#0f1623",
  surfaceHigh: "#141d2e",
  surfaceTop:  "#1a2540",
  border:      "#1e293b",
  borderLight: "#243048",
  accent:      "#3b82f6",
  accentGlow:  "rgba(59,130,246,0.15)",
  accentHover: "#2563eb",
  green:       "#10b981",
  greenDim:    "rgba(16,185,129,0.12)",
  red:         "#ef4444",
  redDim:      "rgba(239,68,68,0.12)",
  yellow:      "#f59e0b",
  yellowDim:   "rgba(245,158,11,0.12)",
  purple:      "#8b5cf6",
  purpleDim:   "rgba(139,92,246,0.12)",
  text:        "#e2e8f0",
  textSub:     "#94a3b8",
  textMuted:   "#475569",
  mono:        "'DM Mono', monospace",
  head:        "'Syne', sans-serif",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const fmt = n => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(n||0);
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const daysAgo = d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : 0;

function useLs(key, init) {
  const [v, sv] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
  return [v, sv];
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_LEADS = [
  { id:"ld1", nome:"Carlos Mendonça", whatsapp:"(11)98001-1001", email:"carlos@merc.com", fonte:"Instagram Ads", utm_campaign:"contabil-maio", tipo_empresa:"Ltda", faturamento_estimado:"50-200k", segmento:"Comércio", regime_tributario_atual:"Simples", tem_contador_atual:true, motivo_troca:"Mal atendimento", servicos_interesse:["Contábil","Fiscal"], numero_funcionarios:8, etapa:"Qualificação (IA)", qualificado_ia:false, score:72, reuniao_agendada:false, data_reuniao:"", responsavel:"Ana Silva", observacoes_ia:"Lead veio via anúncio. Empresa de comércio, Simples Nacional, quer trocar contador por atendimento ruim.", observacoes:"", motivo_perda:"", convertido:false, data_entrada:"2025-04-28", data_ultimo_contato:"2025-04-28", proximo_followup:"2025-05-03" },
  { id:"ld2", nome:"Fernanda Rocha", whatsapp:"(21)97002-2002", email:"fe@clinica.com.br", fonte:"Instagram Ads", utm_campaign:"contabil-abril", tipo_empresa:"ME", faturamento_estimado:"10-50k", segmento:"Saúde", regime_tributario_atual:"Não sabe", tem_contador_atual:false, motivo_troca:"", servicos_interesse:["Contábil","Folha"], numero_funcionarios:3, etapa:"Reunião Agendada", qualificado_ia:true, score:88, reuniao_agendada:true, data_reuniao:"2025-05-05", responsavel:"Pedro Costa", observacoes_ia:"Clínica odontológica, MEI querendo regularizar. Sem contador. Alto potencial.", observacoes:"Muito interessada, marcar reunião online.", motivo_perda:"", convertido:false, data_entrada:"2025-04-25", data_ultimo_contato:"2025-04-30", proximo_followup:"2025-05-05" },
  { id:"ld3", nome:"Grupo Tavares Ltda", whatsapp:"(31)96003-3003", email:"fin@tavares.com", fonte:"Indicação", utm_campaign:"", tipo_empresa:"Ltda", faturamento_estimado:"200k+", segmento:"Indústria", regime_tributario_atual:"Lucro Presumido", tem_contador_atual:true, motivo_troca:"Preço alto", servicos_interesse:["Contábil","Fiscal","Folha","BPO"], numero_funcionarios:45, etapa:"Proposta Enviada", qualificado_ia:true, score:95, reuniao_agendada:true, data_reuniao:"2025-04-22", responsavel:"Ana Silva", observacoes_ia:"Lead de alto valor via indicação. Empresa grande, múltiplos serviços.", observacoes:"Proposta enviada R$4.800/mês. Aguardando resposta.", motivo_perda:"", convertido:false, data_entrada:"2025-04-15", data_ultimo_contato:"2025-04-29", proximo_followup:"2025-05-02" },
  { id:"ld4", nome:"Beatriz Lopes ME", whatsapp:"(11)95004-4004", email:"bea@lopes.com", fonte:"Instagram Ads", utm_campaign:"contabil-maio", tipo_empresa:"MEI", faturamento_estimado:"até 10k", segmento:"Serviços", regime_tributario_atual:"Simples", tem_contador_atual:false, motivo_troca:"", servicos_interesse:["Contábil"], numero_funcionarios:1, etapa:"Perdido", qualificado_ia:true, score:31, reuniao_agendada:false, data_reuniao:"", responsavel:"Pedro Costa", observacoes_ia:"MEI com baixo faturamento. Ticket muito pequeno para operação atual.", observacoes:"", motivo_perda:"Sem interesse", convertido:false, data_entrada:"2025-04-20", data_ultimo_contato:"2025-04-22", proximo_followup:"" },
  { id:"ld5", nome:"TechFlow Soluções", whatsapp:"(11)94005-5005", email:"ceo@techflow.io", fonte:"Instagram Ads", utm_campaign:"contabil-maio", tipo_empresa:"Ltda", faturamento_estimado:"50-200k", segmento:"Tecnologia", regime_tributario_atual:"Simples", tem_contador_atual:true, motivo_troca:"Contador não entende de tech", servicos_interesse:["Contábil","Fiscal","BPO"], numero_funcionarios:12, etapa:"Contato Humano", qualificado_ia:true, score:81, reuniao_agendada:false, data_reuniao:"", responsavel:"Ana Silva", observacoes_ia:"Startup de tecnologia. Contador atual não entende do segmento. Oportunidade.", observacoes:"", motivo_perda:"", convertido:false, data_entrada:"2025-05-01", data_ultimo_contato:"2025-05-01", proximo_followup:"2025-05-04" },
];

const SEED_CLIENTS = [
  { id:"cl1", lead_id:"", razao_social:"Empresa Alpha Distribuidora Ltda", nome_fantasia:"Alpha Dist.", cnpj:"12.345.678/0001-90", cpf_socio:"111.222.333-44", ie:"123456789", im:"987654", regime:"Simples Nacional", porte:"ME", segmento:"Comércio", data_abertura:"2019-03-15", numero_funcionarios:6, faturamento_medio:35000, email:"fin@alpha.com.br", whatsapp_fin:"(11)99111-1111", whatsapp_socio:"(11)99111-0000", endereco:"Rua das Flores, 123 - SP", status:"Ativo", data_entrada:"2023-02-01", responsavel:"Ana Silva", asaas_id:"", nf_automatica:true, nivel_risco:"Baixo", observacoes:"Cliente antigo, sempre pontual.", valor_mensalidade:2500, servicos:["Contábil","Fiscal","Folha"] },
  { id:"cl2", lead_id:"", razao_social:"Beta Comercial S/A", nome_fantasia:"Beta Com.", cnpj:"98.765.432/0001-10", cpf_socio:"555.666.777-88", ie:"", im:"", regime:"Lucro Presumido", porte:"EPP", segmento:"Atacado", data_abertura:"2015-07-20", numero_funcionarios:22, faturamento_medio:180000, email:"dir@beta.com", whatsapp_fin:"(21)98222-2222", whatsapp_socio:"(21)98222-1111", endereco:"Av. Central, 456 - RJ", status:"Inadimplente", data_entrada:"2022-06-15", responsavel:"Pedro Costa", asaas_id:"", nf_automatica:true, nivel_risco:"Alto", observacoes:"Inadimplente há 2 meses. Contato difícil.", valor_mensalidade:4200, servicos:["Contábil","Fiscal","Folha","BPO"] },
  { id:"cl3", lead_id:"", razao_social:"Gamma Serviços Digitais ME", nome_fantasia:"Gamma Digital", cnpj:"11.222.333/0001-44", cpf_socio:"222.333.444-55", ie:"", im:"654321", regime:"Simples Nacional", porte:"MEI", segmento:"Tecnologia", data_abertura:"2021-11-10", numero_funcionarios:2, faturamento_medio:12000, email:"oi@gamma.dev", whatsapp_fin:"(31)97333-3333", whatsapp_socio:"(31)97333-0000", endereco:"Rua Tech, 789 - BH", status:"Ativo", data_entrada:"2024-01-10", responsavel:"Ana Silva", asaas_id:"", nf_automatica:false, nivel_risco:"Baixo", observacoes:"", valor_mensalidade:900, servicos:["Contábil"] },
  { id:"cl4", lead_id:"", razao_social:"Delta Indústria e Comércio EIRELI", nome_fantasia:"Delta IC", cnpj:"44.555.666/0001-77", cpf_socio:"333.444.555-66", ie:"444555666", im:"111222", regime:"Lucro Presumido", porte:"EPP", segmento:"Indústria", data_abertura:"2010-05-05", numero_funcionarios:38, faturamento_medio:320000, email:"cfo@delta.com.br", whatsapp_fin:"(11)96444-4444", whatsapp_socio:"(11)96444-0000", endereco:"Rod. SP-310, km 45 - SP", status:"Ativo", data_entrada:"2021-09-01", responsavel:"Pedro Costa", asaas_id:"", nf_automatica:true, nivel_risco:"Médio", observacoes:"Contrato anual. Reajuste em setembro.", valor_mensalidade:5800, servicos:["Contábil","Fiscal","Folha","BPO"] },
];

const SEED_CONTRATOS = [
  { id:"ct1", cliente_id:"cl1", servicos:["Contábil","Fiscal","Folha"], valor:2500, setup:0, dia_vencimento:5, periodicidade:"Mensal", data_inicio:"2023-02-01", data_fim:"", reajuste:"IPCA", status:"Ativo", arquivo:"", assinado_em:"2023-01-28", canal:"Digital", observacoes:"" },
  { id:"ct2", cliente_id:"cl2", servicos:["Contábil","Fiscal","Folha","BPO"], valor:4200, setup:500, dia_vencimento:10, periodicidade:"Mensal", data_inicio:"2022-06-15", data_fim:"", reajuste:"IGP-M", status:"Ativo", arquivo:"", assinado_em:"2022-06-10", canal:"Físico", observacoes:"Setup pago no primeiro mês." },
  { id:"ct3", cliente_id:"cl3", servicos:["Contábil"], valor:900, setup:0, dia_vencimento:15, periodicidade:"Mensal", data_inicio:"2024-01-10", data_fim:"", reajuste:"IPCA", status:"Ativo", arquivo:"", assinado_em:"2024-01-08", canal:"WhatsApp", observacoes:"" },
  { id:"ct4", cliente_id:"cl4", servicos:["Contábil","Fiscal","Folha","BPO"], valor:5800, setup:1000, dia_vencimento:1, periodicidade:"Mensal", data_inicio:"2021-09-01", data_fim:"", reajuste:"IPCA", status:"Ativo", arquivo:"", assinado_em:"2021-08-25", canal:"Digital", observacoes:"" },
];


const SEED_FINANCEIRO = [
  { id:"fn1", cliente_id:"cl1", contrato_id:"ct1", tipo:"Mensalidade", valor:2500, vencimento:"2025-05-05", status:"Pago", forma:"PIX", data_pagamento:"2025-05-04", nf_emitida:true, nf_numero:"NF-0234", dias_atraso:0, tentativas:0, obs:"" },
  { id:"fn2", cliente_id:"cl2", contrato_id:"ct2", tipo:"Mensalidade", valor:4200, vencimento:"2025-04-10", status:"Vencido", forma:"Boleto", data_pagamento:"", nf_emitida:true, nf_numero:"NF-0218", dias_atraso:22, tentativas:3, obs:"3ª tentativa sem resposta." },
  { id:"fn3", cliente_id:"cl2", contrato_id:"ct2", tipo:"Mensalidade", valor:4200, vencimento:"2025-03-10", status:"Vencido", forma:"Boleto", data_pagamento:"", nf_emitida:true, nf_numero:"NF-0201", dias_atraso:52, tentativas:5, obs:"Em processo de cobrança." },
  { id:"fn4", cliente_id:"cl3", contrato_id:"ct3", tipo:"Mensalidade", valor:900, vencimento:"2025-05-15", status:"Aguardando", forma:"PIX", data_pagamento:"", nf_emitida:false, nf_numero:"", dias_atraso:0, tentativas:0, obs:"" },
  { id:"fn5", cliente_id:"cl4", contrato_id:"ct4", tipo:"Mensalidade", valor:5800, vencimento:"2025-05-01", status:"Pago", forma:"Cartão", data_pagamento:"2025-05-01", nf_emitida:true, nf_numero:"NF-0230", dias_atraso:0, tentativas:0, obs:"" },
  { id:"fn6", cliente_id:"cl1", contrato_id:"ct1", tipo:"Mensalidade", valor:2500, vencimento:"2025-04-05", status:"Pago", forma:"PIX", data_pagamento:"2025-04-04", nf_emitida:true, nf_numero:"NF-0210", dias_atraso:0, tentativas:0, obs:"" },
];

const SEED_TICKETS = [
  { id:"tk1", cliente_id:"cl2", lead_id:"", canal:"WhatsApp", tipo:"Reclamação", assunto:"Cobrança duplicada em abril", descricao:"Cliente alega ter sido cobrado duas vezes no mês de abril. Verificar no Asaas.", prioridade:"Alta", status:"Em andamento", responsavel:"Pedro Costa", data_abertura:"2025-04-30", data_resolucao:"", sla_horas:8, avaliacao:"", historico:"30/04 - Aberto automaticamente.\n01/05 - Pedro iniciou análise.\n02/05 - Aguardando extrato do Asaas." },
  { id:"tk2", cliente_id:"cl1", lead_id:"", canal:"WhatsApp", tipo:"Dúvida", assunto:"Prazo SPED Contábil 2024", descricao:"Cliente pergunta sobre prazo de entrega do SPED Contábil anual.", prioridade:"Média", status:"Resolvido", responsavel:"Ana Silva", data_abertura:"2025-04-15", data_resolucao:"2025-04-15", sla_horas:24, avaliacao:5, historico:"15/04 - Aberto via WhatsApp.\n15/04 - Ana respondeu: prazo é 30/06/2025." },
  { id:"tk3", cliente_id:"cl4", lead_id:"", canal:"E-mail", tipo:"Solicitação", assunto:"Relatório de DRE trimestral", descricao:"Diretor financeiro solicitou DRE do 1º trimestre 2025.", prioridade:"Média", status:"Aberto", responsavel:"Pedro Costa", data_abertura:"2025-05-02", data_resolucao:"", sla_horas:48, avaliacao:"", historico:"02/05 - Solicitação recebida por e-mail." },
];

const SEED_DOCS = [
  { id:"dc1", cliente_id:"cl1", tipo:"Contrato Social", nome:"Contrato Social Alpha - 2019", arquivo:"contrato_social_alpha.pdf", data_upload:"2023-02-01", enviado_por:"Ana Silva", validade:"", status:"Válido" },
  { id:"dc2", cliente_id:"cl1", tipo:"Certidão", nome:"CND Federal - Alpha", arquivo:"cnd_alpha.pdf", data_upload:"2025-01-10", enviado_por:"Ana Silva", validade:"2025-07-10", status:"Válido" },
  { id:"dc3", cliente_id:"cl2", tipo:"Contrato Social", nome:"Contrato Social Beta", arquivo:"cs_beta.pdf", data_upload:"2022-06-15", enviado_por:"Pedro Costa", validade:"", status:"Válido" },
  { id:"dc4", cliente_id:"cl2", tipo:"Certidão", nome:"CND Federal - Beta", arquivo:"cnd_beta.pdf", data_upload:"2024-08-20", enviado_por:"Pedro Costa", validade:"2025-02-20", status:"Vencido" },
];

const PIPELINE_STAGES = ["Novo Lead","Qualificação (IA)","Contato Humano","Reunião Agendada","Reunião Realizada","Proposta Enviada","Negociação","Contrato Assinado","Perdido"];
const ACTIVE_STAGES = PIPELINE_STAGES.filter(s => s !== "Perdido" && s !== "Contrato Assinado");

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Badge({ color="gray", size="sm", dot=false, children }) {
  const map = {
    green:  { bg: T.greenDim,  text: T.green,  border: T.green+"33" },
    red:    { bg: T.redDim,    text: T.red,    border: T.red+"33" },
    yellow: { bg: T.yellowDim, text: T.yellow, border: T.yellow+"33" },
    blue:   { bg: T.accentGlow,text: T.accent, border: T.accent+"33" },
    purple: { bg: T.purpleDim, text: T.purple, border: T.purple+"33" },
    gray:   { bg: "#ffffff08",  text: T.textSub, border: "#ffffff15" },
  };
  const c = map[color]||map.gray;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, color:c.text, border:`1px solid ${c.border}`, borderRadius:20, padding: size==="sm" ? "2px 9px" : "4px 12px", fontSize: size==="sm" ? 11 : 12, fontWeight:600, whiteSpace:"nowrap" }}>
      {dot && <span style={{ width:5, height:5, borderRadius:"50%", background:c.text, display:"inline-block" }} />}
      {children}
    </span>
  );
}

function Btn({ onClick, variant="primary", size="md", disabled, children, style={} }) {
  const [hov, setHov] = useState(false);
  const variants = {
    primary: { bg: hov ? T.accentHover : T.accent, color:"#fff", border:"none" },
    ghost:   { bg: hov ? T.surfaceTop : "transparent", color: T.textSub, border:`1px solid ${hov ? T.borderLight : T.border}` },
    danger:  { bg: hov ? "#dc2626" : T.redDim, color: T.red, border:`1px solid ${T.red}33` },
    success: { bg: hov ? "#059669" : T.greenDim, color: T.green, border:`1px solid ${T.green}33` },
    soft:    { bg: hov ? T.surfaceTop : T.surfaceHigh, color: T.text, border:`1px solid ${T.border}` },
  };
  const sizes = { sm:{padding:"5px 12px",fontSize:12}, md:{padding:"8px 16px",fontSize:13}, lg:{padding:"11px 22px",fontSize:14} };
  const v = variants[variant]||variants.primary;
  const s = sizes[size];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ ...s, background:v.bg, color:v.color, border:v.border, borderRadius:8, fontWeight:600, transition:"all 0.15s", opacity:disabled?0.45:1, cursor:disabled?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", gap:6, ...style }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type="text", placeholder="", required, options, multi, rows }) {
  const id = useRef(uid());
  const inputStyle = { background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", width:"100%", fontSize:13 };
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label htmlFor={id.current} style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:5, letterSpacing:"0.03em" }}>{label}{required&&<span style={{color:T.red}}>*</span>}</label>}
      {options ? (
        <select id={id.current} value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}>
          {options.map(o=>typeof o==="string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : rows ? (
        <textarea id={id.current} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...inputStyle,resize:"vertical"}} />
      ) : (
        <input id={id.current} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, width=580 }) {
  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
      <div className="fade-up" onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.borderLight}`, borderRadius:16, width:"100%", maxWidth:width, maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontFamily:T.head, fontWeight:700, fontSize:17 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.textMuted, fontSize:22, lineHeight:1, cursor:"pointer", padding:"0 4px" }}>×</button>
        </div>
        <div style={{ padding:24, overflowY:"auto" }}>{children}</div>
      </div>
    </div>
  );
}

function Confirm({ open, msg, onOk, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title="Confirmar ação" width={400}>
      <p style={{ color:T.textSub, marginBottom:24 }}>{msg}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onOk}>Confirmar</Btn>
      </div>
    </Modal>
  );
}

function Card({ children, style={}, className="" }) {
  return <div className={className} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, ...style }}>{children}</div>;
}

function StatCard({ icon, label, value, sub, color=T.accent, trend }) {
  return (
    <Card className="hover-lift" style={{ padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
        {trend && <span style={{ fontSize:11, color: trend>0?T.green:T.red, fontWeight:600 }}>{trend>0?"+":""}{trend}%</span>}
      </div>
      <div style={{ fontFamily:T.mono, fontSize:24, fontWeight:500, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted }}>{sub}</div>}
    </Card>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:2, background:T.bgMid, borderRadius:10, padding:3, border:`1px solid ${T.border}` }}>
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)}
          style={{ padding:"7px 16px", borderRadius:8, border:"none", background: active===t ? T.surfaceTop : "transparent", color: active===t ? T.text : T.textMuted, fontWeight: active===t ? 600 : 400, fontSize:13, transition:"all 0.15s", cursor:"pointer" }}>
          {t}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontFamily:T.head, fontWeight:700, fontSize:16, marginBottom:6 }}>{title}</div>
      <div style={{ color:T.textMuted, fontSize:13, marginBottom:action?20:0 }}>{sub}</div>
      {action}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard", icon:"⬡", label:"Dashboard" },
  { id:"marketing", icon:"📣", label:"Mkt" },
  { id:"leads",     icon:"◎", label:"Leads" },
  { id:"clientes",  icon:"◉", label:"Clientes" },
  { id:"contratos", icon:"◈", label:"Contratos" },
  { id:"financeiro",icon:"◆", label:"Financeiro" },
  { id:"tickets",   icon:"◍", label:"Suporte" },
  { id:"documentos",icon:"◰", label:"Docs" },
  { id:"onboarding",icon:"🚀", label:"Onboard" },
  { id:"cobranca",  icon:"💳", label:"Régua" },
  { id:"relatorios",icon:"📊", label:"Relatórios" },
  { id:"config",    icon:"⚙", label:"Config" },
];

function Sidebar({ active, onNav, alerts }) {
  return (
    <aside style={{ width:68, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 0 16px", position:"fixed", left:0, top:0, bottom:0, zIndex:100, gap:4 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.head, fontWeight:800, fontSize:17, color:"#fff", marginBottom:20, flexShrink:0 }}>C</div>
      {NAV_ITEMS.map(n => {
        const isActive = active === n.id;
        const hasAlert = alerts?.[n.id] > 0;
        return (
          <button key={n.id} onClick={()=>onNav(n.id)} title={n.label}
            style={{ width:48, height:48, borderRadius:12, border:"none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, cursor:"pointer", transition:"all 0.15s", background: isActive ? T.accentGlow : "transparent", color: isActive ? T.accent : T.textMuted, position:"relative", flexShrink:0 }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>
            <span style={{ fontSize:8, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase" }}>{n.label}</span>
            {hasAlert && <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:T.red, border:`1.5px solid ${T.surface}` }} />}
          </button>
        );
      })}
      <div style={{ flex:1 }} />
      <div style={{ width:32, height:32, borderRadius:"50%", background:T.accentGlow, border:`1px solid ${T.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:T.accent, fontWeight:700 }}>A</div>
    </aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ leads, clients, contratos, financeiro, tickets }) {
  const mrr = clients.filter(c=>c.status==="Ativo").reduce((s,c)=>s+c.valor_mensalidade,0);
  const inadimplentes = clients.filter(c=>c.status==="Inadimplente");
  const receitaVencida = financeiro.filter(f=>f.status==="Vencido").reduce((s,f)=>s+f.valor,0);
  const leadsAtivos = leads.filter(l=>!["Perdido","Contrato Assinado"].includes(l.etapa));
  const ticketsAbertos = tickets.filter(t=>t.status!=="Resolvido");
  const taxaConversao = leads.length ? Math.round((leads.filter(l=>l.convertido).length/leads.length)*100) : 0;

  const alertas = [    ...inadimplentes.map(c=>({ tipo:"danger", msg:`${c.razao_social} — inadimplente ${financeiro.filter(f=>f.cliente_id===c.id&&f.status==="Vencido").length} mês(es)`, icon:"💰" })),
    ...tickets.filter(t=>t.prioridade==="Alta"&&t.status!=="Resolvido").map(t=>({ tipo:"yellow", msg:`Ticket urgente: ${t.assunto}`, icon:"🚨" })),
    ...leads.filter(l=>l.proximo_followup&&l.proximo_followup<=today()&&!["Perdido","Contrato Assinado"].includes(l.etapa)).map(l=>({ tipo:"blue", msg:`Follow-up pendente: ${l.nome}`, icon:"📞" })),
  ].slice(0,5);

  const stageFunnel = ACTIVE_STAGES.map(s=>({ s, n:leads.filter(l=>l.etapa===s).length }));

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:T.head, fontSize:26, fontWeight:800, marginBottom:4 }}>Bom dia! 👋</h1>
        <p style={{ color:T.textSub, fontSize:14 }}>Aqui está o panorama da sua operação hoje.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:24 }}>
        <StatCard icon="💰" label="MRR" value={fmt(mrr)} sub={`${clients.filter(c=>c.status==="Ativo").length} clientes ativos`} color={T.accent} />
        <StatCard icon="⚠️" label="Inadimplência" value={fmt(receitaVencida)} sub={`${inadimplentes.length} clientes`} color={T.red} />
        <StatCard icon="🎯" label="Leads Ativos" value={leadsAtivos.length} sub={`${taxaConversao}% taxa conversão`} color={T.purple} />
        <StatCard icon="🎫" label="Tickets" value={ticketsAbertos.length} sub="em aberto" color={T.green} />
        <StatCard icon="📄" label="Contratos Ativos" value={contratos.filter(c=>c.status==="Ativo").length} sub={fmt(contratos.filter(c=>c.status==="Ativo").reduce((s,c)=>s+c.valor,0))} color={T.accent} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.2fr", gap:16, marginBottom:20 }}>
        {/* Alertas */}
        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🔔</span>
            <span style={{ fontFamily:T.head, fontWeight:700, fontSize:14 }}>Alertas do Sistema</span>
            {alertas.length>0 && <Badge color="red">{alertas.length}</Badge>}
          </div>
          <div style={{ padding:16 }}>
            {alertas.length===0
              ? <div style={{ color:T.textMuted, fontSize:13, textAlign:"center", padding:"20px 0" }}>✓ Nenhum alerta hoje</div>
              : alertas.map((a,i)=>(
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", background: a.tipo==="danger"?T.redDim:a.tipo==="yellow"?T.yellowDim:T.accentGlow, borderRadius:8, marginBottom:8, border:`1px solid ${a.tipo==="danger"?T.red+"22":a.tipo==="yellow"?T.yellow+"22":T.accent+"22"}` }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{a.icon}</span>
                  <span style={{ fontSize:12, color: a.tipo==="danger"?T.red:a.tipo==="yellow"?T.yellow:T.accent, lineHeight:1.4 }}>{a.msg}</span>
                </div>
              ))
            }
          </div>
        </Card>

        {/* Funil resumo */}
        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontFamily:T.head, fontWeight:700, fontSize:14 }}>🎯 Funil de Vendas</span>
          </div>
          <div style={{ padding:"12px 16px" }}>
            {stageFunnel.filter(s=>s.n>0).map(({s,n})=>(
              <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:12, color:T.textSub, width:130, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s}</div>
                <div style={{ flex:1, height:6, background:T.bgMid, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:T.accent, borderRadius:3, width:`${Math.min(100,(n/Math.max(1,leadsAtivos.length))*100)}%`, transition:"width 0.5s" }} />
                </div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.accent, width:20, textAlign:"right" }}>{n}</div>
              </div>
            ))}
            {leadsAtivos.length===0 && <div style={{ color:T.textMuted, fontSize:13, textAlign:"center", padding:"20px 0" }}>Sem leads ativos</div>}
          </div>
        </Card>
      </div>

      {/* Clientes em risco e follow-ups */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontFamily:T.head, fontWeight:700, fontSize:14 }}>🔴 Clientes em Risco</span>
          </div>
          <div style={{ padding:"12px 16px" }}>
            {clients.filter(c=>c.nivel_risco==="Alto"||c.status==="Inadimplente").map(c=>(
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}33` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{c.nome_fantasia}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{c.responsavel} · {c.regime}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <Badge color={c.status==="Inadimplente"?"red":c.nivel_risco==="Alto"?"yellow":"gray"}>{c.status==="Inadimplente"?"Inadimplente":`Risco ${c.nivel_risco}`}</Badge>
                  <div style={{ fontSize:12, fontFamily:T.mono, color:T.red, marginTop:2 }}>{fmt(c.valor_mensalidade)}/mês</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontFamily:T.head, fontWeight:700, fontSize:14 }}>📞 Follow-ups Pendentes</span>
          </div>
          <div style={{ padding:"12px 16px" }}>
            {leads.filter(l=>!["Perdido","Contrato Assinado"].includes(l.etapa)&&l.proximo_followup).sort((a,b)=>a.proximo_followup.localeCompare(b.proximo_followup)).slice(0,5).map(l=>(
              <div key={l.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}33` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{l.nome}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{l.etapa} · {l.responsavel}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontFamily:T.mono, color: l.proximo_followup<=today()?T.red:T.textSub }}>{fmtDate(l.proximo_followup)}</div>
                  <Badge color={l.proximo_followup<=today()?"red":"gray"} size="sm">{l.proximo_followup<=today()?"Atrasado":"Agendado"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── LEADS ────────────────────────────────────────────────────────────────────
const statusColor = s => ({ "Novo Lead":"gray","Qualificação (IA)":"purple","Contato Humano":"blue","Reunião Agendada":"blue","Reunião Realizada":"blue","Proposta Enviada":"yellow","Negociação":"yellow","Contrato Assinado":"green","Perdido":"red" })[s]||"gray";
const scoreColor = n => n>=80?T.green:n>=50?T.yellow:T.red;

function LeadForm({ lead={}, onSave, onClose }) {
  const [f, sf] = useState({ nome:"", whatsapp:"", email:"", fonte:"Instagram Ads", utm_campaign:"", tipo_empresa:"ME", faturamento_estimado:"10-50k", segmento:"", regime_tributario_atual:"Simples", tem_contador_atual:false, motivo_troca:"", servicos_interesse:[], etapa:"Novo Lead", score:50, responsavel:"Ana Silva", reuniao_agendada:false, data_reuniao:"", observacoes_ia:"", observacoes:"", proximo_followup:"", ...lead });
  const toggleServico = s => sf(p=>({ ...p, servicos_interesse: p.servicos_interesse.includes(s)?p.servicos_interesse.filter(x=>x!==s):[...p.servicos_interesse,s] }));
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <Input label="Nome / Empresa" required value={f.nome} onChange={v=>sf(p=>({...p,nome:v}))} />
        <Input label="WhatsApp" value={f.whatsapp} onChange={v=>sf(p=>({...p,whatsapp:v}))} placeholder="(11) 99999-9999" />
        <Input label="E-mail" type="email" value={f.email} onChange={v=>sf(p=>({...p,email:v}))} />
        <Input label="Fonte" value={f.fonte} onChange={v=>sf(p=>({...p,fonte:v}))} options={["Instagram Ads","Facebook Ads","Indicação","Google","Orgânico","Outro"]} />
        <Input label="Tipo de Empresa" value={f.tipo_empresa} onChange={v=>sf(p=>({...p,tipo_empresa:v}))} options={["MEI","ME","EPP","Ltda","SA","PF"]} />
        <Input label="Faturamento Estimado" value={f.faturamento_estimado} onChange={v=>sf(p=>({...p,faturamento_estimado:v}))} options={["até 10k","10-50k","50-200k","200k+"]} />
        <Input label="Segmento / Ramo" value={f.segmento} onChange={v=>sf(p=>({...p,segmento:v}))} placeholder="Ex: Comércio, Saúde..." />
        <Input label="Regime Tributário" value={f.regime_tributario_atual} onChange={v=>sf(p=>({...p,regime_tributario_atual:v}))} options={["Simples","Lucro Presumido","Lucro Real","Não sabe"]} />
        <Input label="Etapa do Funil" value={f.etapa} onChange={v=>sf(p=>({...p,etapa:v}))} options={PIPELINE_STAGES} />
        <Input label="Score (0–100)" type="number" value={f.score} onChange={v=>sf(p=>({...p,score:+v}))} />
        <Input label="Responsável" value={f.responsavel} onChange={v=>sf(p=>({...p,responsavel:v}))} options={["Ana Silva","Pedro Costa","Você"]} />
        <Input label="Próximo Follow-up" type="date" value={f.proximo_followup} onChange={v=>sf(p=>({...p,proximo_followup:v}))} />
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>Serviços de Interesse</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Contábil","Fiscal","Folha","BPO","Legalização"].map(s=>(
            <button key={s} onClick={()=>toggleServico(s)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${f.servicos_interesse.includes(s)?T.accent:T.border}`, background:f.servicos_interesse.includes(s)?T.accentGlow:"transparent", color:f.servicos_interesse.includes(s)?T.accent:T.textSub, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <input type="checkbox" id="tc" checked={f.tem_contador_atual} onChange={e=>sf(p=>({...p,tem_contador_atual:e.target.checked}))} style={{ accentColor:T.accent }} />
          <label htmlFor="tc" style={{ fontSize:13, color:T.textSub }}>Tem contador atual?</label>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <input type="checkbox" id="ra" checked={f.reuniao_agendada} onChange={e=>sf(p=>({...p,reuniao_agendada:e.target.checked}))} style={{ accentColor:T.accent }} />
          <label htmlFor="ra" style={{ fontSize:13, color:T.textSub }}>Reunião agendada?</label>
        </div>
      </div>
      {f.tem_contador_atual && <Input label="Motivo da troca" value={f.motivo_troca} onChange={v=>sf(p=>({...p,motivo_troca:v}))} />}
      {f.reuniao_agendada && <Input label="Data/Hora da Reunião" type="datetime-local" value={f.data_reuniao} onChange={v=>sf(p=>({...p,data_reuniao:v}))} />}
      <Input label="Resumo da IA" rows={2} value={f.observacoes_ia} onChange={v=>sf(p=>({...p,observacoes_ia:v}))} placeholder="Anotações do agente de IA..." />
      <Input label="Observações do Consultor" rows={2} value={f.observacoes} onChange={v=>sf(p=>({...p,observacoes:v}))} />
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)}>Salvar Lead</Btn>
      </div>
    </div>
  );
}

function Leads({ leads, setLeads, setClients, setContratos }) {
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filterStage, setFilterStage] = useState("Todos");

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)) &&
           (filterStage==="Todos" || l.etapa===filterStage);
  });

  const saveLead = (f) => {
    if (modal==="new") setLeads(p=>[...p,{...f,id:uid(),data_entrada:today(),data_ultimo_contato:today(),qualificado_ia:false,convertido:false}]);
    else setLeads(p=>p.map(l=>l.id===selected.id?{...l,...f}:l));
    setModal(null); setSelected(null);
  };

  const deleteLead = (id) => { setLeads(p=>p.filter(l=>l.id!==id)); setConfirm(null); };
  const moveLead = (lead, dir) => {
    const idx = PIPELINE_STAGES.indexOf(lead.etapa);
    const ni = idx+dir;
    if(ni<0||ni>=PIPELINE_STAGES.length) return;
    setLeads(p=>p.map(l=>l.id===lead.id?{...l,etapa:PIPELINE_STAGES[ni]}:l));
  };

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Leads & Pipeline</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{leads.filter(l=>!["Perdido","Contrato Assinado"].includes(l.etapa)).length} leads ativos · {leads.filter(l=>l.etapa==="Perdido").length} perdidos</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Tabs tabs={["kanban","lista"]} active={view} onChange={setView} />
          <Btn onClick={()=>{setSelected(null);setModal("new");}}>+ Novo Lead</Btn>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 14px", fontSize:13, width:220 }} />
        {["Todos",...PIPELINE_STAGES].map(s=>(
          <button key={s} onClick={()=>setFilterStage(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filterStage===s?T.accent:T.border}`, background:filterStage===s?T.accentGlow:"transparent", color:filterStage===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s}</button>
        ))}
      </div>

      {view==="kanban" ? (
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:12 }}>
          {PIPELINE_STAGES.map(stage=>{
            const stageleads = filtered.filter(l=>l.etapa===stage);
            const stageVal = stageleads.reduce((s,l)=>s+(parseFloat(l.faturamento_estimado.replace(/[^\d]/g,""))||0),0);
            return (
              <div key={stage} style={{ minWidth:210, maxWidth:210, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", flexShrink:0 }}>
                <div style={{ padding:"12px 14px", background:T.surfaceHigh, borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color: stage==="Perdido"?T.red:stage==="Contrato Assinado"?T.green:T.textSub }}>{stage}</span>
                    <Badge color={stage==="Perdido"?"red":stage==="Contrato Assinado"?"green":"gray"} size="sm">{stageleads.length}</Badge>
                  </div>
                </div>
                <div style={{ padding:10, display:"flex", flexDirection:"column", gap:8, minHeight:120, maxHeight:400, overflowY:"auto" }}>
                  {stageleads.map(l=>(
                    <div key={l.id} className="hover-lift" onClick={()=>{setSelected(l);setModal("edit");}} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:9, padding:12, cursor:"pointer", transition:"border-color 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent+"55"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div style={{ fontWeight:600, fontSize:12, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.nome}</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>{l.segmento} · {l.tipo_empresa}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:11, fontFamily:T.mono, color:scoreColor(l.score), fontWeight:600 }}>Score {l.score}</span>
                        <div style={{ display:"flex", gap:3 }}>
                          <button onClick={e=>{e.stopPropagation();moveLead(l,-1);}} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:13, padding:"1px 3px" }}>‹</button>
                          <button onClick={e=>{e.stopPropagation();moveLead(l,1);}} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:13, padding:"1px 3px" }}>›</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Nome","Fonte","Etapa","Score","Follow-up","Responsável",""].map((h,i)=>(
                <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id} style={{ borderBottom:`1px solid ${T.border}22`, cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>{setSelected(l);setModal("edit");}}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{l.nome}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{l.whatsapp}</div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:T.textSub }}>{l.fonte}</td>
                  <td style={{ padding:"12px 16px" }}><Badge color={statusColor(l.etapa)} size="sm">{l.etapa}</Badge></td>
                  <td style={{ padding:"12px 16px", fontFamily:T.mono, fontSize:13, color:scoreColor(l.score), fontWeight:600 }}>{l.score}</td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:l.proximo_followup<=today()?T.red:T.textSub, fontFamily:T.mono }}>{fmtDate(l.proximo_followup)}</td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:T.textSub }}>{l.responsavel}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setConfirm(l.id);}}>🗑</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <EmptyState icon="🎯" title="Nenhum lead encontrado" sub="Ajuste os filtros ou adicione um novo lead." />}
        </Card>
      )}

      <Modal open={!!modal} onClose={()=>{setModal(null);setSelected(null);}} title={modal==="new"?"Novo Lead":"Editar Lead"} width={700}>
        <LeadForm lead={selected||{}} onSave={saveLead} onClose={()=>{setModal(null);setSelected(null);}} />
      </Modal>
      <Confirm open={!!confirm} msg="Remover este lead permanentemente?" onOk={()=>deleteLead(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
function ClienteForm({ cliente={}, onSave, onClose }) {
  const [f, sf] = useState({ razao_social:"", nome_fantasia:"", cnpj:"", cpf_socio:"", ie:"", im:"", regime:"Simples Nacional", porte:"ME", segmento:"", data_abertura:"", numero_funcionarios:0, faturamento_medio:0, email:"", whatsapp_fin:"", whatsapp_socio:"", endereco:"", status:"Ativo", responsavel:"Ana Silva", nf_automatica:true, nivel_risco:"Baixo", observacoes:"", valor_mensalidade:0, servicos:[], ...cliente });
  const toggleSvc = s => sf(p=>({ ...p, servicos: p.servicos.includes(s)?p.servicos.filter(x=>x!==s):[...p.servicos,s] }));
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <Input label="Razão Social" required value={f.razao_social} onChange={v=>sf(p=>({...p,razao_social:v}))} />
        <Input label="Nome Fantasia" value={f.nome_fantasia} onChange={v=>sf(p=>({...p,nome_fantasia:v}))} />
        <Input label="CNPJ" value={f.cnpj} onChange={v=>sf(p=>({...p,cnpj:v}))} placeholder="00.000.000/0001-00" />
        <Input label="CPF do Sócio" value={f.cpf_socio} onChange={v=>sf(p=>({...p,cpf_socio:v}))} />
        <Input label="IE (Insc. Estadual)" value={f.ie} onChange={v=>sf(p=>({...p,ie:v}))} />
        <Input label="IM (Insc. Municipal)" value={f.im} onChange={v=>sf(p=>({...p,im:v}))} />
        <Input label="Regime Tributário" value={f.regime} onChange={v=>sf(p=>({...p,regime:v}))} options={["Simples Nacional","Lucro Presumido","Lucro Real","MEI"]} />
        <Input label="Porte" value={f.porte} onChange={v=>sf(p=>({...p,porte:v}))} options={["MEI","ME","EPP","Médio","Grande"]} />
        <Input label="Segmento" value={f.segmento} onChange={v=>sf(p=>({...p,segmento:v}))} />
        <Input label="Data de Abertura" type="date" value={f.data_abertura} onChange={v=>sf(p=>({...p,data_abertura:v}))} />
        <Input label="Nº Funcionários" type="number" value={f.numero_funcionarios} onChange={v=>sf(p=>({...p,numero_funcionarios:+v}))} />
        <Input label="Faturamento Médio/mês (R$)" type="number" value={f.faturamento_medio} onChange={v=>sf(p=>({...p,faturamento_medio:+v}))} />
        <Input label="E-mail" type="email" value={f.email} onChange={v=>sf(p=>({...p,email:v}))} />
        <Input label="WhatsApp Financeiro" value={f.whatsapp_fin} onChange={v=>sf(p=>({...p,whatsapp_fin:v}))} />
        <Input label="WhatsApp Sócio" value={f.whatsapp_socio} onChange={v=>sf(p=>({...p,whatsapp_socio:v}))} />
        <Input label="Mensalidade (R$)" type="number" value={f.valor_mensalidade} onChange={v=>sf(p=>({...p,valor_mensalidade:+v}))} />
        <Input label="Status" value={f.status} onChange={v=>sf(p=>({...p,status:v}))} options={["Ativo","Inadimplente","Suspenso","Cancelado"]} />
        <Input label="Nível de Risco" value={f.nivel_risco} onChange={v=>sf(p=>({...p,nivel_risco:v}))} options={["Baixo","Médio","Alto"]} />
        <Input label="Responsável Interno" value={f.responsavel} onChange={v=>sf(p=>({...p,responsavel:v}))} options={["Ana Silva","Pedro Costa","Você"]} />
      </div>
      <Input label="Endereço" value={f.endereco} onChange={v=>sf(p=>({...p,endereco:v}))} />
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>Serviços Contratados</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Contábil","Fiscal","Folha","BPO","Legalização"].map(s=>(
            <button key={s} onClick={()=>toggleSvc(s)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${f.servicos.includes(s)?T.green:T.border}`, background:f.servicos.includes(s)?T.greenDim:"transparent", color:f.servicos.includes(s)?T.green:T.textSub, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <input type="checkbox" id="nfa" checked={f.nf_automatica} onChange={e=>sf(p=>({...p,nf_automatica:e.target.checked}))} style={{ accentColor:T.accent }} />
        <label htmlFor="nfa" style={{ fontSize:13, color:T.textSub }}>Emitir NF automaticamente no pagamento</label>
      </div>
      <Input label="Observações" rows={2} value={f.observacoes} onChange={v=>sf(p=>({...p,observacoes:v}))} />
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)}>Salvar Cliente</Btn>
      </div>
    </div>
  );
}

function Clientes({ clients, setClients, financeiro, tickets }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterResp, setFilterResp] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [detailTab, setDetailTab] = useState("Resumo");

  const responsaveis = ["Todos",...new Set(clients.map(c=>c.responsavel))];

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.razao_social.toLowerCase().includes(q) || c.cnpj.includes(q) || c.email.toLowerCase().includes(q)) &&
           (filterStatus==="Todos" || c.status===filterStatus) &&
           (filterResp==="Todos" || c.responsavel===filterResp);
  });

  const saveCliente = f => {
    if (modal==="new") setClients(p=>[...p,{...f,id:uid(),data_entrada:today()}]);
    else setClients(p=>p.map(c=>c.id===selected.id?{...c,...f}:c));
    setModal(null); setSelected(null);
  };

  const deleteCliente = id => {
    const hasOpen = financeiro.some(f=>f.cliente_id===id&&f.status!=="Pago"&&f.status!=="Cancelado");
    if(hasOpen){alert("Não é possível remover: cliente possui cobranças em aberto.");return;}
    setClients(p=>p.filter(c=>c.id!==id)); setConfirm(null);
  };

  const statusColor2 = s => ({Ativo:"green",Inadimplente:"red",Suspenso:"yellow",Cancelado:"gray"})[s]||"gray";
  const riskColor = r => ({Baixo:"green",Médio:"yellow",Alto:"red"})[r]||"gray";

  const mrr = filtered.reduce((s,c)=>s+c.valor_mensalidade,0);

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Clientes</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{filtered.length} clientes · MRR {fmt(mrr)}</p>
        </div>
        <Btn onClick={()=>{setSelected(null);setModal("new");}}>+ Novo Cliente</Btn>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ ou e-mail..." style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 14px", fontSize:13, width:260 }} />
        {["Todos","Ativo","Inadimplente","Suspenso","Cancelado"].map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filterStatus===s?T.accent:T.border}`, background:filterStatus===s?T.accentGlow:"transparent", color:filterStatus===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s}</button>
        ))}
        <select value={filterResp} onChange={e=>setFilterResp(e.target.value)} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"6px 12px", fontSize:12 }}>
          {responsaveis.map(r=><option key={r}>{r}</option>)}
        </select>
      </div>

      <Card style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
            {["Empresa","Regime","Serviços","Mensalidade","Status","Risco","Responsável",""].map((h,i)=>(
              <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}22`, cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>{setSelected(c);setModal("detail");setDetailTab("Resumo");}}>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{c.nome_fantasia||c.razao_social}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{c.cnpj}</div>
                </td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{c.regime}</td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {c.servicos.slice(0,2).map(s=><Badge key={s} color="blue" size="sm">{s}</Badge>)}
                    {c.servicos.length>2 && <Badge color="gray" size="sm">+{c.servicos.length-2}</Badge>}
                  </div>
                </td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontWeight:500, color:T.accent, fontSize:13 }}>{fmt(c.valor_mensalidade)}</td>
                <td style={{ padding:"13px 16px" }}><Badge color={statusColor2(c.status)} dot>{c.status}</Badge></td>
                <td style={{ padding:"13px 16px" }}><Badge color={riskColor(c.nivel_risco)} size="sm">{c.nivel_risco}</Badge></td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{c.responsavel}</td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn size="sm" variant="soft" onClick={e=>{e.stopPropagation();setSelected(c);setModal("edit");}}>✏</Btn>
                    <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setConfirm(c.id);}}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <EmptyState icon="◉" title="Nenhum cliente encontrado" sub="Ajuste os filtros ou cadastre um novo cliente." />}
      </Card>

      {/* Modal detalhe */}
      <Modal open={modal==="detail"} onClose={()=>{setModal(null);setSelected(null);}} title={selected?.razao_social||""} width={720}>
        {selected && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
              <Badge color={statusColor2(selected.status)} dot>{selected.status}</Badge>
              <Badge color={riskColor(selected.nivel_risco)}>Risco {selected.nivel_risco}</Badge>
              <Badge color="blue">{selected.regime}</Badge>
              {selected.servicos.map(s=><Badge key={s} color="gray" size="sm">{s}</Badge>)}
            </div>
            <Tabs tabs={["Resumo","Financeiro","Tickets","Documentos"]} active={detailTab} onChange={setDetailTab} />
            <div style={{ marginTop:20 }}>
              {detailTab==="Resumo" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[["CNPJ",selected.cnpj],["Regime",selected.regime],["Porte",selected.porte],["Segmento",selected.segmento],["Faturamento Médio",fmt(selected.faturamento_medio)],["Nº Funcionários",selected.numero_funcionarios],["E-mail",selected.email],["WhatsApp Sócio",selected.whatsapp_socio],["WhatsApp Financeiro",selected.whatsapp_fin],["Mensalidade",fmt(selected.valor_mensalidade)],["Responsável",selected.responsavel],["Cliente desde",fmtDate(selected.data_entrada)]].map(([k,v])=>(
                    <div key={k} style={{ background:T.bgMid, borderRadius:8, padding:"10px 14px" }}>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:3, fontWeight:600 }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{v||"—"}</div>
                    </div>
                  ))}
                  {selected.observacoes && <div style={{ gridColumn:"1/-1", background:T.bgMid, borderRadius:8, padding:"10px 14px" }}><div style={{ fontSize:11, color:T.textMuted, marginBottom:3, fontWeight:600 }}>OBSERVAÇÕES</div><div style={{ fontSize:13 }}>{selected.observacoes}</div></div>}
                </div>
              )}
              {detailTab==="Financeiro" && (
                <div>
                  {financeiro.filter(f=>f.cliente_id===selected.id).map(f=>(
                    <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{f.tipo} · {fmtDate(f.vencimento)}</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{f.forma} · {f.nf_emitida?`NF ${f.nf_numero}`:"NF não emitida"}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:T.mono, fontWeight:600, color:T.accent }}>{fmt(f.valor)}</div>
                        <Badge color={f.status==="Pago"?"green":f.status==="Vencido"?"red":f.status==="Aguardando"?"yellow":"gray"} size="sm">{f.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detailTab==="Tickets" && (
                <div>
                  {tickets.filter(t=>t.cliente_id===selected.id).map(t=>(
                    <div key={t.id} style={{ padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:600 }}>{t.assunto}</span>
                        <Badge color={t.status==="Resolvido"?"green":t.prioridade==="Alta"?"red":"yellow"} size="sm">{t.status}</Badge>
                      </div>
                      <div style={{ fontSize:12, color:T.textMuted }}>{t.tipo} · {t.canal} · {fmtDate(t.data_abertura)}</div>
                    </div>
                  ))}
                </div>
              )}
              {detailTab==="Documentos" && (
                <div>
                  {SEED_DOCS.filter(d=>d.cliente_id===selected.id).map(d=>(
                    <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{d.nome}</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{d.tipo} · Enviado em {fmtDate(d.data_upload)}</div>
                      </div>
                      <Badge color={d.status==="Válido"?"green":d.status==="Vencido"?"red":"yellow"} size="sm">{d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <Btn variant="ghost" onClick={()=>{setModal(null);setSelected(null);}}>Fechar</Btn>
              <Btn variant="soft" onClick={()=>setModal("edit")}>✏ Editar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal==="new"||modal==="edit"} onClose={()=>{setModal(null);setSelected(null);}} title={modal==="new"?"Novo Cliente":"Editar Cliente"} width={740}>
        <ClienteForm cliente={selected||{}} onSave={saveCliente} onClose={()=>{setModal(null);setSelected(null);}} />
      </Modal>
      <Confirm open={!!confirm} msg="Remover este cliente? Esta ação não pode ser desfeita." onOk={()=>deleteCliente(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── CONTRATOS ────────────────────────────────────────────────────────────────
function Contratos({ contratos, setContratos, clients }) {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [f, sf] = useState({});

  const openNew = () => { sf({ cliente_id:"", servicos:[], valor:0, setup:0, dia_vencimento:5, periodicidade:"Mensal", data_inicio:today(), reajuste:"IPCA", status:"Ativo", canal:"Digital", observacoes:"" }); setModal("form"); };
  const openEdit = c => { setSelected(c); sf({...c}); setModal("form"); };
  const save = () => {
    if(!f.cliente_id||!f.valor) return;
    if(modal==="new"||!selected) setContratos(p=>[...p,{...f,id:uid()}]);
    else setContratos(p=>p.map(c=>c.id===selected.id?{...c,...f}:c));
    setModal(null); setSelected(null);
  };
  const del = id => { setContratos(p=>p.filter(c=>c.id!==id)); setConfirm(null); };
  const toggleSvc = s => sf(p=>({ ...p, servicos:(p.servicos||[]).includes(s)?(p.servicos||[]).filter(x=>x!==s):[...(p.servicos||[]),s] }));
  const clientName = id => { const c=clients.find(x=>x.id===id); return c?c.nome_fantasia||c.razao_social:"—"; };

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Contratos</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{contratos.filter(c=>c.status==="Ativo").length} ativos · {fmt(contratos.filter(c=>c.status==="Ativo").reduce((s,c)=>s+c.valor,0))}/mês</p>
        </div>
        <Btn onClick={openNew}>+ Novo Contrato</Btn>
      </div>

      <Card style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
            {["Cliente","Serviços","Valor","Vencimento","Periodicidade","Reajuste","Status",""].map((h,i)=>(
              <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {contratos.map(c=>(
              <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}22` }}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{clientName(c.cliente_id)}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>Desde {fmtDate(c.data_inicio)}</div>
                </td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {(c.servicos||[]).slice(0,2).map(s=><Badge key={s} color="blue" size="sm">{s}</Badge>)}
                    {(c.servicos||[]).length>2&&<Badge color="gray" size="sm">+{c.servicos.length-2}</Badge>}
                  </div>
                </td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, color:T.accent, fontWeight:500 }}>{fmt(c.valor)}</td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>Dia {c.dia_vencimento}</td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{c.periodicidade}</td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{c.reajuste}</td>
                <td style={{ padding:"13px 16px" }}><Badge color={c.status==="Ativo"?"green":c.status==="Cancelado"?"red":"yellow"} dot>{c.status}</Badge></td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn size="sm" variant="soft" onClick={()=>openEdit(c)}>✏</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>setConfirm(c.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contratos.length===0 && <EmptyState icon="◈" title="Nenhum contrato" sub="Cadastre o primeiro contrato." />}
      </Card>

      <Modal open={modal==="form"} onClose={()=>setModal(null)} title={selected?"Editar Contrato":"Novo Contrato"} width={660}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div style={{ gridColumn:"1/-1", marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:5 }}>Cliente *</label>
            <select value={f.cliente_id||""} onChange={e=>sf(p=>({...p,cliente_id:e.target.value}))} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", width:"100%", fontSize:13 }}>
              <option value="">Selecionar cliente...</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>
          <Input label="Valor Mensalidade (R$) *" type="number" value={f.valor||""} onChange={v=>sf(p=>({...p,valor:+v}))} />
          <Input label="Setup (R$)" type="number" value={f.setup||0} onChange={v=>sf(p=>({...p,setup:+v}))} />
          <Input label="Dia de Vencimento" type="number" value={f.dia_vencimento||5} onChange={v=>sf(p=>({...p,dia_vencimento:+v}))} />
          <Input label="Periodicidade" value={f.periodicidade||"Mensal"} onChange={v=>sf(p=>({...p,periodicidade:v}))} options={["Mensal","Trimestral","Semestral","Anual"]} />
          <Input label="Data de Início" type="date" value={f.data_inicio||""} onChange={v=>sf(p=>({...p,data_inicio:v}))} />
          <Input label="Data de Fim" type="date" value={f.data_fim||""} onChange={v=>sf(p=>({...p,data_fim:v}))} />
          <Input label="Reajuste Anual" value={f.reajuste||"IPCA"} onChange={v=>sf(p=>({...p,reajuste:v}))} options={["IPCA","IGP-M","Fixo","Nenhum"]} />
          <Input label="Canal de Assinatura" value={f.canal||"Digital"} onChange={v=>sf(p=>({...p,canal:v}))} options={["Digital","Físico","WhatsApp"]} />
          <Input label="Status" value={f.status||"Ativo"} onChange={v=>sf(p=>({...p,status:v}))} options={["Ativo","Suspenso","Cancelado","Em renovação"]} />
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>Serviços *</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["Contábil","Fiscal","Folha","BPO","Legalização","Consultoria"].map(s=>(
              <button key={s} onClick={()=>toggleSvc(s)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${(f.servicos||[]).includes(s)?T.accent:T.border}`, background:(f.servicos||[]).includes(s)?T.accentGlow:"transparent", color:(f.servicos||[]).includes(s)?T.accent:T.textSub, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s}</button>
            ))}
          </div>
        </div>
        <Input label="Observações" rows={2} value={f.observacoes||""} onChange={v=>sf(p=>({...p,observacoes:v}))} />
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar Contrato</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirm} msg="Cancelar/remover este contrato?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── FINANCEIRO ───────────────────────────────────────────────────────────────
function Financeiro({ financeiro, setFinanceiro, clients, contratos, asaasKey }) {
  const [filter, setFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [f, sf] = useState({});
  const [asaasLoading, setAsaasLoading] = useState(false);
  const [asaasMsg, setAsaasMsg] = useState("");

  const clientName = id => { const c=clients.find(x=>x.id===id); return c?c.nome_fantasia||c.razao_social:"?"; };

  const filtered = financeiro.filter(fn => filter==="Todos"||fn.status===filter);
  const mrr = financeiro.filter(f=>f.status==="Pago").reduce((s,f)=>s+f.valor,0);
  const vencido = financeiro.filter(f=>f.status==="Vencido").reduce((s,f)=>s+f.valor,0);
  const aguardando = financeiro.filter(f=>f.status==="Aguardando").reduce((s,f)=>s+f.valor,0);

  const counts = s => financeiro.filter(f=>f.status===s).length;

  const openNew = () => { sf({ cliente_id:"", contrato_id:"", tipo:"Mensalidade", valor:0, vencimento:"", status:"Aguardando", forma:"Boleto", nf_emitida:false, obs:"" }); setSelected(null); setModal(true); };
  const openEdit = fn => { setSelected(fn); sf({...fn}); setModal(true); };
  const save = () => {
    if(!f.cliente_id||!f.valor) return;
    if(selected) setFinanceiro(p=>p.map(fn=>fn.id===selected.id?{...fn,...f}:fn));
    else setFinanceiro(p=>[...p,{...f,id:uid(),dias_atraso:0,tentativas:0,nf_numero:"",data_pagamento:""}]);
    setModal(false); setSelected(null);
  };
  const marcarPago = id => setFinanceiro(p=>p.map(f=>f.id===id?{...f,status:"Pago",data_pagamento:today()}:f));
  const del = id => { setFinanceiro(p=>p.filter(f=>f.id!==id)); setConfirm(null); };

  const syncAsaas = async () => {
    if(!asaasKey){setAsaasMsg("Configure sua API key do Asaas em Configurações.");return;}
    setAsaasLoading(true); setAsaasMsg("");
    try {
      const r = await fetch("https://api.asaas.com/v3/payments?limit=50", { headers:{"access_token":asaasKey} });
      if(!r.ok) throw new Error();
      const d = await r.json();
      setAsaasMsg(`✓ ${d.data?.length||0} cobranças sincronizadas do Asaas.`);
    } catch { setAsaasMsg("Erro ao conectar ao Asaas. Verifique sua API key."); }
    setAsaasLoading(false);
  };

  const statusColor = s => ({Pago:"green",Vencido:"red",Aguardando:"yellow",Cancelado:"gray"})[s]||"gray";

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Financeiro</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{financeiro.length} cobranças · {counts("Vencido")} vencidas</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="ghost" onClick={syncAsaas} disabled={asaasLoading}>⟳ {asaasLoading?"Sincronizando...":"Sincronizar Asaas"}</Btn>
          <Btn onClick={openNew}>+ Nova Cobrança</Btn>
        </div>
      </div>

      {asaasMsg && <div style={{ background:asaasMsg.startsWith("✓")?T.greenDim:T.redDim, border:`1px solid ${asaasMsg.startsWith("✓")?T.green:T.red}33`, borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:asaasMsg.startsWith("✓")?T.green:T.red }}>{asaasMsg}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard icon="✅" label="Recebido" value={fmt(mrr)} sub={`${counts("Pago")} cobranças`} color={T.green} />
        <StatCard icon="⏳" label="Aguardando" value={fmt(aguardando)} sub={`${counts("Aguardando")} cobranças`} color={T.yellow} />
        <StatCard icon="🔴" label="Vencido" value={fmt(vencido)} sub={`${counts("Vencido")} cobranças`} color={T.red} />
        <StatCard icon="📊" label="Total Mês" value={fmt(mrr+aguardando+vencido)} sub="projeção total" color={T.accent} />
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {["Todos","Pago","Aguardando","Vencido","Cancelado"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===s?T.accent:T.border}`, background:filter===s?T.accentGlow:"transparent", color:filter===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s} {s!=="Todos"?`(${counts(s)})`:""}</button>
        ))}
      </div>

      <Card style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
            {["Cliente","Tipo","Vencimento","Valor","Forma","NF","Atraso","Status",""].map((h,i)=>(
              <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(fn=>(
              <tr key={fn.id} style={{ borderBottom:`1px solid ${T.border}22` }}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{clientName(fn.cliente_id)}</div>
                  {fn.obs && <div style={{ fontSize:11, color:T.textMuted }}>{fn.obs}</div>}
                </td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{fn.tipo}</td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontSize:12, color:T.textSub }}>{fmtDate(fn.vencimento)}</td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontWeight:600, color:T.accent }}>{fmt(fn.valor)}</td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{fn.forma}</td>
                <td style={{ padding:"13px 16px" }}>{fn.nf_emitida?<Badge color="green" size="sm">✓ {fn.nf_numero}</Badge>:<Badge color="gray" size="sm">Não</Badge>}</td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontSize:12, color:fn.dias_atraso>0?T.red:T.textMuted }}>{fn.dias_atraso>0?`${fn.dias_atraso}d`:"—"}</td>
                <td style={{ padding:"13px 16px" }}><Badge color={statusColor(fn.status)} dot>{fn.status}</Badge></td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    {fn.status!=="Pago"&&<Btn size="sm" variant="success" onClick={()=>marcarPago(fn.id)}>✓ Pago</Btn>}
                    <Btn size="sm" variant="soft" onClick={()=>openEdit(fn)}>✏</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>setConfirm(fn.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <EmptyState icon="◆" title="Nenhuma cobrança" sub="Adicione cobranças ou sincronize com o Asaas." />}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title={selected?"Editar Cobrança":"Nova Cobrança"}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div style={{ gridColumn:"1/-1", marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:5 }}>Cliente *</label>
            <select value={f.cliente_id||""} onChange={e=>sf(p=>({...p,cliente_id:e.target.value}))} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", width:"100%", fontSize:13 }}>
              <option value="">Selecionar...</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>
          <Input label="Tipo" value={f.tipo||"Mensalidade"} onChange={v=>sf(p=>({...p,tipo:v}))} options={["Mensalidade","Setup","Avulso","Reembolso"]} />
          <Input label="Valor (R$) *" type="number" value={f.valor||""} onChange={v=>sf(p=>({...p,valor:+v}))} />
          <Input label="Vencimento" type="date" value={f.vencimento||""} onChange={v=>sf(p=>({...p,vencimento:v}))} />
          <Input label="Forma de Pagamento" value={f.forma||"Boleto"} onChange={v=>sf(p=>({...p,forma:v}))} options={["Boleto","PIX","Cartão","TED"]} />
          <Input label="Status" value={f.status||"Aguardando"} onChange={v=>sf(p=>({...p,status:v}))} options={["Aguardando","Pago","Vencido","Cancelado"]} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <input type="checkbox" id="nfi" checked={f.nf_emitida||false} onChange={e=>sf(p=>({...p,nf_emitida:e.target.checked}))} style={{ accentColor:T.accent }} />
          <label htmlFor="nfi" style={{ fontSize:13, color:T.textSub }}>NF Emitida</label>
        </div>
        {f.nf_emitida && <Input label="Número da NF" value={f.nf_numero||""} onChange={v=>sf(p=>({...p,nf_numero:v}))} />}
        <Input label="Observações" rows={2} value={f.obs||""} onChange={v=>sf(p=>({...p,obs:v}))} />
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirm} msg="Remover esta cobrança?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── TICKETS / SUPORTE ────────────────────────────────────────────────────────
function Tickets({ tickets, setTickets, clients }) {
  const [filter, setFilter] = useState("Todos");
  const [filterPrio, setFilterPrio] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [f, sf] = useState({});
  const [update, setUpdate] = useState("");

  const clientName = id => { const c=clients.find(x=>x.id===id); return c?c.nome_fantasia||c.razao_social:"?"; };

  const filtered = tickets.filter(t =>
    (filter==="Todos"||t.status===filter) &&
    (filterPrio==="Todos"||t.prioridade===filterPrio)
  );

  const counts = s => tickets.filter(t=>t.status===s).length;

  const openNew = () => { sf({ cliente_id:"", canal:"WhatsApp", tipo:"Dúvida", assunto:"", descricao:"", prioridade:"Média", status:"Aberto", responsavel:"Ana Silva", sla_horas:24, historico:"" }); setSelected(null); setModal(true); };
  const openEdit = t => { setSelected(t); sf({...t}); setModal(true); setUpdate(""); };
  const save = () => {
    if(!f.assunto) return;
    if(selected) setTickets(p=>p.map(t=>t.id===selected.id?{...t,...f}:t));
    else setTickets(p=>[...p,{...f,id:uid(),data_abertura:today(),data_resolucao:"",avaliacao:""}]);
    setModal(false); setSelected(null);
  };
  const addUpdate = () => {
    if(!update.trim()||!selected) return;
    const hist = (f.historico||"")+`\n${today()} — ${update}`;
    sf(p=>({...p,historico:hist}));
    setTickets(p=>p.map(t=>t.id===selected.id?{...t,historico:hist}:t));
    setUpdate("");
  };
  const changeStatus = (id, status) => {
    setTickets(p=>p.map(t=>t.id===id?{...t,status,data_resolucao:status==="Resolvido"?today():""}:t));
  };
  const del = id => { setTickets(p=>p.filter(t=>t.id!==id)); setConfirm(null); };

  const prioColor = p => ({Alta:"red",Média:"yellow",Baixa:"blue",Urgente:"red"})[p]||"gray";
  const statusColor = s => ({Aberto:"red","Em andamento":"yellow","Aguardando cliente":"purple",Resolvido:"green"})[s]||"gray";

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Suporte & Atendimento</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{counts("Aberto")} abertos · {counts("Em andamento")} em andamento · {counts("Resolvido")} resolvidos</p>
        </div>
        <Btn onClick={openNew}>+ Novo Ticket</Btn>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {["Todos","Aberto","Em andamento","Aguardando cliente","Resolvido"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===s?T.accent:T.border}`, background:filter===s?T.accentGlow:"transparent", color:filter===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s} {s!=="Todos"?`(${counts(s)})`:""}</button>
        ))}
        {["Todos","Urgente","Alta","Média","Baixa"].map(p=>(
          <button key={p} onClick={()=>setFilterPrio(p)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filterPrio===p?T.purple:T.border}`, background:filterPrio===p?T.purpleDim:"transparent", color:filterPrio===p?T.purple:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{p==="Todos"?"Prioridade":p}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(t=>(
          <Card key={t.id} className="hover-lift" style={{ padding:18, cursor:"pointer" }}
            onClick={()=>openEdit(t)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t.assunto}</div>
                <div style={{ fontSize:12, color:T.textMuted }}>{clientName(t.cliente_id)} · {t.canal} · {t.tipo} · Aberto {fmtDate(t.data_abertura)}</div>
              </div>
              <div style={{ display:"flex", gap:8, marginLeft:16, flexShrink:0 }}>
                <Badge color={prioColor(t.prioridade)} size="sm">{t.prioridade}</Badge>
                <Badge color={statusColor(t.status)} dot>{t.status}</Badge>
              </div>
            </div>
            <div style={{ fontSize:13, color:T.textSub, marginBottom:12, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{t.descricao}</div>
            <div style={{ display:"flex", gap:8 }}>
              {t.status!=="Em andamento"&&t.status!=="Resolvido" && <Btn size="sm" variant="soft" onClick={e=>{e.stopPropagation();changeStatus(t.id,"Em andamento");}}>▶ Iniciar</Btn>}
              {t.status!=="Resolvido" && <Btn size="sm" variant="success" onClick={e=>{e.stopPropagation();changeStatus(t.id,"Resolvido");}}>✓ Resolver</Btn>}
              {t.status==="Resolvido" && <Btn size="sm" variant="ghost" onClick={e=>{e.stopPropagation();changeStatus(t.id,"Aberto");}}>↩ Reabrir</Btn>}
              <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setConfirm(t.id);}}>🗑</Btn>
            </div>
          </Card>
        ))}
        {filtered.length===0 && <EmptyState icon="◍" title="Nenhum ticket encontrado" sub="Ajuste os filtros ou abra um novo ticket." />}
      </div>

      <Modal open={modal} onClose={()=>{setModal(false);setSelected(null);}} title={selected?`Ticket — ${selected.assunto}`:"Novo Ticket"} width={680}>
        {selected ? (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              <Badge color={prioColor(f.prioridade)} dot>{f.prioridade}</Badge>
              <Badge color={statusColor(f.status)}>{f.status}</Badge>
              <span style={{ fontSize:12, color:T.textMuted }}>SLA: {f.sla_horas}h · {clientName(f.cliente_id)} · {f.canal}</span>
            </div>
            <div style={{ background:T.bgMid, borderRadius:10, padding:14, marginBottom:16, fontSize:13, color:T.textSub, lineHeight:1.6 }}>{f.descricao}</div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>HISTÓRICO</div>
              <div style={{ background:T.bgMid, borderRadius:10, padding:14, maxHeight:160, overflowY:"auto", fontSize:12, color:T.textSub, fontFamily:T.mono, whiteSpace:"pre-line", lineHeight:1.7 }}>{f.historico||"Nenhuma atualização ainda."}</div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <input value={update} onChange={e=>setUpdate(e.target.value)} placeholder="Adicionar atualização..." style={{ flex:1, background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", fontSize:13 }} onKeyDown={e=>e.key==="Enter"&&addUpdate()} />
              <Btn onClick={addUpdate}>Adicionar</Btn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 12px" }}>
              <Input label="Status" value={f.status||""} onChange={v=>sf(p=>({...p,status:v}))} options={["Aberto","Em andamento","Aguardando cliente","Resolvido"]} />
              <Input label="Prioridade" value={f.prioridade||""} onChange={v=>sf(p=>({...p,prioridade:v}))} options={["Baixa","Média","Alta","Urgente"]} />
              <Input label="Responsável" value={f.responsavel||""} onChange={v=>sf(p=>({...p,responsavel:v}))} options={["Ana Silva","Pedro Costa","Você"]} />
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={()=>{setModal(false);setSelected(null);}}>Fechar</Btn>
              <Btn onClick={save}>Salvar Alterações</Btn>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <div style={{ gridColumn:"1/-1", marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:5 }}>Cliente</label>
                <select value={f.cliente_id||""} onChange={e=>sf(p=>({...p,cliente_id:e.target.value}))} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", width:"100%", fontSize:13 }}>
                  <option value="">Selecionar...</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <Input label="Canal" value={f.canal||"WhatsApp"} onChange={v=>sf(p=>({...p,canal:v}))} options={["WhatsApp","E-mail","Telefone","Presencial"]} />
              <Input label="Tipo" value={f.tipo||"Dúvida"} onChange={v=>sf(p=>({...p,tipo:v}))} options={["Dúvida","Reclamação","Solicitação","Cobrança","Cancelamento"]} />
              <Input label="Prioridade" value={f.prioridade||"Média"} onChange={v=>sf(p=>({...p,prioridade:v}))} options={["Baixa","Média","Alta","Urgente"]} />
              <Input label="Responsável" value={f.responsavel||"Ana Silva"} onChange={v=>sf(p=>({...p,responsavel:v}))} options={["Ana Silva","Pedro Costa","Você"]} />
              <div style={{ gridColumn:"1/-1" }}><Input label="Assunto *" value={f.assunto||""} onChange={v=>sf(p=>({...p,assunto:v}))} /></div>
            </div>
            <Input label="Descrição" rows={3} value={f.descricao||""} onChange={v=>sf(p=>({...p,descricao:v}))} />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn onClick={save}>Abrir Ticket</Btn>
            </div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} msg="Remover este ticket?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── DOCUMENTOS ───────────────────────────────────────────────────────────────
function Documentos({ docs, setDocs, clients }) {
  const [filter, setFilter] = useState("Todos");
  const [filterCl, setFilterCl] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [f, sf] = useState({});
  const [confirm, setConfirm] = useState(null);

  const clientName = id => { const c=clients.find(x=>x.id===id); return c?c.nome_fantasia||c.razao_social:"?"; };
  const clientOptions = ["Todos",...new Set(docs.map(d=>d.cliente_id))];

  const filtered = docs.filter(d =>
    (filter==="Todos"||d.status===filter) &&
    (filterCl==="Todos"||d.cliente_id===filterCl)
  );

  const openNew = () => { sf({ cliente_id:"", tipo:"Contrato Social", nome:"", arquivo:"", validade:"", status:"Válido", enviado_por:"Ana Silva" }); setModal(true); };
  const save = () => {
    if(!f.cliente_id||!f.nome) return;
    setDocs(p=>[...p,{...f,id:uid(),data_upload:today()}]);
    setModal(false);
  };
  const del = id => { setDocs(p=>p.filter(d=>d.id!==id)); setConfirm(null); };

  const statusColor = s => ({Válido:"green",Vencido:"red",Aguardando:"yellow"})[s]||"gray";
  const counts = s => docs.filter(d=>d.status===s).length;

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Documentos</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{docs.length} documentos · {counts("Vencido")} vencidos · {counts("Aguardando")} aguardando</p>
        </div>
        <Btn onClick={openNew}>+ Novo Documento</Btn>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {["Todos","Válido","Vencido","Aguardando"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===s?T.accent:T.border}`, background:filter===s?T.accentGlow:"transparent", color:filter===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>{s}</button>
        ))}
        <select value={filterCl} onChange={e=>setFilterCl(e.target.value)} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"6px 12px", fontSize:12 }}>
          {clientOptions.map(id=><option key={id} value={id}>{id==="Todos"?"Todos os clientes":clientName(id)}</option>)}
        </select>
      </div>

      <Card style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
            {["Documento","Cliente","Tipo","Upload","Validade","Enviado por","Status",""].map((h,i)=>(
              <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(d=>(
              <tr key={d.id} style={{ borderBottom:`1px solid ${T.border}22` }}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>📄 {d.nome}</div>
                  {d.arquivo && <div style={{ fontSize:11, color:T.textMuted }}>{d.arquivo}</div>}
                </td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{clientName(d.cliente_id)}</td>
                <td style={{ padding:"13px 16px" }}><Badge color="purple" size="sm">{d.tipo}</Badge></td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontSize:12, color:T.textMuted }}>{fmtDate(d.data_upload)}</td>
                <td style={{ padding:"13px 16px", fontFamily:T.mono, fontSize:12, color:d.status==="Vencido"?T.red:T.textSub }}>{d.validade?fmtDate(d.validade):"Sem validade"}</td>
                <td style={{ padding:"13px 16px", fontSize:12, color:T.textSub }}>{d.enviado_por}</td>
                <td style={{ padding:"13px 16px" }}><Badge color={statusColor(d.status)} dot>{d.status}</Badge></td>
                <td style={{ padding:"13px 16px" }}>
                  <Btn size="sm" variant="danger" onClick={()=>setConfirm(d.id)}>🗑</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <EmptyState icon="◰" title="Nenhum documento" sub="Adicione documentos dos seus clientes." />}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title="Novo Documento">
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:5 }}>Cliente *</label>
          <select value={f.cliente_id||""} onChange={e=>sf(p=>({...p,cliente_id:e.target.value}))} style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 13px", width:"100%", fontSize:13 }}>
            <option value="">Selecionar...</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Input label="Tipo" value={f.tipo||"Contrato Social"} onChange={v=>sf(p=>({...p,tipo:v}))} options={["Contrato Social","CNPJ","RG/CPF","Certidão","Comprovante","Extrato","NF","Procuração","Outro"]} />
          <Input label="Status" value={f.status||"Válido"} onChange={v=>sf(p=>({...p,status:v}))} options={["Válido","Vencido","Aguardando"]} />
          <Input label="Nome do Documento *" value={f.nome||""} onChange={v=>sf(p=>({...p,nome:v}))} />
          <Input label="Nome do Arquivo" value={f.arquivo||""} onChange={v=>sf(p=>({...p,arquivo:v}))} placeholder="ex: contrato_social.pdf" />
          <Input label="Validade" type="date" value={f.validade||""} onChange={v=>sf(p=>({...p,validade:v}))} />
          <Input label="Enviado por" value={f.enviado_por||"Ana Silva"} onChange={v=>sf(p=>({...p,enviado_por:v}))} options={["Ana Silva","Pedro Costa","Você","Cliente"]} />
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirm} msg="Remover este documento?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
function Config({ asaasKey, setAsaasKey }) {
  const [key, setKey] = useState(asaasKey);
  const [saved, setSaved] = useState(false);
  const save = () => { setAsaasKey(key); setSaved(true); setTimeout(()=>setSaved(false),2500); };

  const integrations = [
    { name:"Asaas", icon:"💳", desc:"Gateway de pagamentos e cobranças recorrentes", status:"Configurar", statusColor:asaasKey?"green":"yellow" },
    { name:"WhatsApp Business", icon:"💬", desc:"Atendimento, qualificação de leads e automações", status:"Em breve", statusColor:"gray" },
    { name:"Agente IA (Claude)", icon:"🤖", desc:"Qualificação automática de leads via WhatsApp", status:"Em breve", statusColor:"gray" },
    { name:"Meta Ads", icon:"📣", desc:"Captura de UTM e cálculo de CAC por campanha", status:"Em breve", statusColor:"gray" },
    { name:"Google Calendar", icon:"📅", desc:"Sincronização de reuniões e agenda fiscal", status:"Em breve", statusColor:"gray" },
    { name:"Clicksign / DocuSign", icon:"✍️", desc:"Assinatura digital de contratos", status:"Em breve", statusColor:"gray" },
    { name:"Gmail / Outlook", icon:"📧", desc:"Envio de comunicados e notificações por e-mail", status:"Em breve", statusColor:"gray" },
  ];

  const automations = [
    { icon:"🤖", title:"Lead novo → Agente IA inicia em 2min", status:"Requer WhatsApp API" },
    { icon:"📞", title:"Sem contato 24h → Criar tarefa de follow-up", status:"Ativo (manual)" },
    { icon:"⏰", title:"Obrigação em 3 dias → Notificar responsável", status:"Ativo (visual)" },
    { icon:"💰", title:"Cobrança vencida → Lembrete automático cliente", status:"Requer WhatsApp API" },
    { icon:"✅", title:"Pagamento confirmado → Emitir NF automaticamente", status:"Requer Asaas + NF" },
    { icon:"🔄", title:"Contrato assinado → Criar checklist de onboarding", status:"Ativo (manual)" },
  ];

  return (
    <div className="fade-up" style={{ maxWidth:760 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Configurações</h1>
        <p style={{ color:T.textSub, fontSize:13 }}>Integrações, automações e preferências do sistema.</p>
      </div>

      {/* Asaas */}
      <Card style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:T.accentGlow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💳</div>
          <div>
            <div style={{ fontFamily:T.head, fontWeight:700, fontSize:16 }}>Asaas — Gateway de Pagamentos</div>
            <div style={{ fontSize:13, color:T.textMuted }}>Sincronize cobranças, webhooks e emissão de NF</div>
          </div>
          <div style={{ marginLeft:"auto" }}><Badge color={asaasKey?"green":"yellow"} dot>{asaasKey?"Conectado":"Não configurado"}</Badge></div>
        </div>
        <Input label="API Key do Asaas" type="password" value={key} onChange={setKey} placeholder="$aact_..." />
        <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>📍 Encontre em: Asaas → Minha Conta → Integrações → Chave de API</div>
        <Btn onClick={save}>{saved?"✓ Salvo com sucesso!":"Salvar API Key"}</Btn>
      </Card>

      {/* Integrações */}
      <Card style={{ padding:0, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.head, fontWeight:700, fontSize:15 }}>Todas as Integrações</div>
        </div>
        {integrations.map((ig,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 24px", borderBottom:`1px solid ${T.border}${i===integrations.length-1?"":""}` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:T.surfaceHigh, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{ig.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{ig.name}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>{ig.desc}</div>
            </div>
            <Badge color={ig.statusColor} size="sm">{ig.status}</Badge>
          </div>
        ))}
      </Card>

      {/* Automações */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.head, fontWeight:700, fontSize:15 }}>Automações Disponíveis</div>
        </div>
        {automations.map((a,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 24px", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontSize:18 }}>{a.icon}</span>
            <div style={{ flex:1, fontSize:13 }}>{a.title}</div>
            <Badge color={a.status.startsWith("Ativo")?"green":"gray"} size="sm">{a.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MARKETING ────────────────────────────────────────────────────────────────
function Marketing({ leads, setLeads }) {
  const [mktLeads, setMktLeads] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm2_mkt_leads") || "[]"); } catch { return []; }
  });
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [simulModal, setSimulModal] = useState(false);
  const [simForm, setSimForm] = useState({ nome:"", whatsapp:"", email:"", tipo_empresa:"ME", servico:"Contabilidade completa" });

  const saveMkt = (list) => { setMktLeads(list); localStorage.setItem("crm2_mkt_leads", JSON.stringify(list)); };

  const refresh = () => {
    try { const fresh = JSON.parse(localStorage.getItem("crm2_mkt_leads") || "[]"); setMktLeads(fresh); } catch {}
  };

  const statusColor = s => ({ Novo:"red", "Em contato":"yellow", Qualificado:"blue", Convertido:"green", Descartado:"gray" })[s] || "gray";

  const updateStatus = (id, status) => {
    const updated = mktLeads.map(l => l.id === id ? { ...l, status_contato: status } : l);
    saveMkt(updated);
  };

  const importarCRM = (lead) => {
    // Check if already imported
    const jaExiste = leads.some(l => l.id === lead.id || l.whatsapp === lead.whatsapp);
    if (jaExiste) { alert("Este lead já existe no CRM."); return; }
    const novoLead = {
      id: lead.id || uid(),
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      email: lead.email,
      fonte: "Landing Page",
      utm_campaign: lead.utm_campaign || "",
      tipo_empresa: lead.tipo_empresa || "ME",
      faturamento_estimado: "10-50k",
      segmento: "",
      regime_tributario_atual: "Não sabe",
      tem_contador_atual: false,
      motivo_troca: "",
      servicos_interesse: lead.servico ? [lead.servico] : [],
      numero_funcionarios: 0,
      etapa: "Novo Lead",
      qualificado_ia: false,
      score: 55,
      reuniao_agendada: false,
      data_reuniao: "",
      responsavel: "Ana Silva",
      observacoes_ia: `Lead captado via Landing Page. Serviço: ${lead.servico || "—"}. Tipo: ${lead.tipo_empresa || "—"}.`,
      observacoes: "",
      motivo_perda: "",
      convertido: false,
      data_entrada: lead.data ? lead.data.split("T")[0] : today(),
      data_ultimo_contato: today(),
      proximo_followup: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    };
    setLeads(p => [novoLead, ...p]);
    const updated = mktLeads.map(l => l.id === lead.id ? { ...l, crm_importado: true, status_contato: "Qualificado" } : l);
    saveMkt(updated);
    if (detail?.id === lead.id) setDetail({ ...lead, crm_importado: true, status_contato: "Qualificado" });
  };

  const deleteLead = (id) => {
    const updated = mktLeads.filter(l => l.id !== id);
    saveMkt(updated);
    setConfirm(null);
    if (detail?.id === id) setDetail(null);
  };

  const simularEnvio = () => {
    if (!simForm.nome || !simForm.whatsapp || !simForm.email) { alert("Preencha nome, WhatsApp e e-mail."); return; }
    const lead = {
      id: "lp_" + Date.now(),
      ...simForm,
      fonte: "Landing Page",
      utm_campaign: "simulado",
      utm_source: "instagram",
      data: new Date().toISOString(),
      status_contato: "Novo",
      crm_importado: false,
    };
    const updated = [lead, ...mktLeads];
    saveMkt(updated);

    // Also inject into CRM leads
    const novoLead = {
      id: lead.id,
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      email: lead.email,
      fonte: "Landing Page",
      utm_campaign: lead.utm_campaign,
      tipo_empresa: lead.tipo_empresa,
      faturamento_estimado: "10-50k",
      segmento: "",
      regime_tributario_atual: "Não sabe",
      tem_contador_atual: false,
      motivo_troca: "",
      servicos_interesse: [lead.servico],
      numero_funcionarios: 0,
      etapa: "Novo Lead",
      qualificado_ia: false,
      score: 55,
      reuniao_agendada: false,
      data_reuniao: "",
      responsavel: "Ana Silva",
      observacoes_ia: `Lead captado via Landing Page. Serviço: ${lead.servico}. Tipo: ${lead.tipo_empresa}.`,
      observacoes: "",
      motivo_perda: "",
      convertido: false,
      data_entrada: today(),
      data_ultimo_contato: today(),
      proximo_followup: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    };
    setLeads(p => [novoLead, ...p]);
    setSimulModal(false);
    setSimForm({ nome:"", whatsapp:"", email:"", tipo_empresa:"ME", servico:"Contabilidade completa" });
  };

  const filtered = mktLeads.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.nome.toLowerCase().includes(q) || l.whatsapp.includes(q) || l.email.toLowerCase().includes(q)) &&
           (filterStatus === "Todos" || l.status_contato === filterStatus);
  });

  const counts = s => mktLeads.filter(l => l.status_contato === s).length;
  const novos = mktLeads.filter(l => l.status_contato === "Novo").length;

  const fmtDataHora = d => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
    } catch { return d; }
  };

  const waMensagem = (lead) => {
    const msg = encodeURIComponent(`Olá ${lead.nome}! Vi que você se cadastrou no nosso site e gostaria de saber mais sobre contabilidade. Como posso te ajudar? 😊`);
    return `https://wa.me/55${lead.whatsapp.replace(/\D/g,"")}?text=${msg}`;
  };

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Marketing & Formulários</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>Leads capturados pela landing page · {mktLeads.length} total · <span style={{ color:novos>0?T.red:T.green, fontWeight:600 }}>{novos} novos</span></p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="ghost" onClick={refresh}>⟳ Atualizar</Btn>
          <Btn variant="soft" onClick={() => setSimulModal(true)}>🧪 Simular envio</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Novos", value:counts("Novo"), color:T.red, icon:"🆕" },
          { label:"Em contato", value:counts("Em contato"), color:T.yellow, icon:"💬" },
          { label:"Qualificados", value:counts("Qualificado"), color:T.accent, icon:"⭐" },
          { label:"Convertidos", value:counts("Convertido"), color:T.green, icon:"✅" },
          { label:"Descartados", value:counts("Descartado"), color:T.textMuted, icon:"🗑" },
        ].map((s,i) => (
          <Card key={i} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:600, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Como funciona */}
      <Card style={{ padding:20, marginBottom:20, background:T.accentGlow, border:`1px solid ${T.accent}33` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:18 }}>📣</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.accent }}>Como funciona a integração com a Landing Page</div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>Quando alguém preenche o formulário da landing page, o lead aparece aqui automaticamente <strong>e também na aba Leads do CRM</strong>. Você pode abrir o WhatsApp com um clique e importar para o pipeline de vendas.</div>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center", fontSize:12, color:T.textMuted, flexWrap:"wrap" }}>
            <span>📝 Formulário preenchido</span>
            <span style={{ color:T.accent }}>→</span>
            <span>📥 Aparece aqui</span>
            <span style={{ color:T.accent }}>→</span>
            <span>💬 WhatsApp 1 clique</span>
            <span style={{ color:T.accent }}>→</span>
            <span>🎯 Entra no CRM</span>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, WhatsApp ou e-mail..." style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 14px", fontSize:13, width:280 }} />
        {["Todos","Novo","Em contato","Qualificado","Convertido","Descartado"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filterStatus===s?T.accent:T.border}`, background:filterStatus===s?T.accentGlow:"transparent", color:filterStatus===s?T.accent:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {s} {s!=="Todos"?`(${counts(s)})` : `(${mktLeads.length})`}
          </button>
        ))}
      </div>

      {/* Lista de leads */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="Nenhum lead da landing page ainda"
            sub="Quando alguém preencher o formulário, aparecerá aqui automaticamente. Use o botão 'Simular envio' para testar."
            action={<Btn onClick={() => setSimulModal(true)}>🧪 Simular envio de formulário</Btn>}
          />
        </Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(lead => (
            <Card key={lead.id} className="hover-lift" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"stretch" }}>
                {/* Barra lateral colorida */}
                <div style={{ width:4, background: lead.status_contato==="Novo"?T.red:lead.status_contato==="Em contato"?T.yellow:lead.status_contato==="Qualificado"?T.accent:lead.status_contato==="Convertido"?T.green:T.textMuted, flexShrink:0 }} />

                <div style={{ flex:1, padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:15 }}>{lead.nome}</span>
                        <Badge color={statusColor(lead.status_contato)} dot size="sm">{lead.status_contato}</Badge>
                        {lead.crm_importado && <Badge color="green" size="sm">✓ No CRM</Badge>}
                        {lead.status_contato === "Novo" && <span style={{ background:T.redDim, color:T.red, border:`1px solid ${T.red}33`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, animation:"pulse 2s infinite" }}>NOVO</span>}
                      </div>
                      <div style={{ display:"flex", gap:16, fontSize:12, color:T.textMuted }}>
                        <span>📱 {lead.whatsapp}</span>
                        <span>✉️ {lead.email}</span>
                        {lead.tipo_empresa && <span>🏢 {lead.tipo_empresa}</span>}
                        {lead.servico && <span>🎯 {lead.servico}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0, marginLeft:16 }}>
                      <div style={{ fontSize:11, color:T.textMuted, fontFamily:T.mono }}>{fmtDataHora(lead.data)}</div>
                      {lead.utm_campaign && <div style={{ fontSize:11, color:T.accent, marginTop:2 }}>📣 {lead.utm_campaign}</div>}
                      {lead.utm_source && <div style={{ fontSize:11, color:T.textMuted }}>via {lead.utm_source}</div>}
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <a href={waMensagem(lead)} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#25d366", color:"white", border:"none", padding:"7px 14px", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", textDecoration:"none", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1ebe5b"}
                      onMouseLeave={e=>e.currentTarget.style.background="#25d366"}>
                      💬 Abrir WhatsApp
                    </a>

                    {!lead.crm_importado && (
                      <Btn size="sm" variant="soft" onClick={() => importarCRM(lead)}>🎯 Importar para CRM</Btn>
                    )}

                    <Btn size="sm" variant="ghost" onClick={() => setDetail(lead)}>👁 Ver detalhes</Btn>

                    {/* Mudar status */}
                    <select
                      value={lead.status_contato || "Novo"}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>
                      {["Novo","Em contato","Qualificado","Convertido","Descartado"].map(s => <option key={s}>{s}</option>)}
                    </select>

                    <Btn size="sm" variant="danger" onClick={() => setConfirm(lead.id)}>🗑</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal detalhe */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalhes do Lead" width={540}>
        {detail && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              <Badge color={statusColor(detail.status_contato)} dot>{detail.status_contato}</Badge>
              {detail.crm_importado && <Badge color="green">✓ Importado para o CRM</Badge>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                ["Nome", detail.nome],
                ["WhatsApp", detail.whatsapp],
                ["E-mail", detail.email],
                ["Tipo de empresa", detail.tipo_empresa || "—"],
                ["Serviço de interesse", detail.servico || "—"],
                ["Campanha", detail.utm_campaign || "—"],
                ["Origem", detail.utm_source || "—"],
                ["Data/Hora", fmtDataHora(detail.data)],
              ].map(([k,v]) => (
                <div key={k} style={{ background:T.bgMid, borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:3, fontWeight:600 }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={() => setDetail(null)}>Fechar</Btn>
              {!detail.crm_importado && <Btn variant="soft" onClick={() => importarCRM(detail)}>🎯 Importar para CRM</Btn>}
              <a href={waMensagem(detail)} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#25d366", color:"white", border:"none", padding:"8px 16px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", textDecoration:"none" }}>
                💬 Abrir WhatsApp
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal simular envio */}
      <Modal open={simulModal} onClose={() => setSimulModal(false)} title="🧪 Simular envio de formulário" width={480}>
        <div style={{ background:T.yellowDim, border:`1px solid ${T.yellow}33`, borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:T.yellow }}>
          Isso simula o que acontece quando alguém preenche o formulário da landing page. O lead aparecerá aqui e também na aba Leads.
        </div>
        <Input label="Nome *" value={simForm.nome} onChange={v => setSimForm(p=>({...p,nome:v}))} placeholder="Ex: João Silva" />
        <Input label="WhatsApp *" value={simForm.whatsapp} onChange={v => setSimForm(p=>({...p,whatsapp:v}))} placeholder="(11) 99999-9999" />
        <Input label="E-mail *" value={simForm.email} onChange={v => setSimForm(p=>({...p,email:v}))} placeholder="joao@empresa.com" />
        <Input label="Tipo de empresa" value={simForm.tipo_empresa} onChange={v => setSimForm(p=>({...p,tipo_empresa:v}))} options={["MEI","ME / Microempresa","EPP","Ltda / S/A","Ainda não abri"]} />
        <Input label="Serviço de interesse" value={simForm.servico} onChange={v => setSimForm(p=>({...p,servico:v}))} options={["Contabilidade completa","Abertura de empresa","Folha de pagamento","BPO Financeiro","Troca de contador","Declaração IR Pessoa Física","Outro"]} />
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <Btn variant="ghost" onClick={() => setSimulModal(false)}>Cancelar</Btn>
          <Btn onClick={simularEnvio}>✓ Simular envio</Btn>
        </div>
      </Modal>

      <Confirm open={!!confirm} msg="Remover este lead da fila de marketing?" onOk={() => deleteLead(confirm)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
function Relatorios({ leads, clients, contratos, financeiro, tickets }) {
  const [tab, setTab] = useState("Financeiro");

  // ── helpers ──
  const mesLabel = (iso) => {
    const [y,m] = iso.split("-");
    return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1]+"/"+y.slice(2);
  };
  const last6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
    }
    return months;
  };
  const months = last6Months();

  // ── Financeiro ──
  const mrrAtual = clients.filter(c=>c.status==="Ativo").reduce((s,c)=>s+c.valor_mensalidade,0);
  const recebidoTotal = financeiro.filter(f=>f.status==="Pago").reduce((s,f)=>s+f.valor,0);
  const vencidoTotal  = financeiro.filter(f=>f.status==="Vencido").reduce((s,f)=>s+f.valor,0);
  const inadimplentes = clients.filter(c=>c.status==="Inadimplente");
  const taxaInadimplencia = clients.length ? Math.round((inadimplentes.length/clients.length)*100) : 0;
  const ticketMedio = clients.filter(c=>c.status==="Ativo").length
    ? Math.round(mrrAtual / clients.filter(c=>c.status==="Ativo").length) : 0;

  const mrrPorMes = months.map(m => ({
    mes: mesLabel(m),
    valor: financeiro.filter(f=>f.vencimento?.startsWith(m)&&f.status==="Pago").reduce((s,f)=>s+f.valor,0),
    vencido: financeiro.filter(f=>f.vencimento?.startsWith(m)&&f.status==="Vencido").reduce((s,f)=>s+f.valor,0),
  }));
  const maxMrr = Math.max(...mrrPorMes.map(m=>m.valor+m.vencido), 1);

  // ── Comercial ──
  const leadsTotal = leads.length;
  const leadsConvertidos = leads.filter(l=>l.convertido||l.etapa==="Contrato Assinado").length;
  const leadsPerdidos = leads.filter(l=>l.etapa==="Perdido").length;
  const taxaConversao = leadsTotal ? Math.round((leadsConvertidos/leadsTotal)*100) : 0;
  const scoresMedio = leadsTotal ? Math.round(leads.reduce((s,l)=>s+(l.score||0),0)/leadsTotal) : 0;

  const porFonte = ["Instagram Ads","Facebook Ads","Indicação","Orgânico","Landing Page","Outro"].map(f => ({
    fonte: f,
    total: leads.filter(l=>l.fonte===f).length,
    convertidos: leads.filter(l=>l.fonte===f&&(l.convertido||l.etapa==="Contrato Assinado")).length,
  })).filter(f=>f.total>0);

  const perdidosPorMotivo = ["Preço","Concorrente","Sem interesse","Sem resposta","Outro"].map(m => ({
    motivo: m,
    n: leads.filter(l=>l.motivo_perda===m).length,
  })).filter(m=>m.n>0);

  const etapasCount = ["Novo Lead","Qualificação (IA)","Contato Humano","Reunião Agendada","Proposta Enviada","Negociação"].map(e=>({
    etapa: e, n: leads.filter(l=>l.etapa===e).length,
  }));
  const maxEtapa = Math.max(...etapasCount.map(e=>e.n),1);

  const leadsPorMes = months.map(m=>({
    mes: mesLabel(m),
    novos: leads.filter(l=>l.data_entrada?.startsWith(m)).length,
    convertidos: leads.filter(l=>l.data_entrada?.startsWith(m)&&(l.convertido||l.etapa==="Contrato Assinado")).length,
  }));
  const maxLeads = Math.max(...leadsPorMes.map(l=>l.novos),1);

  // ── Clientes ──
  const clientesAtivos   = clients.filter(c=>c.status==="Ativo").length;
  const clientesCancelados = clients.filter(c=>c.status==="Cancelado").length;
  const churnRate = clients.length ? Math.round((clientesCancelados/clients.length)*100) : 0;
  const ltv = ticketMedio * 24; // 24 meses média
  const porRegime = ["Simples Nacional","Lucro Presumido","Lucro Real","MEI"].map(r=>({
    regime: r, n: clients.filter(c=>c.regime===r).length,
  })).filter(r=>r.n>0);
  const maxRegime = Math.max(...porRegime.map(r=>r.n),1);
  const porSegmento = [...new Set(clients.map(c=>c.segmento).filter(Boolean))].map(s=>({
    seg: s, n: clients.filter(c=>c.segmento===s).length,
    mrr: clients.filter(c=>c.segmento===s).reduce((x,c)=>x+c.valor_mensalidade,0),
  })).sort((a,b)=>b.mrr-a.mrr);

  // ── Suporte ──
  const tkTotal    = tickets.length;
  const tkResolvidos = tickets.filter(t=>t.status==="Resolvido").length;
  const tkAbertos  = tickets.filter(t=>t.status!=="Resolvido").length;
  const tkUrgentes = tickets.filter(t=>t.prioridade==="Alta"||t.prioridade==="Urgente").length;
  const porTipo = ["Dúvida","Reclamação","Solicitação","Cobrança","Cancelamento"].map(t=>({
    tipo: t, n: tickets.filter(tk=>tk.tipo===t).length,
  })).filter(t=>t.n>0);

  // ── bar chart util ──
  const Bar = ({ pct, color, height=8 }) => (
    <div style={{ flex:1, height, background:T.bgMid, borderRadius:4, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:color, borderRadius:4, transition:"width 0.6s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );

  const SectionTitle = ({ children }) => (
    <div style={{ fontFamily:T.head, fontWeight:700, fontSize:15, marginBottom:16, color:T.text, display:"flex", alignItems:"center", gap:8 }}>
      {children}
    </div>
  );

  const MetricRow = ({ label, value, sub, color=T.text }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}33` }}>
      <span style={{ fontSize:13, color:T.textSub }}>{label}</span>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:T.mono, fontWeight:600, fontSize:15, color }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:T.textMuted }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Relatórios</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>Visão analítica da sua operação para tomada de decisão</p>
        </div>
        <Tabs tabs={["Financeiro","Comercial","Clientes","Suporte"]} active={tab} onChange={setTab} />
      </div>

      {/* ── FINANCEIRO ── */}
      {tab==="Financeiro" && (
        <div className="slide-in">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            <StatCard icon="💰" label="MRR Atual" value={fmt(mrrAtual)} sub="receita recorrente/mês" color={T.accent} />
            <StatCard icon="✅" label="Recebido (total)" value={fmt(recebidoTotal)} sub="cobranças pagas" color={T.green} />
            <StatCard icon="🔴" label="Em atraso" value={fmt(vencidoTotal)} sub={`${inadimplentes.length} clientes`} color={T.red} />
            <StatCard icon="🎯" label="Ticket Médio" value={fmt(ticketMedio)} sub="por cliente ativo" color={T.purple} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:16 }}>
            {/* Gráfico MRR mensal */}
            <Card style={{ padding:22 }}>
              <SectionTitle>📈 Recebimentos — Últimos 6 meses</SectionTitle>
              <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:160 }}>
                {mrrPorMes.map((m,i) => (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, height:"100%" }}>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", width:"100%", gap:2 }}>
                      {m.vencido > 0 && (
                        <div title={`Vencido: ${fmt(m.vencido)}`}
                          style={{ width:"100%", height:`${Math.round((m.vencido/maxMrr)*130)}px`, background:T.red+"88", borderRadius:"4px 4px 0 0", minHeight:3 }} />
                      )}
                      <div title={`Recebido: ${fmt(m.valor)}`}
                        style={{ width:"100%", height:`${Math.round((m.valor/maxMrr)*130)}px`, background:T.accent, borderRadius: m.vencido>0?"0":"4px 4px 0 0", minHeight: m.valor>0?4:0, transition:"height 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize:10, color:T.textMuted, fontFamily:T.mono, whiteSpace:"nowrap" }}>{m.mes}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:16, marginTop:14, fontSize:12, color:T.textMuted }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:T.accent }}/> Recebido</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:T.red+"88" }}/> Vencido</div>
              </div>
            </Card>

            {/* Métricas */}
            <Card style={{ padding:22 }}>
              <SectionTitle>📊 Indicadores Financeiros</SectionTitle>
              <MetricRow label="Taxa de inadimplência" value={`${taxaInadimplencia}%`} sub={`${inadimplentes.length} de ${clients.length} clientes`} color={taxaInadimplencia>10?T.red:T.green} />
              <MetricRow label="LTV estimado (24m)" value={fmt(ltv)} sub="ticket médio × 24 meses" color={T.accent} />
              <MetricRow label="Clientes Ativos" value={clientesAtivos} color={T.green} />
              <MetricRow label="Contratos Ativos" value={contratos.filter(c=>c.status==="Ativo").length} />
              <MetricRow label="NFs emitidas" value={financeiro.filter(f=>f.nf_emitida).length} sub={`de ${financeiro.length} cobranças`} />
            </Card>
          </div>

          {/* Inadimplentes detalhado */}
          {inadimplentes.length > 0 && (
            <Card style={{ padding:22 }}>
              <SectionTitle>⚠️ Clientes Inadimplentes</SectionTitle>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {["Cliente","Mensalidade","Cobranças vencidas","Valor total em atraso","Contato"].map((h,i)=>(
                    <th key={i} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {inadimplentes.map(c => {
                    const vencidas = financeiro.filter(f=>f.cliente_id===c.id&&f.status==="Vencido");
                    const totalAtraso = vencidas.reduce((s,f)=>s+f.valor,0);
                    return (
                      <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}22` }}>
                        <td style={{ padding:"12px", fontWeight:600 }}>{c.nome_fantasia||c.razao_social}</td>
                        <td style={{ padding:"12px", fontFamily:T.mono, color:T.accent }}>{fmt(c.valor_mensalidade)}</td>
                        <td style={{ padding:"12px" }}><Badge color="red">{vencidas.length} mês(es)</Badge></td>
                        <td style={{ padding:"12px", fontFamily:T.mono, fontWeight:700, color:T.red }}>{fmt(totalAtraso)}</td>
                        <td style={{ padding:"12px" }}>
                          <a href={`https://wa.me/55${c.whatsapp_fin?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                            style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#25d366", color:"white", padding:"5px 12px", borderRadius:7, fontSize:12, fontWeight:700, textDecoration:"none" }}>
                            💬 WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── COMERCIAL ── */}
      {tab==="Comercial" && (
        <div className="slide-in">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            <StatCard icon="🎯" label="Total de Leads" value={leadsTotal} sub="captados" color={T.accent} />
            <StatCard icon="✅" label="Convertidos" value={leadsConvertidos} sub={`${taxaConversao}% de conversão`} color={T.green} />
            <StatCard icon="❌" label="Perdidos" value={leadsPerdidos} sub="não fecharam" color={T.red} />
            <StatCard icon="⭐" label="Score Médio" value={scoresMedio} sub="qualidade dos leads" color={T.purple} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:16 }}>
            {/* Leads por mês */}
            <Card style={{ padding:22 }}>
              <SectionTitle>📅 Leads — Últimos 6 meses</SectionTitle>
              <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:150 }}>
                {leadsPorMes.map((m,i)=>(
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, height:"100%" }}>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", width:"100%", gap:2 }}>
                      {m.convertidos>0 && <div title={`Convertidos: ${m.convertidos}`} style={{ width:"100%", height:`${Math.round((m.convertidos/maxLeads)*120)}px`, background:T.green, borderRadius:"3px 3px 0 0", minHeight:3 }} />}
                      <div title={`Novos: ${m.novos}`} style={{ width:"100%", height:`${Math.round(((m.novos-m.convertidos)/maxLeads)*120)}px`, background:T.accent+"88", borderRadius: m.convertidos>0?"0":"3px 3px 0 0", minHeight:m.novos>0?3:0 }} />
                    </div>
                    <div style={{ fontSize:10, color:T.textMuted, fontFamily:T.mono }}>{m.mes}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:16, marginTop:14, fontSize:12, color:T.textMuted }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:T.accent+"88" }}/> Novos leads</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:T.green }}/> Convertidos</div>
              </div>
            </Card>

            {/* Funil de conversão */}
            <Card style={{ padding:22 }}>
              <SectionTitle>🔻 Funil de Conversão</SectionTitle>
              {etapasCount.map((e,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                    <span style={{ color:T.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>{e.etapa}</span>
                    <span style={{ fontFamily:T.mono, color:T.accent, fontWeight:600 }}>{e.n}</span>
                  </div>
                  <Bar pct={(e.n/maxEtapa)*100} color={T.accent} height={6} />
                </div>
              ))}
            </Card>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {/* Por fonte */}
            <Card style={{ padding:22 }}>
              <SectionTitle>📣 Leads por Origem</SectionTitle>
              {porFonte.length===0
                ? <div style={{ color:T.textMuted, fontSize:13 }}>Nenhum dado disponível.</div>
                : porFonte.map((f,i)=>{
                  const taxa = f.total ? Math.round((f.convertidos/f.total)*100) : 0;
                  return (
                    <div key={i} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                        <span style={{ fontWeight:600 }}>{f.fonte}</span>
                        <div style={{ display:"flex", gap:8 }}>
                          <span style={{ color:T.textMuted }}>{f.total} leads</span>
                          <Badge color={taxa>=30?"green":taxa>=10?"yellow":"gray"} size="sm">{taxa}% conv.</Badge>
                        </div>
                      </div>
                      <Bar pct={(f.total/leadsTotal)*100} color={T.purple} height={7} />
                    </div>
                  );
                })}
            </Card>

            {/* Motivos de perda */}
            <Card style={{ padding:22 }}>
              <SectionTitle>❌ Motivos de Perda</SectionTitle>
              {perdidosPorMotivo.length===0
                ? <div style={{ color:T.textMuted, fontSize:13 }}>Nenhum lead perdido registrado.</div>
                : perdidosPorMotivo.map((m,i)=>(
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                      <span style={{ fontWeight:600 }}>{m.motivo}</span>
                      <span style={{ fontFamily:T.mono, color:T.red, fontWeight:600 }}>{m.n}</span>
                    </div>
                    <Bar pct={(m.n/Math.max(1,leadsPerdidos))*100} color={T.red} height={7} />
                  </div>
                ))
              }
            </Card>
          </div>
        </div>
      )}

      {/* ── CLIENTES ── */}
      {tab==="Clientes" && (
        <div className="slide-in">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            <StatCard icon="◉" label="Clientes Ativos" value={clientesAtivos} sub={`de ${clients.length} total`} color={T.green} />
            <StatCard icon="📉" label="Churn Rate" value={`${churnRate}%`} sub={`${clientesCancelados} cancelados`} color={churnRate>10?T.red:T.yellow} />
            <StatCard icon="💰" label="MRR" value={fmt(mrrAtual)} sub="recorrente mensal" color={T.accent} />
            <StatCard icon="⏳" label="LTV Médio (2 anos)" value={fmt(ltv)} sub="estimativa de valor vitalício" color={T.purple} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            {/* Por regime */}
            <Card style={{ padding:22 }}>
              <SectionTitle>📋 Distribuição por Regime Tributário</SectionTitle>
              {porRegime.map((r,i)=>(
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                    <span style={{ fontWeight:600 }}>{r.regime}</span>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontFamily:T.mono, color:T.accent }}>{r.n} clientes</span>
                      <span style={{ fontSize:11, color:T.textMuted }}>{Math.round((r.n/clients.length)*100)}%</span>
                    </div>
                  </div>
                  <Bar pct={(r.n/maxRegime)*100} color={[T.accent,T.green,T.purple,T.yellow][i%4]} height={8} />
                </div>
              ))}
            </Card>

            {/* Por segmento */}
            <Card style={{ padding:22 }}>
              <SectionTitle>🏢 MRR por Segmento</SectionTitle>
              {porSegmento.length===0
                ? <div style={{ color:T.textMuted, fontSize:13 }}>Nenhum segmento cadastrado.</div>
                : porSegmento.map((s,i)=>(
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                      <span style={{ fontWeight:600 }}>{s.seg}</span>
                      <div style={{ display:"flex", gap:8 }}>
                        <span style={{ fontFamily:T.mono, color:T.accent }}>{fmt(s.mrr)}</span>
                        <span style={{ fontSize:11, color:T.textMuted }}>{s.n} cli.</span>
                      </div>
                    </div>
                    <Bar pct={(s.mrr/Math.max(1,mrrAtual))*100} color={T.green} height={8} />
                  </div>
                ))
              }
            </Card>
          </div>

          {/* Ranking de clientes */}
          <Card style={{ padding:22 }}>
            <SectionTitle>🏆 Ranking de Clientes por MRR</SectionTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {["#","Cliente","Regime","Serviços","MRR","Status","Desde"].map((h,i)=>(
                  <th key={i} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...clients].sort((a,b)=>b.valor_mensalidade-a.valor_mensalidade).map((c,i)=>(
                  <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}22` }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px", fontFamily:T.mono, color:T.textMuted, fontSize:13 }}>#{i+1}</td>
                    <td style={{ padding:"12px", fontWeight:600, fontSize:13 }}>{c.nome_fantasia||c.razao_social}</td>
                    <td style={{ padding:"12px", fontSize:12, color:T.textSub }}>{c.regime}</td>
                    <td style={{ padding:"12px" }}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {c.servicos.slice(0,2).map(s=><Badge key={s} color="blue" size="sm">{s}</Badge>)}
                        {c.servicos.length>2&&<Badge color="gray" size="sm">+{c.servicos.length-2}</Badge>}
                      </div>
                    </td>
                    <td style={{ padding:"12px", fontFamily:T.mono, fontWeight:700, color:T.accent }}>{fmt(c.valor_mensalidade)}</td>
                    <td style={{ padding:"12px" }}>
                      <Badge color={c.status==="Ativo"?"green":c.status==="Inadimplente"?"red":"gray"} dot>{c.status}</Badge>
                    </td>
                    <td style={{ padding:"12px", fontSize:12, color:T.textMuted, fontFamily:T.mono }}>{fmtDate(c.data_entrada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── SUPORTE ── */}
      {tab==="Suporte" && (
        <div className="slide-in">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
            <StatCard icon="🎫" label="Total de Tickets" value={tkTotal} color={T.accent} />
            <StatCard icon="✅" label="Resolvidos" value={tkResolvidos} sub={tkTotal?`${Math.round((tkResolvidos/tkTotal)*100)}% resolução`:"—"} color={T.green} />
            <StatCard icon="🔴" label="Em aberto" value={tkAbertos} sub="precisam de atenção" color={T.red} />
            <StatCard icon="⚡" label="Alta prioridade" value={tkUrgentes} sub="urgentes/altos" color={T.yellow} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Card style={{ padding:22 }}>
              <SectionTitle>📂 Tickets por Tipo</SectionTitle>
              {porTipo.length===0
                ? <div style={{ color:T.textMuted, fontSize:13 }}>Nenhum ticket registrado.</div>
                : porTipo.map((t,i)=>(
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                      <span style={{ fontWeight:600 }}>{t.tipo}</span>
                      <span style={{ fontFamily:T.mono, color:T.accent, fontWeight:600 }}>{t.n}</span>
                    </div>
                    <Bar pct={(t.n/Math.max(1,tkTotal))*100} color={T.accent} height={7} />
                  </div>
                ))
              }
            </Card>

            <Card style={{ padding:22 }}>
              <SectionTitle>👥 Tickets por Cliente</SectionTitle>
              {[...new Set(tickets.map(t=>t.cliente_id))].filter(Boolean).map(cid=>{
                const cl = clients.find(c=>c.id===cid);
                const n = tickets.filter(t=>t.cliente_id===cid).length;
                const abertos = tickets.filter(t=>t.cliente_id===cid&&t.status!=="Resolvido").length;
                return cl ? (
                  <div key={cid} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}33` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{cl.nome_fantasia||cl.razao_social}</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{n} ticket(s) total</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {abertos>0 && <Badge color="red" size="sm">{abertos} aberto(s)</Badge>}
                      <Badge color="gray" size="sm">{n} total</Badge>
                    </div>
                  </div>
                ) : null;
              })}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const CHECKLIST_TEMPLATE = [
  { grupo:"📋 Documentos", itens:[
    "Contrato social / DAC-E atualizado",
    "Cartão CNPJ (Receita Federal)",
    "RG e CPF do(s) sócio(s)",
    "Comprovante de endereço da empresa",
    "Inscrição Estadual (se aplicável)",
    "Inscrição Municipal / Alvará",
  ]},
  { grupo:"🔐 Acessos e Sistemas", itens:[
    "Procuração e-CAC (Receita Federal)",
    "Acesso ao portal eSocial",
    "Acesso SPED / EFD",
    "Login no portal do município (ISS)",
    "Acesso ao sistema de folha de pagamento",
    "Dados bancários da empresa",
  ]},
  { grupo:"💰 Financeiro e Cobrança", itens:[
    "Cadastrar cliente no Asaas",
    "Configurar cobrança recorrente",
    "Confirmar dia de vencimento",
    "Verificar forma de pagamento preferida",
  ]},
  { grupo:"⚙️ Configuração Interna", itens:[
    "Definir contador responsável",
    "Cadastrar cliente nos sistemas internos",
    "Criar pasta de documentos do cliente",
    "Realizar reunião de boas-vindas",
    "Enviar mensagem de boas-vindas no WhatsApp",
  ]},
];

function Onboarding({ clients, contratos, setClients }) {
  const [onboardings, setOnboardings] = useLs("crm2_onboardings", []);
  const [selected, setSelected] = useState(null);
  const [modalNew, setModalNew] = useState(false);
  const [clienteSel, setClienteSel] = useState("");
  const [search, setSearch] = useState("");

  // Clientes sem onboarding ativo
  const semOnboarding = clients.filter(c =>
    c.status === "Ativo" && !onboardings.some(o => o.cliente_id === c.id)
  );

  const criarOnboarding = () => {
    if (!clienteSel) return;
    const cl = clients.find(c => c.id === clienteSel);
    const ct = contratos.find(c => c.cliente_id === clienteSel && c.status === "Ativo");
    const checklist = CHECKLIST_TEMPLATE.map(grupo => ({
      grupo: grupo.grupo,
      itens: grupo.itens.map(item => ({ texto: item, feito: false, data: "" })),
    }));
    const novo = {
      id: uid(),
      cliente_id: clienteSel,
      cliente_nome: cl?.razao_social || "",
      cliente_fantasia: cl?.nome_fantasia || cl?.razao_social || "",
      contrato_id: ct?.id || "",
      data_inicio: today(),
      prazo: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      status: "Em andamento",
      responsavel: cl?.responsavel || "Ana Silva",
      checklist,
      observacoes: "",
    };
    setOnboardings(p => [novo, ...p]);
    setModalNew(false);
    setClienteSel("");
    setSelected(novo);
  };

  const toggleItem = (obId, gIdx, iIdx) => {
    setOnboardings(prev => prev.map(ob => {
      if (ob.id !== obId) return ob;
      const checklist = ob.checklist.map((g, gi) => gi !== gIdx ? g : {
        ...g,
        itens: g.itens.map((it, ii) => ii !== iIdx
          ? it
          : { ...it, feito: !it.feito, data: !it.feito ? today() : "" }
        ),
      });
      const total = checklist.reduce((s, g) => s + g.itens.length, 0);
      const feitos = checklist.reduce((s, g) => s + g.itens.filter(i => i.feito).length, 0);
      const status = feitos === total ? "Concluído" : "Em andamento";
      const updated = { ...ob, checklist, status };
      if (selected?.id === obId) setSelected(updated);
      return updated;
    }));
  };

  const deleteOnboarding = id => {
    setOnboardings(p => p.filter(o => o.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const pct = ob => {
    const total = ob.checklist.reduce((s, g) => s + g.itens.length, 0);
    const feitos = ob.checklist.reduce((s, g) => s + g.itens.filter(i => i.feito).length, 0);
    return total ? Math.round((feitos / total) * 100) : 0;
  };

  const filtered = onboardings.filter(o =>
    !search || o.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente_fantasia.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = s => ({ "Em andamento":"blue", Concluído:"green", Atrasado:"red" })[s] || "gray";

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Onboarding de Clientes</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>
            {onboardings.filter(o=>o.status==="Em andamento").length} em andamento ·{" "}
            {onboardings.filter(o=>o.status==="Concluído").length} concluídos ·{" "}
            {semOnboarding.length} clientes sem onboarding
          </p>
        </div>
        <Btn onClick={() => setModalNew(true)}>+ Iniciar Onboarding</Btn>
      </div>

      {semOnboarding.length > 0 && (
        <div style={{ background:T.yellowDim, border:`1px solid ${T.yellow}33`, borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:T.yellow, fontSize:14 }}>
              {semOnboarding.length} cliente(s) ativo(s) sem onboarding iniciado
            </div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>
              {semOnboarding.slice(0,3).map(c=>c.nome_fantasia||c.razao_social).join(", ")}
              {semOnboarding.length > 3 ? ` e mais ${semOnboarding.length-3}...` : ""}
            </div>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => setModalNew(true)}>Iniciar agora</Btn>
        </div>
      )}

      <div style={{ display:"flex", gap:16 }}>
        {/* Lista */}
        <div style={{ width:320, flexShrink:0 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"8px 14px", fontSize:13, width:"100%", marginBottom:12 }} />
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.length === 0 && (
              <EmptyState icon="🚀" title="Nenhum onboarding" sub="Inicie o primeiro onboarding de um cliente." />
            )}
            {filtered.map(ob => {
              const p = pct(ob);
              const isSelected = selected?.id === ob.id;
              return (
                <div key={ob.id} onClick={() => setSelected(ob)}
                  style={{ background: isSelected ? T.accentGlow : T.surface, border:`1px solid ${isSelected ? T.accent+"66" : T.border}`, borderRadius:12, padding:16, cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:13, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {ob.cliente_fantasia || ob.cliente_nome}
                    </div>
                    <Badge color={statusColor(ob.status)} size="sm">{ob.status}</Badge>
                  </div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:10 }}>
                    Iniciado {fmtDate(ob.data_inicio)} · Prazo {fmtDate(ob.prazo)}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:5, background:T.bgMid, borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ height:"100%", width:`${p}%`, background: p===100?T.green:T.accent, borderRadius:3, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontSize:11, color: p===100?T.green:T.textMuted, fontFamily:T.mono }}>{p}% concluído</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhe */}
        <div style={{ flex:1 }}>
          {!selected ? (
            <Card style={{ height:400, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <EmptyState icon="👈" title="Selecione um onboarding" sub="Clique em um cliente à esquerda para ver o checklist." />
            </Card>
          ) : (
            <Card style={{ padding:0, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.border}`, background:T.surfaceHigh }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <div style={{ fontFamily:T.head, fontWeight:800, fontSize:18 }}>{selected.cliente_fantasia || selected.cliente_nome}</div>
                    <div style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
                      Responsável: {selected.responsavel} · Prazo: {fmtDate(selected.prazo)}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Badge color={statusColor(selected.status)} dot>{selected.status}</Badge>
                    <Btn size="sm" variant="danger" onClick={() => deleteOnboarding(selected.id)}>🗑</Btn>
                  </div>
                </div>
                {/* Progress */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, height:8, background:T.bgMid, borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct(selected)}%`, background: pct(selected)===100?T.green:T.accent, borderRadius:4, transition:"width 0.4s" }} />
                  </div>
                  <span style={{ fontFamily:T.mono, fontSize:14, fontWeight:600, color: pct(selected)===100?T.green:T.accent, width:40, textAlign:"right" }}>
                    {pct(selected)}%
                  </span>
                </div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>
                  {selected.checklist.reduce((s,g)=>s+g.itens.filter(i=>i.feito).length,0)} de{" "}
                  {selected.checklist.reduce((s,g)=>s+g.itens.length,0)} itens concluídos
                </div>
              </div>

              {/* Checklist */}
              <div style={{ padding:24, overflowY:"auto", maxHeight:"calc(100vh - 320px)" }}>
                {selected.checklist.map((grupo, gi) => (
                  <div key={gi} style={{ marginBottom:24 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.textSub, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                      {grupo.grupo}
                      <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMuted }}>
                        ({grupo.itens.filter(i=>i.feito).length}/{grupo.itens.length})
                      </span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {grupo.itens.map((item, ii) => (
                        <div key={ii} onClick={() => toggleItem(selected.id, gi, ii)}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background: item.feito ? T.greenDim : T.bgMid, border:`1px solid ${item.feito ? T.green+"44" : T.border}`, borderRadius:9, cursor:"pointer", transition:"all 0.15s" }}>
                          <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${item.feito ? T.green : T.border}`, background: item.feito ? T.green : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                            {item.feito && <span style={{ color:"#0a0f1e", fontSize:11, fontWeight:900 }}>✓</span>}
                          </div>
                          <span style={{ flex:1, fontSize:13, color: item.feito ? T.green : T.text, textDecoration: item.feito ? "line-through" : "none", transition:"all 0.15s" }}>
                            {item.texto}
                          </span>
                          {item.feito && item.data && (
                            <span style={{ fontSize:11, color:T.textMuted, fontFamily:T.mono, flexShrink:0 }}>{fmtDate(item.data)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal novo onboarding */}
      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Iniciar Onboarding" width={480}>
        <div style={{ background:T.accentGlow, border:`1px solid ${T.accent}33`, borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:T.textSub }}>
          O checklist completo de {CHECKLIST_TEMPLATE.reduce((s,g)=>s+g.itens.length,0)} itens será criado automaticamente com base no template padrão.
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:6 }}>Selecionar Cliente *</label>
          <select value={clienteSel} onChange={e=>setClienteSel(e.target.value)}
            style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"10px 13px", width:"100%", fontSize:13 }}>
            <option value="">Selecionar...</option>
            {clients.filter(c=>c.status==="Ativo").map(c=>(
              <option key={c.id} value={c.id}>{c.razao_social}{!onboardings.some(o=>o.cliente_id===c.id) ? " ⚠ sem onboarding" : ""}</option>
            ))}
          </select>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={()=>setModalNew(false)}>Cancelar</Btn>
          <Btn onClick={criarOnboarding} disabled={!clienteSel}>🚀 Criar Checklist</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── RÉGUA DE COBRANÇA ────────────────────────────────────────────────────────
const REGUA_STEPS = [
  { dia:1,   label:"Dia 1",   titulo:"Lembrete amigável",      tipo:"yellow", icon:"💬",
    mensagem:(n,v)=>`Olá ${n}! 😊 Passando para lembrar que sua mensalidade de ${fmt(v)} venceu hoje. Qualquer dúvida estou à disposição!`,
    acao:"Enviar WhatsApp — tom amigável" },
  { dia:3,   label:"Dia 3",   titulo:"Segundo contato",        tipo:"yellow", icon:"📱",
    mensagem:(n,v)=>`Olá ${n}, tudo bem? Identificamos que a mensalidade de ${fmt(v)} ainda está em aberto. Podemos ajudar com alguma dificuldade?`,
    acao:"Enviar WhatsApp — perguntar se há dificuldade" },
  { dia:7,   label:"Dia 7",   titulo:"Contato formal",         tipo:"yellow", icon:"📧",
    mensagem:(n,v)=>`${n}, sua mensalidade de ${fmt(v)} está em aberto há 7 dias. Para regularizar, entre em contato o quanto antes para evitar suspensão dos serviços.`,
    acao:"WhatsApp + E-mail formal" },
  { dia:15,  label:"Dia 15",  titulo:"Notificação de suspensão",tipo:"red",   icon:"⚠️",
    mensagem:(n,v)=>`${n}, informamos que a mensalidade de ${fmt(v)} está em aberto há 15 dias. Caso não haja regularização em 5 dias úteis, os serviços serão suspensos.`,
    acao:"WhatsApp + E-mail — avisar suspensão" },
  { dia:30,  label:"Dia 30",  titulo:"Decisão: suspender ou negociar", tipo:"red", icon:"🔴",
    mensagem:(n,v)=>`${n}, infelizmente os serviços foram suspensos por falta de pagamento (${fmt(v)} em atraso). Entre em contato para regularização ou encerramento do contrato.`,
    acao:"Decisão interna: suspender serviços ou negociar" },
];

function Cobranca({ clients, financeiro, setFinanceiro }) {
  const inadimplentes = clients.filter(c => c.status === "Inadimplente");
  const [selected, setSelected] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [historicos, setHistoricos] = useLs("crm2_cobranca_hist", {});
  const [nota, setNota] = useState("");
  const [modalNota, setModalNota] = useState(null);

  const getVencidas = (clienteId) =>
    financeiro.filter(f => f.cliente_id === clienteId && f.status === "Vencido");

  const getDiasAtraso = (clienteId) => {
    const venc = getVencidas(clienteId);
    if (!venc.length) return 0;
    const mais_antiga = venc.reduce((a,b) => a.vencimento < b.vencimento ? a : b);
    return Math.floor((Date.now() - new Date(mais_antiga.vencimento).getTime()) / 86400000);
  };

  const getStepAtual = (dias) => {
    let step = REGUA_STEPS[0];
    for (const s of REGUA_STEPS) { if (dias >= s.dia) step = s; }
    return step;
  };

  const getProxStep = (dias) => REGUA_STEPS.find(s => s.dia > dias) || null;

  const registrarContato = (clienteId, stepDia) => {
    const key = clienteId;
    const h = historicos[key] || [];
    const novo = { dia: stepDia, data: today(), tipo: `Dia ${stepDia}` };
    setHistoricos(p => ({ ...p, [key]: [novo, ...h] }));
    setConfirmar(null);
  };

  const adicionarNota = () => {
    if (!nota.trim() || !modalNota) return;
    const h = historicos[modalNota] || [];
    setHistoricos(p => ({ ...p, [modalNota]: [{ dia:0, data:today(), tipo:"Nota", texto:nota }, ...h] }));
    setNota("");
    setModalNota(null);
  };

  const marcarNegociado = (clienteId) => {
    setFinanceiro(p => p.map(f =>
      f.cliente_id === clienteId && f.status === "Vencido"
        ? { ...f, status: "Pago", data_pagamento: today(), obs: "Negociado / regularizado" }
        : f
    ));
  };

  const cl = selected ? clients.find(c => c.id === selected) : null;
  const vencidas = selected ? getVencidas(selected) : [];
  const totalAtraso = vencidas.reduce((s,f) => s+f.valor, 0);
  const diasAtraso = selected ? getDiasAtraso(selected) : 0;
  const stepAtual = selected ? getStepAtual(diasAtraso) : null;
  const proxStep = selected ? getProxStep(diasAtraso) : null;
  const hist = selected ? (historicos[selected] || []) : [];

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Régua de Cobrança</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>
            {inadimplentes.length} cliente(s) inadimplente(s) ·{" "}
            {fmt(inadimplentes.map(c=>getVencidas(c.id).reduce((s,f)=>s+f.valor,0)).reduce((s,v)=>s+v,0))} em aberto
          </p>
        </div>
      </div>

      {inadimplentes.length === 0 ? (
        <Card>
          <EmptyState icon="🎉" title="Nenhum inadimplente!" sub="Todos os seus clientes estão em dia. Continue assim." />
        </Card>
      ) : (
        <div style={{ display:"flex", gap:16 }}>
          {/* Lista de inadimplentes */}
          <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}>
            {inadimplentes.map(c => {
              const dias = getDiasAtraso(c.id);
              const step = getStepAtual(dias);
              const total = getVencidas(c.id).reduce((s,f)=>s+f.valor,0);
              const isSelected = selected === c.id;
              return (
                <div key={c.id} onClick={() => setSelected(c.id)}
                  style={{ background: isSelected ? T.redDim : T.surface, border:`1px solid ${isSelected ? T.red+"66" : T.border}`, borderRadius:12, padding:16, cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:13, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.nome_fantasia || c.razao_social}
                    </div>
                    <Badge color={step.tipo==="red"?"red":"yellow"} size="sm">{step.label}</Badge>
                  </div>
                  <div style={{ fontFamily:T.mono, fontWeight:700, color:T.red, fontSize:14, marginBottom:4 }}>{fmt(total)}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{dias} dias em atraso · {getVencidas(c.id).length} fatura(s)</div>
                </div>
              );
            })}
          </div>

          {/* Detalhe régua */}
          <div style={{ flex:1 }}>
            {!selected ? (
              <Card style={{ height:400, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <EmptyState icon="👈" title="Selecione um cliente" sub="Clique em um inadimplente para ver a régua." />
              </Card>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Header do cliente */}
                <Card style={{ padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:T.head, fontWeight:800, fontSize:18 }}>{cl?.nome_fantasia || cl?.razao_social}</div>
                      <div style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
                        {cl?.responsavel} · {cl?.whatsapp_fin}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:T.mono, fontWeight:700, fontSize:20, color:T.red }}>{fmt(totalAtraso)}</div>
                      <div style={{ fontSize:12, color:T.textMuted }}>{diasAtraso} dias em atraso</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <a href={`https://wa.me/55${cl?.whatsapp_fin?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#25d366", color:"white", padding:"8px 16px", borderRadius:8, fontWeight:700, fontSize:13, textDecoration:"none" }}>
                      💬 Abrir WhatsApp
                    </a>
                    <Btn size="md" variant="success" onClick={() => marcarNegociado(selected)}>✅ Marcar como regularizado</Btn>
                    <Btn size="md" variant="ghost" onClick={() => setModalNota(selected)}>📝 Adicionar nota</Btn>
                  </div>
                </Card>

                {/* Linha do tempo da régua */}
                <Card style={{ padding:22 }}>
                  <div style={{ fontFamily:T.head, fontWeight:700, fontSize:15, marginBottom:20 }}>📋 Régua de Cobrança</div>
                  <div style={{ position:"relative" }}>
                    {/* Linha vertical */}
                    <div style={{ position:"absolute", left:19, top:24, bottom:24, width:2, background:T.border }} />
                    {REGUA_STEPS.map((step, i) => {
                      const ativo = diasAtraso >= step.dia;
                      const atual = stepAtual?.dia === step.dia;
                      const jaContatado = hist.some(h => h.dia === step.dia);
                      return (
                        <div key={i} style={{ display:"flex", gap:16, marginBottom:20, position:"relative" }}>
                          {/* Ícone */}
                          <div style={{ width:40, height:40, borderRadius:"50%", background: atual ? T.red : ativo ? T.surfaceTop : T.bgMid, border:`2px solid ${atual ? T.red : ativo ? T.borderLight : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, zIndex:1, transition:"all 0.2s" }}>
                            {step.icon}
                          </div>
                          {/* Conteúdo */}
                          <div style={{ flex:1, background: atual ? T.redDim : ativo ? T.surfaceHigh : T.bgMid, border:`1px solid ${atual ? T.red+"44" : T.border}`, borderRadius:12, padding:16, opacity: ativo ? 1 : 0.5 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div>
                                <span style={{ fontFamily:T.mono, fontSize:11, color: step.tipo==="red"?T.red:T.yellow, fontWeight:700, marginRight:8 }}>{step.label}</span>
                                <span style={{ fontWeight:700, fontSize:14 }}>{step.titulo}</span>
                                {atual && <Badge color="red" size="sm" style={{ marginLeft:8 }}>ETAPA ATUAL</Badge>}
                              </div>
                              {jaContatado && <Badge color="green" size="sm">✓ Feito</Badge>}
                            </div>
                            {/* Mensagem sugerida */}
                            <div style={{ background:T.bg, borderRadius:8, padding:"10px 14px", fontSize:12, color:T.textSub, fontStyle:"italic", marginBottom:10, lineHeight:1.6 }}>
                              "{step.mensagem(cl?.nome_fantasia?.split(" ")[0] || "Cliente", cl?.valor_mensalidade || 0)}"
                            </div>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:12, color:T.textMuted }}>📌 {step.acao}</span>
                              {ativo && !jaContatado && (
                                <Btn size="sm" variant="soft" onClick={() => setConfirmar({ clienteId:selected, stepDia:step.dia, nome:cl?.nome_fantasia, tel:cl?.whatsapp_fin, msg:step.mensagem(cl?.nome_fantasia?.split(" ")[0]||"Cliente", cl?.valor_mensalidade||0) })}>
                                  ✓ Registrar contato
                                </Btn>
                              )}
                              {jaContatado && <span style={{ fontSize:11, color:T.green }}>Registrado em {hist.find(h=>h.dia===step.dia)?.data}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {proxStep && (
                    <div style={{ background:T.yellowDim, border:`1px solid ${T.yellow}33`, borderRadius:10, padding:"12px 16px", marginTop:8, fontSize:13, color:T.yellow }}>
                      ⏭ Próximo passo: <strong>{proxStep.titulo}</strong> em {proxStep.dia - diasAtraso} dia(s) (Dia {proxStep.dia})
                    </div>
                  )}
                </Card>

                {/* Histórico de contatos */}
                {hist.length > 0 && (
                  <Card style={{ padding:22 }}>
                    <div style={{ fontFamily:T.head, fontWeight:700, fontSize:15, marginBottom:14 }}>📅 Histórico de Contatos</div>
                    {hist.map((h, i) => (
                      <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${T.border}33` }}>
                        <div style={{ width:32, height:32, borderRadius:8, background: h.tipo==="Nota"?T.purpleDim:T.greenDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                          {h.tipo==="Nota"?"📝":"✓"}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{h.tipo}</div>
                          <div style={{ fontSize:12, color:T.textMuted }}>{fmtDate(h.data)}{h.texto ? ` — ${h.texto}` : ""}</div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmar contato */}
      <Modal open={!!confirmar} onClose={() => setConfirmar(null)} title="Registrar Contato" width={500}>
        {confirmar && (
          <div>
            <div style={{ background:T.greenDim, border:`1px solid ${T.green}33`, borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:T.green }}>
              ✓ Após enviar a mensagem, clique em confirmar para registrar no histórico.
            </div>
            <div style={{ background:T.bgMid, borderRadius:10, padding:14, marginBottom:20, fontSize:13, color:T.textSub, fontStyle:"italic", lineHeight:1.6 }}>
              "{confirmar.msg}"
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={() => setConfirmar(null)}>Cancelar</Btn>
              <a href={`https://wa.me/55${confirmar.tel?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#25d366", color:"white", padding:"8px 16px", borderRadius:8, fontWeight:700, fontSize:13, textDecoration:"none" }}>
                💬 Enviar no WhatsApp
              </a>
              <Btn onClick={() => registrarContato(confirmar.clienteId, confirmar.stepDia)}>✓ Confirmar registro</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal nota */}
      <Modal open={!!modalNota} onClose={() => setModalNota(null)} title="Adicionar Nota" width={440}>
        <Input label="Nota / observação" rows={3} value={nota} onChange={setNota} placeholder="Ex: Cliente pediu prazo até dia 10..." />
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={() => setModalNota(null)}>Cancelar</Btn>
          <Btn onClick={adicionarNota}>Salvar nota</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── USUÁRIOS & PERMISSÕES ────────────────────────────────────────────────────
const PERFIS = {
  Admin:      { label:"Admin",      color:"red",    icon:"👑", desc:"Acesso total ao sistema" },
  Gestor:     { label:"Gestor",     color:"purple", icon:"🎯", desc:"Acesso total exceto configurações sensíveis" },
  Contador:   { label:"Contador",   color:"blue",   icon:"📊", desc:"Apenas seus clientes e operação" },
  Comercial:  { label:"Comercial",  color:"yellow", icon:"🎤", desc:"Leads, Marketing e Pipeline" },
};

const PERMISSOES = {
  Admin:     { dashboard:true, marketing:true, leads:true, clientes:true, contratos:true, financeiro:true, tickets:true, documentos:true, onboarding:true, cobranca:true, relatorios:true, config:true, usuarios:true },
  Gestor:    { dashboard:true, marketing:true, leads:true, clientes:true, contratos:true, financeiro:true, tickets:true, documentos:true, onboarding:true, cobranca:true, relatorios:true, config:false, usuarios:false },
  Contador:  { dashboard:true, marketing:false, leads:false, clientes:true, contratos:false, financeiro:false, tickets:true, documentos:true, onboarding:true, cobranca:false, relatorios:false, config:false, usuarios:false },
  Comercial: { dashboard:true, marketing:true, leads:true, clientes:false, contratos:false, financeiro:false, tickets:false, documentos:false, onboarding:false, cobranca:false, relatorios:false, config:false, usuarios:false },
};

const SEED_USUARIOS = [
  { id:"u1", nome:"Você (Admin)", email:"admin@contafacil.com", senha:"admin123", perfil:"Admin", ativo:true, avatar:"A", cor:T.red, data_criacao:"2024-01-01" },
  { id:"u2", nome:"Ana Silva", email:"ana@contafacil.com", senha:"ana123", perfil:"Contador", ativo:true, avatar:"AS", cor:T.accent, data_criacao:"2024-01-15" },
  { id:"u3", nome:"Pedro Costa", email:"pedro@contafacil.com", senha:"pedro123", perfil:"Contador", ativo:true, avatar:"PC", cor:T.green, data_criacao:"2024-02-01" },
];

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setErro(""); setLoading(true);
    setTimeout(() => {
      try {
        const usuarios = JSON.parse(localStorage.getItem("crm2_usuarios") || JSON.stringify(SEED_USUARIOS));
        const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha && u.ativo);
        if (user) {
          localStorage.setItem("crm2_session", JSON.stringify({ userId: user.id, ts: Date.now() }));
          onLogin(user);
        } else {
          setErro("E-mail ou senha incorretos. Verifique e tente novamente.");
        }
      } catch { setErro("Erro ao autenticar. Tente novamente."); }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ position:"fixed", inset:0, background:`radial-gradient(ellipse 60% 50% at 50% 0%, ${T.accent}15, transparent 70%)`, pointerEvents:"none" }} />
      <div className="fade-up" style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.head, fontWeight:800, fontSize:26, color:"#fff", margin:"0 auto 16px" }}>C</div>
          <div style={{ fontFamily:T.head, fontWeight:800, fontSize:24, color:T.text }}>ContaFácil CRM</div>
          <div style={{ fontSize:14, color:T.textMuted, marginTop:4 }}>Faça login para continuar</div>
        </div>

        {/* Card */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:32, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:6 }}>E-MAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="seu@email.com"
              style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, padding:"12px 14px", width:"100%", fontSize:14 }} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:6 }}>SENHA</label>
            <div style={{ position:"relative" }}>
              <input type={show?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••"
                style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, padding:"12px 44px 12px 14px", width:"100%", fontSize:14 }} />
              <button onClick={()=>setShow(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:16 }}>
                {show?"🙈":"👁"}
              </button>
            </div>
          </div>

          {erro && (
            <div style={{ background:T.redDim, border:`1px solid ${T.red}33`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.red }}>
              {erro}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading||!email||!senha}
            style={{ width:"100%", background:loading?T.surfaceTop:T.accent, color: loading?T.textMuted:"#fff", border:"none", borderRadius:10, padding:"13px", fontFamily:T.head, fontWeight:700, fontSize:15, cursor:loading||!email||!senha?"not-allowed":"pointer", transition:"all 0.2s", opacity:!email||!senha?0.5:1 }}>
            {loading ? "Entrando..." : "Entrar →"}
          </button>

          {/* Dica de usuários */}
          <div style={{ marginTop:24, background:T.bgMid, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Usuários de demonstração</div>
            {SEED_USUARIOS.map(u=>(
              <div key={u.id} onClick={()=>{ setEmail(u.email); setSenha(u.senha); }}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${T.border}33`, cursor:"pointer" }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{u.nome}</span>
                  <span style={{ fontSize:11, color:T.textMuted, marginLeft:6 }}>{u.email}</span>
                </div>
                <Badge color={({Admin:"red",Gestor:"purple",Contador:"blue",Comercial:"yellow"})[u.perfil]||"gray"} size="sm">{u.perfil}</Badge>
              </div>
            ))}
            <div style={{ fontSize:11, color:T.textMuted, marginTop:8 }}>↑ Clique para preencher automaticamente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Usuarios({ currentUser }) {
  const [usuarios, setUsuarios] = useLs("crm2_usuarios", SEED_USUARIOS);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [f, sf] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [showSenha, setShowSenha] = useState(false);

  const isAdmin = currentUser?.perfil === "Admin";

  const openNew = () => { sf({ nome:"", email:"", senha:"", perfil:"Contador", ativo:true }); setSelected(null); setModal("form"); };
  const openEdit = u => { setSelected(u); sf({...u}); setModal("form"); };

  const save = () => {
    if (!f.nome || !f.email) return;
    if (modal==="new" || !selected) {
      if (!f.senha) { alert("Defina uma senha para o novo usuário."); return; }
      setUsuarios(p=>[...p,{...f, id:uid(), data_criacao:today(), avatar:f.nome.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), cor:[T.accent,T.green,T.purple,T.yellow][Math.floor(Math.random()*4)] }]);
    } else {
      setUsuarios(p=>p.map(u=>u.id===selected.id?{...u,...f}:u));
    }
    setModal(null); setSelected(null);
  };

  const toggleAtivo = id => {
    if (id === currentUser?.id) { alert("Você não pode desativar sua própria conta."); return; }
    setUsuarios(p=>p.map(u=>u.id===id?{...u,ativo:!u.ativo}:u));
  };
  const del = id => {
    if (id === currentUser?.id) { alert("Você não pode excluir sua própria conta."); return; }
    setUsuarios(p=>p.filter(u=>u.id!==id)); setConfirm(null);
  };

  const perfilColor = p => ({Admin:"red",Gestor:"purple",Contador:"blue",Comercial:"yellow"})[p]||"gray";

  const permRows = [
    ["Dashboard","dashboard"], ["Marketing","marketing"], ["Leads","leads"],
    ["Clientes","clientes"], ["Contratos","contratos"], ["Financeiro","financeiro"],
    ["Suporte","tickets"], ["Documentos","documentos"], ["Onboarding","onboarding"],
    ["Régua de Cobrança","cobranca"], ["Relatórios","relatorios"], ["Configurações","config"],
  ];

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:T.head, fontSize:22, fontWeight:800 }}>Usuários & Permissões</h1>
          <p style={{ color:T.textSub, fontSize:13 }}>{usuarios.filter(u=>u.ativo).length} usuários ativos · {usuarios.length} total</p>
        </div>
        {isAdmin && <Btn onClick={openNew}>+ Novo Usuário</Btn>}
      </div>

      {!isAdmin && (
        <div style={{ background:T.yellowDim, border:`1px solid ${T.yellow}33`, borderRadius:12, padding:"14px 18px", marginBottom:20, fontSize:13, color:T.yellow }}>
          ⚠️ Apenas administradores podem criar ou editar usuários.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:20 }}>
        {/* Lista de usuários */}
        <div>
          <div style={{ fontFamily:T.head, fontWeight:700, fontSize:14, marginBottom:14, color:T.textSub }}>MEMBROS DA EQUIPE</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {usuarios.map(u => (
              <div key={u.id} className="hover-lift"
                style={{ background:T.surface, border:`1px solid ${u.id===currentUser?.id?T.accent+"55":T.border}`, borderRadius:14, padding:18, cursor:"default" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:u.cor||T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.head, fontWeight:700, fontSize:15, color:"#fff", flexShrink:0 }}>
                    {u.avatar || u.nome.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{u.nome}</span>
                      {u.id===currentUser?.id && <Badge color="blue" size="sm">Você</Badge>}
                    </div>
                    <div style={{ fontSize:12, color:T.textMuted }}>{u.email}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <Badge color={perfilColor(u.perfil)}>{PERFIS[u.perfil]?.icon} {u.perfil}</Badge>
                    <Badge color={u.ativo?"green":"gray"} dot size="sm">{u.ativo?"Ativo":"Inativo"}</Badge>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn size="sm" variant="soft" onClick={()=>openEdit(u)}>✏ Editar</Btn>
                    <Btn size="sm" variant={u.ativo?"ghost":"success"} onClick={()=>toggleAtivo(u.id)}>
                      {u.ativo?"⏸ Desativar":"▶ Ativar"}
                    </Btn>
                    {u.id !== currentUser?.id && (
                      <Btn size="sm" variant="danger" onClick={()=>setConfirm(u.id)}>🗑</Btn>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Matriz de permissões */}
        <div>
          <div style={{ fontFamily:T.head, fontWeight:700, fontSize:14, marginBottom:14, color:T.textSub }}>MATRIZ DE PERMISSÕES</div>
          <Card style={{ overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:T.textMuted, fontWeight:700, textTransform:"uppercase" }}>Módulo</th>
                  {Object.keys(PERFIS).map(p=>(
                    <th key={p} style={{ padding:"12px 10px", textAlign:"center", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>
                      <Badge color={perfilColor(p)} size="sm">{p}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permRows.map(([label, key])=>(
                  <tr key={key} style={{ borderBottom:`1px solid ${T.border}22` }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHigh}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"10px 16px", fontSize:13, fontWeight:500 }}>{label}</td>
                    {Object.keys(PERFIS).map(p=>(
                      <td key={p} style={{ padding:"10px", textAlign:"center" }}>
                        {PERMISSOES[p]?.[key]
                          ? <span style={{ color:T.green, fontSize:16 }}>✓</span>
                          : <span style={{ color:T.textMuted, fontSize:16 }}>—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* Modal form */}
      <Modal open={modal==="form"} onClose={()=>setModal(null)} title={selected?"Editar Usuário":"Novo Usuário"} width={500}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div style={{ gridColumn:"1/-1" }}><Input label="Nome completo *" value={f.nome||""} onChange={v=>sf(p=>({...p,nome:v}))} /></div>
          <Input label="E-mail *" type="email" value={f.email||""} onChange={v=>sf(p=>({...p,email:v}))} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.textSub, marginBottom:6 }}>{selected?"Nova senha (deixe em branco para manter)":"Senha *"}</label>
            <div style={{ position:"relative" }}>
              <input type={showSenha?"text":"password"} value={f.senha||""} onChange={e=>sf(p=>({...p,senha:e.target.value}))}
                placeholder={selected?"••••••••":"Definir senha"}
                style={{ background:T.bgMid, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 40px 9px 13px", width:"100%", fontSize:13 }} />
              <button onClick={()=>setShowSenha(p=>!p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:T.textMuted, cursor:"pointer" }}>
                {showSenha?"🙈":"👁"}
              </button>
            </div>
          </div>
          <Input label="Perfil" value={f.perfil||"Contador"} onChange={v=>sf(p=>({...p,perfil:v}))}
            options={Object.keys(PERFIS).map(p=>({v:p,l:`${PERFIS[p].icon} ${p} — ${PERFIS[p].desc}`}))} />
        </div>

        {/* Preview de permissões do perfil selecionado */}
        {f.perfil && (
          <div style={{ background:T.bgMid, borderRadius:10, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>ACESSO COM ESTE PERFIL</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {permRows.filter(([,key])=>PERMISSOES[f.perfil]?.[key]).map(([label])=>(
                <span key={label} style={{ background:T.greenDim, color:T.green, border:`1px solid ${T.green}33`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600 }}>✓ {label}</span>
              ))}
              {permRows.filter(([,key])=>!PERMISSOES[f.perfil]?.[key]).map(([label])=>(
                <span key={label} style={{ background:"#ffffff08", color:T.textMuted, border:`1px solid ${T.border}`, borderRadius:6, padding:"3px 10px", fontSize:11 }}>— {label}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <input type="checkbox" id="ativo" checked={f.ativo!==false} onChange={e=>sf(p=>({...p,ativo:e.target.checked}))} style={{ accentColor:T.accent }} />
          <label htmlFor="ativo" style={{ fontSize:13, color:T.textSub }}>Usuário ativo (pode fazer login)</label>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar Usuário</Btn>
        </div>
      </Modal>

      <Confirm open={!!confirm} msg="Remover este usuário permanentemente?" onOk={()=>del(confirm)} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem("crm2_session") || "null");
      if (!session) return null;
      // Sessão expira em 8h
      if (Date.now() - session.ts > 8 * 60 * 60 * 1000) { localStorage.removeItem("crm2_session"); return null; }
      const usuarios = JSON.parse(localStorage.getItem("crm2_usuarios") || JSON.stringify(SEED_USUARIOS));
      return usuarios.find(u => u.id === session.userId && u.ativo) || null;
    } catch { return null; }
  });

  const [page, setPage] = useState("dashboard");
  const [leads, setLeads]           = useLs("crm2_leads", SEED_LEADS);
  const [clients, setClients]       = useLs("crm2_clients", SEED_CLIENTS);
  const [contratos, setContratos]   = useLs("crm2_contratos", SEED_CONTRATOS);
  const [financeiro, setFinanceiro] = useLs("crm2_financeiro", SEED_FINANCEIRO);
  const [tickets, setTickets]       = useLs("crm2_tickets", SEED_TICKETS);
  const [docs, setDocs]             = useLs("crm2_docs", SEED_DOCS);
  const [asaasKey, setAsaasKey]     = useLs("crm2_asaas_key", "");

  const [mktCount, setMktCount] = useState(() => {
    try { return (JSON.parse(localStorage.getItem("crm2_mkt_leads")||"[]")).filter(l=>l.status_contato==="Novo").length; } catch { return 0; }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const list = JSON.parse(localStorage.getItem("crm2_mkt_leads")||"[]");
        setMktCount(list.filter(l=>l.status_contato==="Novo").length);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem("crm2_session");
    setCurrentUser(null);
    setPage("dashboard");
  };

  // Tela de login se não autenticado
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const perms = PERMISSOES[currentUser.perfil] || PERMISSOES.Contador;

  // Nav filtrado por permissão
  const NAV_VISIVEIS = [
    { id:"dashboard",  icon:"⬡",  label:"Dashboard" },
    { id:"marketing",  icon:"📣",  label:"Mkt",       perm:"marketing" },
    { id:"leads",      icon:"◎",  label:"Leads",     perm:"leads" },
    { id:"clientes",   icon:"◉",  label:"Clientes",  perm:"clientes" },
    { id:"contratos",  icon:"◈",  label:"Contratos", perm:"contratos" },
    { id:"financeiro", icon:"◆",  label:"Financeiro",perm:"financeiro" },
    { id:"tickets",    icon:"◍",  label:"Suporte",   perm:"tickets" },
    { id:"documentos", icon:"◰",  label:"Docs",      perm:"documentos" },
    { id:"onboarding", icon:"🚀",  label:"Onboard",  perm:"onboarding" },
    { id:"cobranca",   icon:"💳",  label:"Régua",    perm:"cobranca" },
    { id:"relatorios", icon:"📊",  label:"Relatórios",perm:"relatorios" },
    { id:"usuarios",   icon:"👥",  label:"Equipe",   perm:"usuarios" },
    { id:"config",     icon:"⚙",  label:"Config",   perm:"config" },
  ].filter(n => !n.perm || perms[n.perm]);

  const alerts = {
    marketing: mktCount,
    leads: leads.filter(l=>l.proximo_followup&&l.proximo_followup<=today()&&!["Perdido","Contrato Assinado"].includes(l.etapa)).length,
    financeiro: financeiro.filter(f=>f.status==="Vencido").length,
    tickets: tickets.filter(t=>t.prioridade==="Alta"&&t.status!=="Resolvido").length,
    documentos: docs.filter(d=>d.status==="Vencido").length,
    cobranca: clients.filter(c=>c.status==="Inadimplente").length,
  };

  const pages = {
    dashboard: <Dashboard leads={leads} clients={clients} contratos={contratos} financeiro={financeiro} tickets={tickets} />,
    marketing: <Marketing leads={leads} setLeads={setLeads} />,
    leads:     <Leads leads={leads} setLeads={setLeads} setClients={setClients} setContratos={setContratos} />,
    clientes:  <Clientes clients={clients} setClients={setClients} financeiro={financeiro} tickets={tickets} />,
    contratos: <Contratos contratos={contratos} setContratos={setContratos} clients={clients} />,
    financeiro:<Financeiro financeiro={financeiro} setFinanceiro={setFinanceiro} clients={clients} contratos={contratos} asaasKey={asaasKey} />,
    tickets:   <Tickets tickets={tickets} setTickets={setTickets} clients={clients} />,
    documentos:<Documentos docs={docs} setDocs={setDocs} clients={clients} />,
    onboarding:<Onboarding clients={clients} contratos={contratos} setClients={setClients} />,
    cobranca:  <Cobranca clients={clients} financeiro={financeiro} setFinanceiro={setFinanceiro} />,
    relatorios:<Relatorios leads={leads} clients={clients} contratos={contratos} financeiro={financeiro} tickets={tickets} />,
    usuarios:  <Usuarios currentUser={currentUser} />,
    config:    <Config asaasKey={asaasKey} setAsaasKey={setAsaasKey} />,
  };

  // Sidebar customizado com nav filtrado + user info + logout
  const SidebarAuth = () => (
    <aside style={{ width:68, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 0 16px", position:"fixed", left:0, top:0, bottom:0, zIndex:100, gap:4 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.head, fontWeight:800, fontSize:17, color:"#fff", marginBottom:16, flexShrink:0 }}>C</div>
      {NAV_VISIVEIS.map(n => {
        const isActive = page === n.id;
        const hasAlert = alerts?.[n.id] > 0;
        return (
          <button key={n.id} onClick={()=>setPage(n.id)} title={n.label}
            style={{ width:48, height:48, borderRadius:12, border:"none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, cursor:"pointer", transition:"all 0.15s", background: isActive ? T.accentGlow : "transparent", color: isActive ? T.accent : T.textMuted, position:"relative", flexShrink:0 }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>
            <span style={{ fontSize:8, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase" }}>{n.label}</span>
            {hasAlert && <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:T.red, border:`1.5px solid ${T.surface}` }} />}
          </button>
        );
      })}
      <div style={{ flex:1 }} />
      {/* Avatar do usuário logado + logout */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        <div title={`${currentUser.nome} — ${currentUser.perfil}`}
          style={{ width:34, height:34, borderRadius:10, background:currentUser.cor||T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.head, fontWeight:700, fontSize:12, color:"#fff", cursor:"default", border:`2px solid ${(currentUser.cor||T.accent)}66` }}>
          {currentUser.avatar || currentUser.nome.slice(0,2).toUpperCase()}
        </div>
        <button onClick={logout} title="Sair"
          style={{ width:34, height:34, borderRadius:10, background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=T.redDim;e.currentTarget.style.color=T.red;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}>
          ⏏
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
        <SidebarAuth />
        <main style={{ marginLeft:68, flex:1, padding:"28px 32px", overflowY:"auto", height:"100vh" }}>
          {pages[page] || pages["dashboard"]}
        </main>
      </div>
    </>
  );
}
