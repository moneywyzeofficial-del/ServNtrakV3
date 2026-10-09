/* global React */

// ============================================================================
// VARIATION 04 — Clean SaaS dispatcher, but with ServNtrak's real palette
// Inter font, Verde primary #2D6A4F, sky-blue accent, warm orange
// PT-PT copy. Layout & density borrowed from Variation 01.
// ============================================================================

const v4 = {
  bg: '#FAFAF7',
  panel: '#FFFFFF',
  // ServNtrak logo palette
  ink: '#263238',                      // dark slate (Serv / trak text)
  muted: '#757575',                    // light gray (strapline)
  line: '#E4E6E8',
  primary: '#4CAF50',                  // green leaf
  primarySoft: '#E8F5E9',
  primaryDeep: '#357A38',
  accent: '#009688',                   // teal wave
  accentSoft: '#E0F2F1',
  warm: '#E65100',                     // orange N
  warmSoft: '#FFF3E0',
  font: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

function V4Dispatch() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v4.bg, color: v4.ink,
      fontFamily: v4.font, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px', borderBottom: `1px solid ${v4.line}`, background: v4.panel,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak"
            style={{ height: 24, display: 'block' }} />
          <div style={{ width: 1, height: 16, background: v4.line }} />
          {['Despacho', 'Rotas', 'Clientes', 'Inventário', 'Relatórios'].map((t, i) => (
            <div key={t} style={{
              fontSize: 13, color: i === 0 ? v4.ink : v4.muted, fontWeight: i === 0 ? 600 : 500,
              padding: '4px 0', borderBottom: i === 0 ? `1.5px solid ${v4.primary}` : 'none',
            }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: v4.bg, borderRadius: 8, padding: '6px 10px',
            fontSize: 12, color: v4.muted, fontFamily: v4.mono,
          }}>⌘K  Procurar visitas, clientes…</div>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: v4.primarySoft, color: v4.primary, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>TS</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: v4.muted }}>Hoje · Sexta-feira, 1 maio</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, marginTop: 2 }}>Operações</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              border: `1px solid ${v4.line}`, background: v4.panel, fontSize: 13,
              padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', color: v4.ink, fontWeight: 600,
            }}>Filtros</button>
            <button style={{
              border: 'none', background: v4.primary, color: '#fff', fontSize: 13,
              padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            }}>+ Nova visita</button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <V4Kpi label="Visitas activas" value="47" delta="+8" deltaPos />
          <V4Kpi label="Técnicos em serviço" value="12" delta="11 activos" />
          <V4Kpi label="Cumprimento horário" value="94%" delta="+2.1%" deltaPos />
          <V4Kpi label="Faturação · hoje" value="€8.420" delta="+12%" deltaPos accent />
        </div>

        {/* Two columns: jobs feed + sparkline panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* Live jobs */}
          <div style={{
            background: v4.panel, border: `1px solid ${v4.line}`, borderRadius: 14,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: `1px solid ${v4.line}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Visitas em curso</div>
              <div style={{ display: 'flex', gap: 4, fontSize: 11, color: v4.muted }}>
                <span style={{ background: v4.primarySoft, color: v4.primary, padding: '3px 8px', borderRadius: 5, fontWeight: 600 }}>Todas 47</span>
                <span style={{ padding: '3px 8px' }}>Em curso 18</span>
                <span style={{ padding: '3px 8px' }}>Agendadas 21</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <V4Row tech="Tiago S." color={v4.primary} client="Hillcrest #14" task="Piscina · Tratamento algas" status="Em curso" eta="42m" pct={36} />
              <V4Row tech="Ana C." color={v4.accent} client="Quinta da Aldegalega" task="Jardim · Poda" status="Em curso" eta="18m" pct={68} />
              <V4Row tech="João M." color={v4.warm} client="Vista Pointe" task="Piscina · Equipamento" status="Em curso" eta="1h 12m" pct={20} />
              <V4Row tech="Pedro L." color={v4.primary} client="Condomínio Bayview" task="Verificação rega" status="Em curso" eta="29m" pct={54} />
              <V4Row tech="Rita F." color={v4.accent} client="Marina Heights" task="Piscina · Filtro" status="Agendada" eta="11:30" pct={null} />
              <V4Row tech="Tiago S." color={v4.primary} client="Família Coronado" task="Jardim · Adubação" status="Agendada" eta="13:00" pct={null} />
            </div>
          </div>

          {/* Right column: chart + activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            <div style={{
              background: v4.panel, border: `1px solid ${v4.line}`, borderRadius: 14, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: v4.muted }}>Visitas concluídas · 14 dias</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, marginTop: 2 }}>328</div>
                </div>
                <div style={{ fontSize: 11, color: v4.primary, background: v4.primarySoft, padding: '3px 8px', borderRadius: 5, fontWeight: 700 }}>+18% vs anterior</div>
              </div>
              <V4Spark />
            </div>

            <div style={{
              background: v4.panel, border: `1px solid ${v4.line}`, borderRadius: 14, flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${v4.line}`, fontSize: 13, fontWeight: 700 }}>Atividade</div>
              <div style={{ padding: '4px 16px', overflow: 'hidden', flex: 1 }}>
                <V4Activity time="09:42" actor="Tiago S." what="iniciou" detail="Hillcrest #14 · Piscina" />
                <V4Activity time="09:38" actor="Ana C." what="registou" detail="pH 7.4 · 2kg cloro" />
                <V4Activity time="09:21" actor="Sistema" what="redirecionou" detail="João M. · trânsito A2" />
                <V4Activity time="09:04" actor="Pedro L." what="concluiu" detail="Coronado · poda" />
                <V4Activity time="08:50" actor="Cliente" what="pagou" detail="Aldegalega · €186" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V4Kpi({ label, value, delta, deltaPos, accent }) {
  return (
    <div style={{
      background: v4.panel, border: `1px solid ${v4.line}`, borderRadius: 12, padding: 14,
    }}>
      <div style={{ fontSize: 10, color: v4.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>{label}</div>
      <div style={{
        fontSize: 26, fontWeight: 800, letterSpacing: -0.7, marginTop: 6,
        color: accent ? v4.warm : v4.ink,
      }}>{value}</div>
      <div style={{
        fontSize: 11, marginTop: 4, fontWeight: 600,
        color: deltaPos ? v4.primary : v4.muted,
      }}>{delta}</div>
    </div>
  );
}

function V4Row({ tech, color, client, task, status, eta, pct }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr 100px 80px 70px',
      gap: 14, padding: '11px 16px', borderBottom: `1px solid ${v4.line}`,
      alignItems: 'center', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 18, height: 18, borderRadius: 99, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>
          {tech.split(' ').map(p => p[0]).join('')}
        </span>
        <span style={{ fontWeight: 600 }}>{tech}</span>
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{client}</div>
        <div style={{ color: v4.muted, fontSize: 11, marginTop: 1 }}>{task}</div>
      </div>
      <div>
        {pct != null ? (
          <div style={{ height: 5, background: v4.bg, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
          </div>
        ) : (
          <span style={{ color: v4.muted, fontSize: 11 }}>—</span>
        )}
      </div>
      <div style={{ color: v4.muted, fontFamily: v4.mono, fontSize: 11 }}>{eta}</div>
      <div style={{
        fontSize: 10, padding: '3px 7px', borderRadius: 5, textAlign: 'center', fontWeight: 700,
        background: status === 'Em curso' ? v4.primarySoft : v4.bg,
        color: status === 'Em curso' ? v4.primary : v4.muted,
      }}>{status === 'Em curso' ? 'Live' : 'Agend.'}</div>
    </div>
  );
}

function V4Spark() {
  const data = [18, 22, 19, 24, 21, 26, 28, 24, 30, 27, 32, 29, 34, 28];
  const max = Math.max(...data);
  const w = 360, h = 80;
  const stepX = w / (data.length - 1);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (d / max) * (h - 6)}`).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80, marginTop: 10, display: 'block' }}>
      <defs>
        <linearGradient id="v4grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={v4.primary} stopOpacity="0.22" />
          <stop offset="100%" stopColor={v4.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#v4grad)" />
      <path d={path} stroke={v4.primary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => i === data.length - 1 && (
        <circle key={i} cx={i * stepX} cy={h - (d / max) * (h - 6)} r="3.5" fill={v4.primary} stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  );
}

function V4Activity({ time, actor, what, detail }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: `1px dashed ${v4.line}`, alignItems: 'baseline',
    }}>
      <div style={{ fontSize: 11, color: v4.muted, fontFamily: v4.mono, minWidth: 32 }}>{time}</div>
      <div style={{ fontSize: 12, flex: 1 }}>
        <span style={{ fontWeight: 600 }}>{actor}</span>
        <span style={{ color: v4.muted }}> {what} </span>
        <span>{detail}</span>
      </div>
    </div>
  );
}

window.V4Dispatch = V4Dispatch;
