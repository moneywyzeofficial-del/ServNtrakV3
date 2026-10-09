/* global React */

// ============================================================================
// V0 · AGENDA — Técnico (mobile) + Despacho (web)
// Mesma paleta/tipografia de variation-real.jsx (TechReal/DispReal).
// PT-PT · Verde #4CAF50 · Teal #009688 · Laranja #E65100 · Slate #263238 · Inter
// ============================================================================

const TA = {
  bg: '#FAFAF7',
  fg: '#263238',
  muted: '#EEF1F0',
  mutedFg: '#757575',
  card: '#ffffff',
  border: '#E4E6E8',
  primary: '#4CAF50',
  primarySoft: '#E8F5E9',
  primaryDeep: '#357A38',
  accent: '#009688',
  accentSoft: '#E0F2F1',
  warm: '#E65100',
  warmSoft: '#FFF3E0',
  destructive: '#D32F2F',
  font: "'Inter', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};
const taGradPrimary = 'linear-gradient(135deg, #4CAF50 0%, #357A38 100%)';
const taGradMesh = `
  radial-gradient(at 30% 10%, rgba(255,255,255,0.18) 0px, transparent 50%),
  radial-gradient(at 80% 80%, rgba(0, 150, 136, 0.30) 0px, transparent 50%)`;

// ============================================================================
// TECHNICIAN · AGENDA (mobile)
// ============================================================================

function TechAgendaReal() {
  const week = [
    { dow: 'S', d: 27, count: 4 },
    { dow: 'T', d: 28, count: 6 },
    { dow: 'Q', d: 29, count: 5 },
    { dow: 'Q', d: 30, count: 7 },
    { dow: 'S', d: 1, count: 5, today: true },
    { dow: 'S', d: 2, count: 0 },
    { dow: 'D', d: 3, count: 0 },
  ];

  const items = [
    { time: '08:30', dur: 30, client: 'Quinta da Aldegalega', task: 'Piscina · Manutenção semanal', tone: 'primary', status: 'done' },
    { time: '09:15', dur: 20, client: 'Família Coronado',     task: 'Jardim · Poda e adubação',    tone: 'accent',  status: 'done' },
    { time: '09:45', dur: 45, client: 'Hillcrest #14',         task: 'Piscina · Tratamento de algas', tone: 'primary', status: 'next', eta: 'ETA 09:42', address: 'R. das Camélias 14 · 2,4km' },
    { time: '11:30', dur: 30, client: 'Condomínio Bayview',    task: 'Jardim · Verificação rega',   tone: 'accent',  status: 'upcoming' },
    { time: '13:00', dur: 90, client: 'Marina Heights',        task: 'Piscina · Troca de filtro',    tone: 'primary', status: 'upcoming', alert: 'Aguaceiro previsto às 17h' },
    { time: '16:15', dur: 45, client: 'Vivenda Sá',           task: 'Jardim · Corte de relva',     tone: 'accent',  status: 'upcoming' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: TA.bg, color: TA.fg,
      fontFamily: TA.font, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${TA.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: taGradPrimary, color: '#fff', padding: '12px 18px 14px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: taGradMesh, opacity: 0.6 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>Maio · 2026</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>Agenda</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={pillBtn(false)}>Dia</button>
              <button style={pillBtn(true)}>Semana</button>
            </div>
          </div>

          {/* Week strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 12 }}>
            {week.map((d, i) => (
              <div key={i} style={{
                background: d.today ? '#fff' : 'rgba(255,255,255,0.10)',
                borderRadius: 10, padding: '6px 0 5px', textAlign: 'center',
                color: d.today ? TA.primaryDeep : '#fff',
                border: d.today ? 'none' : '1px solid rgba(255,255,255,0.14)',
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: d.today ? 0.7 : 0.85, letterSpacing: 0.3 }}>{d.dow}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 1 }}>{d.d}</div>
                {d.count > 0 ? (
                  <div style={{ fontSize: 8, fontWeight: 700, marginTop: 1, opacity: d.today ? 0.7 : 0.7 }}>{d.count}</div>
                ) : (
                  <div style={{ fontSize: 8, marginTop: 1, opacity: 0.4 }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day summary */}
      <div style={{
        padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: `1px solid ${TA.border}`, background: '#fff',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Sexta · 1 maio</div>
          <div style={{ fontSize: 11, color: TA.mutedFg, marginTop: 1 }}>
            <strong style={{ color: TA.fg }}>2/6</strong> concluídas · 4h 25min · 38 km
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { l: 'Todos', active: true },
            { l: 'Piscinas' },
            { l: 'Jardins' },
          ].map(t => (
            <span key={t.l} style={{
              fontSize: 10, fontWeight: 600, padding: '5px 10px', borderRadius: 99,
              background: t.active ? TA.primarySoft : 'transparent',
              color: t.active ? TA.primary : TA.mutedFg,
              border: t.active ? `1px solid ${TA.primary}33` : `1px solid ${TA.border}`,
            }}>{t.l}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 0 14px' }}>
        {items.map((it, i) => (
          <AgendaRow key={i} {...it} />
        ))}
        <div style={{ display: 'flex', gap: 12, padding: '4px 16px 0', alignItems: 'center', opacity: 0.55 }}>
          <div style={{ width: 44, fontSize: 10, color: TA.mutedFg, fontFamily: TA.mono, fontWeight: 600, textAlign: 'right' }}>17:00</div>
          <div style={{ flex: 1, fontSize: 11, color: TA.mutedFg, fontStyle: 'italic',
            borderTop: `1px dashed ${TA.border}`, paddingTop: 7 }}>fim do dia · regresso ao depósito</div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        flex: '0 0 auto', background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)', borderTop: `1px solid ${TA.border}`,
        borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(76, 175, 80, 0.10)',
        display: 'flex', height: 64, padding: '4px 8px',
      }}>
        {[
          { l: 'Início',     I: AHome },
          { l: 'Clientes',   I: AUsers },
          { l: 'Agenda',     I: ACal,  active: true },
          { l: 'Relatórios', I: AChart },
          { l: 'Perfil',     I: AUser },
        ].map((n, i) => {
          const I = n.I;
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', borderRadius: 12, position: 'relative',
              background: n.active ? 'rgba(76, 175, 80, 0.12)' : 'transparent',
              color: n.active ? TA.primary : TA.mutedFg,
            }}>
              <I />
              <span style={{
                fontSize: 10, marginTop: 2,
                fontWeight: n.active ? 700 : 500,
                color: n.active ? TA.primary : TA.mutedFg,
              }}>{n.l}</span>
              {n.active && <span style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 99, background: TA.primary }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pillBtn(active) {
  return {
    background: active ? '#fff' : 'rgba(255,255,255,0.15)',
    color: active ? TA.primaryDeep : '#fff',
    border: '1px solid ' + (active ? '#fff' : 'rgba(255,255,255,0.25)'),
    borderRadius: 99, padding: '5px 14px', fontSize: 11, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer',
  };
}

function AgendaRow({ time, dur, client, task, tone, status, eta, address, alert }) {
  const isDone = status === 'done', isNext = status === 'next';
  const accent = tone === 'accent' ? TA.accent : TA.primary;
  const accentSoft = tone === 'accent' ? TA.accentSoft : TA.primarySoft;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '6px 16px', alignItems: 'stretch' }}>
      {/* hour rail */}
      <div style={{ width: 44, paddingTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{
          fontSize: 11, fontFamily: TA.mono, fontWeight: 700,
          color: isNext ? TA.primary : TA.mutedFg,
        }}>{time}</div>
        <div style={{ fontSize: 9, color: TA.mutedFg, marginTop: 1 }}>{dur}min</div>
      </div>

      {/* card */}
      <div style={{
        flex: 1, background: TA.card, borderRadius: 14,
        border: `1px solid ${isNext ? accent : TA.border}`,
        boxShadow: isNext
          ? `0 0 0 3px ${accent}1f, 0 4px 14px ${accent}33`
          : '0 1px 3px rgba(0,0,0,0.04)',
        padding: '10px 12px', position: 'relative', overflow: 'hidden',
        opacity: isDone ? 0.55 : 1,
      }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: isDone ? accent : accent,
          opacity: isDone ? 0.45 : 1,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: isDone ? accentSoft : isNext ? accent : TA.muted,
            display: 'grid', placeItems: 'center', flex: '0 0 auto',
          }}>
            {isDone ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : isNext ? (
              <span style={{ width: 6, height: 6, borderRadius: 99, background: '#fff' }} />
            ) : (
              <span style={{ width: 6, height: 6, borderRadius: 99, background: TA.mutedFg }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              textDecoration: isDone ? 'line-through' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{client}</div>
            <div style={{ fontSize: 11, color: TA.mutedFg, marginTop: 1 }}>{task}</div>
          </div>
          {isNext && eta && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: accent, background: accentSoft,
              padding: '3px 7px', borderRadius: 99, whiteSpace: 'nowrap',
            }}>{eta}</span>
          )}
        </div>
        {isNext && address && (
          <div style={{
            marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${TA.border}`,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TA.mutedFg,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-7.5 8-13a8 8 0 0 0-16 0c0 5.5 8 13 8 13z" /><circle cx="12" cy="9" r="2.5" /></svg>
            <span style={{ flex: 1 }}>{address}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: accent }}>Navegar →</span>
          </div>
        )}
        {alert && (
          <div style={{
            marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${TA.border}`,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: TA.warm, fontWeight: 600,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: TA.warm }} />
            {alert}
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom nav icons (line)
function AHome() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>);
}
function AUsers() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.2 3.1-5 6-5s5.4 1.8 6 5" /><circle cx="17" cy="9" r="2.6" /><path d="M15 14.5c2.5-.4 5 1 5.6 4" /></svg>);
}
function ACal() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
}
function AChart() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
}
function AUser() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4 21c1-4.5 4.4-6.5 8-6.5s7 2 8 6.5" /></svg>);
}

// ============================================================================
// DISPATCHER · AGENDA (web — swimlane: técnicos × horas)
// ============================================================================

function DispAgendaReal() {
  const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i); // 07 → 18
  const colW = 62; // px per hour
  const headW = 188;
  const nowH = 9 + 42 / 60; // 09:42

  const techs = [
    { id: 'tiago', name: 'Tiago Silva',   role: 'Sénior · Piscinas', initials: 'TS', dot: TA.primary,     status: 'em rota',   visits: [
      { s: 8.5,  e: 9.0,  c: 'Aldegalega',    k: 'pool',   st: 'done' },
      { s: 9.25, e: 9.6,  c: 'Coronado',      k: 'garden', st: 'done' },
      { s: 9.75, e: 10.5, c: 'Hillcrest #14', k: 'pool',   st: 'next' },
      { s: 11.5, e: 12.0, c: 'Bayview',       k: 'garden' },
      { s: 13.0, e: 14.5, c: 'Marina Heights',k: 'pool',   alert: true },
      { s: 16.25,e: 17.0, c: 'Vivenda Sá',    k: 'garden' },
    ]},
    { id: 'ana',   name: 'Ana Pereira',   role: 'Júnior · Mista',    initials: 'AP', dot: TA.accent,      status: 'em visita', visits: [
      { s: 8.0,  e: 9.0,  c: 'Cascais Marina',     k: 'pool',   st: 'done' },
      { s: 9.5,  e: 10.5, c: 'Quinta do Lago',     k: 'pool',   st: 'next' },
      { s: 11.0, e: 12.0, c: 'Família Rodrigues',  k: 'garden' },
      { s: 14.0, e: 15.5, c: 'Hotel Atlântico',    k: 'pool' },
      { s: 16.0, e: 17.0, c: 'Condomínio Sol',     k: 'garden' },
    ]},
    { id: 'pedro', name: 'Pedro Matos',   role: 'Sénior · Jardins',  initials: 'PM', dot: TA.warm,        status: 'em rota',   visits: [
      { s: 7.5,  e: 8.5,  c: 'Vivenda Costa',      k: 'garden', st: 'done' },
      { s: 9.0,  e: 10.25,c: 'Coronado · jardim',  k: 'garden', st: 'done' },
      { s: 11.0, e: 12.5, c: 'Quinta São João',    k: 'garden' },
      { s: 14.0, e: 15.0, c: 'Família Almeida',    k: 'garden' },
      { s: 15.5, e: 17.0, c: 'Empresa Verde',      k: 'garden' },
    ]},
    { id: 'joao',  name: 'João Costa',    role: 'Júnior · Piscinas', initials: 'JC', dot: TA.primaryDeep, status: 'pausa',     visits: [
      { s: 8.0,  e: 9.5,  c: 'Quinta da Lagoa',    k: 'pool',   st: 'done' },
      { s: 10.0, e: 11.0, c: 'Família Pereira',    k: 'pool' },
      { s: 13.5, e: 14.5, c: 'Hotel Mar',          k: 'pool',   alert: true },
      { s: 15.0, e: 16.5, c: 'Vivenda Bela',       k: 'pool' },
    ]},
    { id: 'ines',  name: 'Inês Marques',  role: 'Júnior · Jardins',  initials: 'IM', dot: TA.primary,     status: 'em rota',   visits: [
      { s: 8.5,  e: 9.5,  c: 'Bayview · poda',     k: 'garden', st: 'done' },
      { s: 10.0, e: 11.5, c: 'Sintra Verde',       k: 'garden', st: 'next' },
      { s: 13.0, e: 14.0, c: 'Vila Real',          k: 'garden' },
      { s: 14.5, e: 16.0, c: 'Quinta Nova',        k: 'garden' },
    ]},
    { id: 'rui',   name: 'Rui Ferreira',  role: 'Sénior · Piscinas', initials: 'RF', dot: TA.accent,      status: 'offline',   visits: [
      { s: 9.0,  e: 10.0, c: 'Estoril Plaza',      k: 'pool',   st: 'done' },
      { s: 11.0, e: 12.5, c: 'Hotel Estoril',      k: 'pool' },
      { s: 14.0, e: 15.0, c: 'Família Sousa',      k: 'pool' },
    ]},
  ];

  const week = [
    { dow: 'Seg', d: 28 }, { dow: 'Ter', d: 29 }, { dow: 'Qua', d: 30 },
    { dow: 'Qui', d: 30 }, { dow: 'Sex', d: 1, today: true },
    { dow: 'Sáb', d: 2 }, { dow: 'Dom', d: 3 },
  ];

  const totalVisits = techs.reduce((n, t) => n + t.visits.length, 0);
  const alerts = techs.reduce((n, t) => n + t.visits.filter(v => v.alert).length, 0);

  return (
    <div style={{
      width: '100%', height: '100%', background: TA.bg, color: TA.fg,
      fontFamily: TA.font, display: 'flex', overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: taGradPrimary, color: '#fff',
        display: 'flex', flexDirection: 'column', padding: '20px 12px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: taGradMesh, opacity: 0.4 }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px' }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
              <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak" style={{ height: 24, display: 'block' }} />
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Peralta Gardens</div>
          </div>

          {[
            ['🏠', 'Início'],
            ['👥', 'Clientes'],
            ['📅', 'Agenda', true],
            ['📊', 'Relatórios'],
            ['💰', 'Faturação'],
            ['📈', 'Rentabilidade'],
            ['🛒', 'Compras'],
            ['🌧', 'Tempo'],
            ['👤', 'Perfil'],
          ].map(([icon, label, active]) => (
            <div key={label} style={{
              padding: '10px 12px', borderRadius: 12, fontSize: 13, marginBottom: 2,
              background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
              fontWeight: active ? 700 : 500, opacity: active ? 1 : 0.85,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span><span>{label}</span>
            </div>
          ))}

          <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.18)', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, opacity: 0.75, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Atribuições</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{totalVisits} visitas</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{techs.length} técnicos · {alerts} alertas</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 22px 12px', borderBottom: `1px solid ${TA.border}`, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
        }}>
          <div>
            <div style={{ fontSize: 11, color: TA.mutedFg, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 600 }}>Maio · 2026</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, letterSpacing: -0.5 }}>Agenda · Sex 1 maio</div>
          </div>

          {/* Week strip */}
          <div style={{ display: 'flex', gap: 4, flex: 1, maxWidth: 380, marginLeft: 24 }}>
            <button style={navArrow()}>‹</button>
            {week.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 10,
                background: d.today ? TA.primary : 'transparent',
                color: d.today ? '#fff' : TA.fg,
                border: d.today ? 'none' : `1px solid ${TA.border}`,
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: d.today ? 0.9 : 0.7, letterSpacing: 0.3, textTransform: 'uppercase' }}>{d.dow}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 1 }}>{d.d}</div>
              </div>
            ))}
            <button style={navArrow()}>›</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: TA.muted, borderRadius: 10, padding: 3, fontSize: 11, fontWeight: 600 }}>
              {['Dia', 'Semana', 'Mês'].map((t, i) => (
                <span key={t} style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: i === 0 ? '#fff' : 'transparent',
                  color: i === 0 ? TA.fg : TA.mutedFg,
                  boxShadow: i === 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}>{t}</span>
              ))}
            </div>
            <button style={{
              background: taGradPrimary, color: '#fff', border: 'none', padding: '8px 14px',
              borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(76, 175, 80, 0.32)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Nova visita
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          padding: '10px 22px', display: 'flex', gap: 10,
          borderBottom: `1px solid ${TA.border}`, background: TA.bg,
        }}>
          <KpiSm label="Visitas hoje" value={totalVisits} sub="11/12 em horário" tone={TA.primary} />
          <KpiSm label="Em rota agora" value="4" sub="2 em visita · 1 pausa" tone={TA.accent} />
          <KpiSm label="Alertas" value={alerts} sub="conflito climático" tone={TA.warm} />
          <KpiSm label="Por atribuir" value="3" sub="arrastar p/ swimlane" tone={TA.primaryDeep} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[
              { l: 'Piscinas', c: TA.primary },
              { l: 'Jardins',  c: TA.accent  },
              { l: 'Alertas',  c: TA.warm    },
            ].map(t => (
              <span key={t.l} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, color: TA.mutedFg, padding: '5px 10px',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: t.c }} />
                {t.l}
              </span>
            ))}
          </div>
        </div>

        {/* Swimlane grid */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fff' }}>
          <div style={{ minWidth: headW + colW * HOURS.length, position: 'relative' }}>
            {/* Hour header */}
            <div style={{
              display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: '#fff',
              borderBottom: `1px solid ${TA.border}`,
            }}>
              <div style={{ width: headW, flex: '0 0 auto', padding: '10px 14px', fontSize: 11, color: TA.mutedFg, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Técnico</div>
              {HOURS.map(h => (
                <div key={h} style={{
                  width: colW, flex: '0 0 auto', padding: '10px 0 8px',
                  fontSize: 11, fontWeight: 700, color: TA.mutedFg, fontFamily: TA.mono,
                  textAlign: 'left', paddingLeft: 8, borderLeft: `1px solid ${TA.border}`,
                }}>{String(h).padStart(2, '0')}:00</div>
              ))}
            </div>

            {/* Now line */}
            <div style={{
              position: 'absolute', top: 36, bottom: 0,
              left: headW + (nowH - HOURS[0]) * colW,
              width: 0, borderLeft: `2px solid ${TA.warm}`, zIndex: 2, pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', top: -2, left: -22,
                background: TA.warm, color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 6, fontFamily: TA.mono,
              }}>09:42</div>
            </div>

            {/* Tech rows */}
            {techs.map((t, idx) => (
              <div key={t.id} style={{
                display: 'flex', borderBottom: `1px solid ${TA.border}`, position: 'relative', minHeight: 64,
              }}>
                {/* tech header */}
                <div style={{
                  width: headW, flex: '0 0 auto', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center',
                  background: idx % 2 ? TA.bg : '#fff',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: t.dot, color: '#fff',
                    display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flex: '0 0 auto',
                  }}>{t.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: TA.mutedFg, marginTop: 1 }}>{t.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: 99,
                        background: t.status === 'offline' ? '#9CA3AF' : t.status === 'pausa' ? TA.warm : TA.primary,
                      }} />
                      <span style={{ fontSize: 10, color: TA.mutedFg, fontWeight: 600 }}>{t.status}</span>
                    </div>
                  </div>
                </div>

                {/* lane */}
                <div style={{ flex: 1, position: 'relative', background: idx % 2 ? TA.bg : '#fff' }}>
                  {/* hour grid lines */}
                  {HOURS.map((h, i) => (
                    <div key={h} style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: i * colW, width: colW,
                      borderLeft: `1px solid ${TA.border}`,
                    }} />
                  ))}
                  {/* visits */}
                  {t.visits.map((v, i) => {
                    const left = (v.s - HOURS[0]) * colW + 2;
                    const width = (v.e - v.s) * colW - 4;
                    const isPool = v.k === 'pool';
                    const baseColor = isPool ? TA.primary : TA.accent;
                    const baseSoft = isPool ? TA.primarySoft : TA.accentSoft;
                    const isDone = v.st === 'done';
                    const isNext = v.st === 'next';
                    return (
                      <div key={i} title={`${v.c}`} style={{
                        position: 'absolute', top: 8, height: 48,
                        left, width: Math.max(width, 32),
                        background: isDone ? '#fff' : baseSoft,
                        border: `1px solid ${v.alert ? TA.warm : baseColor}`,
                        borderLeft: `4px solid ${v.alert ? TA.warm : baseColor}`,
                        borderRadius: 8, padding: '4px 8px', overflow: 'hidden',
                        boxShadow: isNext ? `0 0 0 2px ${baseColor}33` : 'none',
                        opacity: isDone ? 0.6 : 1,
                      }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: TA.fg,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}>{v.c}</div>
                        <div style={{
                          fontSize: 10, color: TA.mutedFg, marginTop: 1, fontFamily: TA.mono,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {String(Math.floor(v.s)).padStart(2, '0')}:{String(Math.round((v.s % 1) * 60)).padStart(2, '0')}
                          <span>→</span>
                          {String(Math.floor(v.e)).padStart(2, '0')}:{String(Math.round((v.e % 1) * 60)).padStart(2, '0')}
                          {v.alert && <span style={{ color: TA.warm, fontWeight: 700, marginLeft: 'auto' }}>⚠</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Unassigned tray */}
            <div style={{
              display: 'flex', minHeight: 56, background: '#FFF8F0',
              borderTop: `2px dashed ${TA.warm}66`,
            }}>
              <div style={{ width: headW, flex: '0 0 auto', padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TA.warm, letterSpacing: 0.3, textTransform: 'uppercase' }}>Por atribuir</div>
                <div style={{ fontSize: 10, color: TA.mutedFg, marginTop: 2 }}>3 visitas · arrastar p/ técnico</div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                {[
                  { s: 10.5, e: 11.25, c: 'Família Lourenço', k: 'pool' },
                  { s: 12.0, e: 13.0,  c: 'Quinta dos Pinhais', k: 'garden' },
                  { s: 15.0, e: 16.0,  c: 'Hotel Sol Praia', k: 'pool' },
                ].map((v, i) => {
                  const left = (v.s - HOURS[0]) * colW + 2;
                  const width = (v.e - v.s) * colW - 4;
                  const isPool = v.k === 'pool';
                  const baseColor = isPool ? TA.primary : TA.accent;
                  return (
                    <div key={i} style={{
                      position: 'absolute', top: 10, height: 36,
                      left, width: Math.max(width, 40),
                      background: '#fff', border: `1.5px dashed ${baseColor}`,
                      borderRadius: 8, padding: '4px 8px',
                      cursor: 'grab',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.c}</div>
                      <div style={{ fontSize: 9, color: TA.mutedFg, fontFamily: TA.mono, marginTop: 1 }}>
                        {String(Math.floor(v.s)).padStart(2, '0')}:{String(Math.round((v.s % 1) * 60)).padStart(2, '0')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function navArrow() {
  return {
    width: 28, height: 28, borderRadius: 8, background: TA.muted,
    border: `1px solid ${TA.border}`, color: TA.fg, cursor: 'pointer',
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
    flex: '0 0 auto',
  };
}

function KpiSm({ label, value, sub, tone }) {
  return (
    <div style={{
      flex: '0 0 auto', minWidth: 150, background: '#fff', borderRadius: 12,
      border: `1px solid ${TA.border}`, padding: '8px 12px',
    }}>
      <div style={{ fontSize: 9, color: TA.mutedFg, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: tone, letterSpacing: -0.4 }}>{value}</span>
        <span style={{ fontSize: 10, color: TA.mutedFg }}>{sub}</span>
      </div>
    </div>
  );
}

window.TechAgendaReal = TechAgendaReal;
window.DispAgendaReal = DispAgendaReal;
