/* global React */

// ============================================================================
// VARIATION 2 — OPERATIONS CONTROL ROOM
// Dark, data-rich, neon accents. Space Grotesk + Geist Mono.
// Deep navy background, electric green/cyan/amber for live data.
// Inspired by mission-control / trading-desk UIs.
// ============================================================================

const v2 = {
  bg: '#0A0E14',
  bgDeep: '#06080C',
  panel: '#10151D',
  panelHi: '#161C26',
  ink: '#E6EAF0',
  muted: '#5B6573',
  dim: '#3A4250',
  line: '#1B2230',
  grid: '#141A24',
  green: '#3DDC97',
  greenDim: 'rgba(61,220,151,0.14)',
  blue: '#5EA9FF',
  blueDim: 'rgba(94,169,255,0.14)',
  orange: '#FF9F43',
  orangeDim: 'rgba(255,159,67,0.14)',
  red: '#F45B69',
  font: "'Space Grotesk', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

function V2Tech() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v2.bg, color: v2.ink,
      fontFamily: v2.font, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${v2.line}`, overflow: 'hidden',
      backgroundImage: `radial-gradient(circle at 50% 0%, rgba(94,169,255,0.08), transparent 60%)`,
    }}>
      {/* Status bar */}
      <div style={{
        padding: '10px 18px', borderBottom: `1px solid ${v2.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: v2.mono, fontSize: 10, color: v2.muted,
      }}>
        <span>UNIT-04 · MARCO.R</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: v2.green, boxShadow: `0 0 8px ${v2.green}` }} />
          ONLINE · 09:42:18
        </span>
      </div>

      <div style={{ padding: 18, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header card */}
        <div style={{
          background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10,
          padding: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.4,
            background: `linear-gradient(135deg, ${v2.blueDim}, transparent 60%)`,
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: v2.blue, fontFamily: v2.mono }}>NEXT STOP · 03 MIN</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: -0.4 }}>Hillcrest Estate #14</div>
            <div style={{ fontSize: 12, color: v2.muted, marginTop: 4, fontFamily: v2.mono }}>1422 OAKMONT DR · POOL · ALGAE TREATMENT</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
              <V2Cell label="ETA" value="09:45" sub="on time" tone={v2.green} />
              <V2Cell label="DURATION" value="60m" sub="est." tone={v2.blue} />
              <V2Cell label="DISTANCE" value="2.4mi" sub="via I-5" tone={v2.orange} />
            </div>
          </div>
        </div>

        {/* Day progress */}
        <div style={{
          background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10, padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>SHIFT PROGRESS</span>
            <span style={{ fontSize: 11, fontFamily: v2.mono, color: v2.green }}>2/5 · 40%</span>
          </div>
          <div style={{ height: 6, background: v2.bgDeep, borderRadius: 3, marginTop: 10, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '20%', background: v2.green, marginRight: 2 }} />
            <div style={{ width: '20%', background: v2.green, marginRight: 2 }} />
            <div style={{ width: '20%', background: v2.blue, marginRight: 2, boxShadow: `0 0 8px ${v2.blue}` }} />
            <div style={{ width: '20%', background: v2.dim, marginRight: 2 }} />
            <div style={{ width: '18%', background: v2.dim }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: v2.mono, fontSize: 9, color: v2.muted }}>
            <span>08:30</span><span>09:15</span><span>09:45</span><span>11:30</span><span>13:00</span>
          </div>
        </div>

        {/* Voice command */}
        <div style={{
          background: v2.panel, border: `1px solid ${v2.green}`, borderRadius: 10, padding: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 50%, ${v2.greenDim}, transparent 60%)` }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99, background: v2.bgDeep,
              border: `1px solid ${v2.green}`, display: 'grid', placeItems: 'center',
              boxShadow: `0 0 20px ${v2.greenDim}`,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={v2.green} strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.5, color: v2.green, fontFamily: v2.mono }}>VOICE READY</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>"Mark Hillcrest complete"</div>
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[6,10,14,8,16,12,18,10,14,7,12,9].map((h, i) => (
                <span key={i} style={{ width: 2, height: h, background: v2.green, borderRadius: 2, opacity: 0.3 + (i%4)*0.2 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Next stop checklist preview */}
        <div style={{
          background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10, padding: 14, flex: 1,
          minHeight: 0, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>HILLCREST · TASKS</span>
            <span style={{ fontSize: 10, color: v2.orange, fontFamily: v2.mono }}>0 / 6</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Test water chemistry', 'pH · CL · ALK'],
              ['Vacuum & brush', 'shallow + deep'],
              ['Skim surface debris', ''],
              ['Empty pump basket', ''],
              ['Add algaecide', '32 oz'],
              ['Photo · before/after', 'required'],
            ].map(([t, sub], i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                background: v2.bgDeep, borderRadius: 6, border: `1px solid ${v2.line}`,
              }}>
                <span style={{
                  width: 14, height: 14, border: `1.5px solid ${v2.dim}`, borderRadius: 3,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{t}</div>
                  {sub && <div style={{ fontSize: 10, color: v2.muted, fontFamily: v2.mono, marginTop: 1 }}>{sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function V2Cell({ label, value, sub, tone }) {
  return (
    <div style={{
      background: v2.bgDeep, border: `1px solid ${v2.line}`, borderRadius: 6, padding: '8px 10px',
    }}>
      <div style={{ fontSize: 8, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: tone, marginTop: 4, fontFamily: v2.mono }}>{value}</div>
      <div style={{ fontSize: 9, color: v2.muted, marginTop: 1, fontFamily: v2.mono }}>{sub}</div>
    </div>
  );
}

// ----- Dispatcher (control room) ----------------------------------------

function V2Dispatch() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v2.bgDeep, color: v2.ink,
      fontFamily: v2.font, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        padding: '10px 20px', borderBottom: `1px solid ${v2.line}`, background: v2.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, background: v2.green, color: v2.bgDeep,
              fontFamily: v2.mono, fontSize: 12, fontWeight: 700,
              display: 'grid', placeItems: 'center', borderRadius: 4,
            }}>S</div>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>SERVNTRAK</span>
            <span style={{ fontSize: 10, color: v2.muted, fontFamily: v2.mono, padding: '2px 6px', border: `1px solid ${v2.line}`, borderRadius: 3 }}>OPS</span>
          </div>
          {['DISPATCH','FLEET','ANALYTICS','CUSTOMERS'].map((t, i) => (
            <span key={t} style={{
              fontSize: 11, fontFamily: v2.mono, letterSpacing: 1, color: i === 0 ? v2.ink : v2.muted,
              borderBottom: i === 0 ? `1.5px solid ${v2.green}` : '1.5px solid transparent', paddingBottom: 4,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, fontFamily: v2.mono, color: v2.muted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: v2.green, boxShadow: `0 0 6px ${v2.green}` }} />LIVE
          </span>
          <span>09:42:18 PDT</span>
          <span>FRI 05.01</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '14px 18px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, minHeight: 0 }}>
        {/* LEFT — map + fleet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            <V2Kpi label="ACTIVE" value="47" tone={v2.blue} sub="+8" />
            <V2Kpi label="ON ROUTE" value="12" tone={v2.green} sub="11/12 ON-TIME" />
            <V2Kpi label="ALERTS" value="2" tone={v2.orange} sub="REVIEW" />
            <V2Kpi label="REVENUE" value="$8.4K" tone={v2.green} sub="+12.4%" />
            <V2Kpi label="UTIL." value="87%" tone={v2.blue} sub="TARGET 85%" />
          </div>

          {/* MAP */}
          <div style={{
            background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10, flex: 1,
            position: 'relative', overflow: 'hidden', minHeight: 0,
          }}>
            <V2Map />
            {/* Map header */}
            <div style={{
              position: 'absolute', top: 12, left: 12, right: 12,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{
                background: 'rgba(6,8,12,0.85)', backdropFilter: 'blur(8px)',
                padding: '6px 10px', borderRadius: 6, border: `1px solid ${v2.line}`,
                fontSize: 10, fontFamily: v2.mono, letterSpacing: 1.5, color: v2.muted,
              }}>FLEET MAP · SAN DIEGO COUNTY</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['POOL','GARDEN','ALL'].map((t, i) => (
                  <span key={t} style={{
                    fontSize: 10, fontFamily: v2.mono, padding: '5px 9px', borderRadius: 5,
                    background: i === 2 ? v2.green : 'rgba(6,8,12,0.85)',
                    color: i === 2 ? v2.bgDeep : v2.muted,
                    border: `1px solid ${i === 2 ? v2.green : v2.line}`, fontWeight: 600,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* Throughput chart */}
          <div style={{
            background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10, padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>JOBS / HR · LAST 12H</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, fontFamily: v2.mono, color: v2.green }}>6.4<span style={{ fontSize: 12, color: v2.muted, marginLeft: 6 }}>avg</span></div>
              </div>
              <div style={{ fontSize: 10, color: v2.green, fontFamily: v2.mono }}>▲ 18% WoW</div>
            </div>
            <V2Bars />
          </div>

          {/* Activity */}
          <div style={{
            background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 10,
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${v2.line}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>EVENT STREAM</span>
              <span style={{ fontSize: 10, color: v2.green, fontFamily: v2.mono }}>● LIVE</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}>
              <V2Event tone={v2.green} time="09:42:18" code="JOB.START" tech="MARCO.R" detail="Hillcrest #14 · ALG.TRT" />
              <V2Event tone={v2.blue} time="09:39:04" code="VOICE.LOG" tech="AIYA.T" detail='"pH 7.4 · added shock 2lb"' />
              <V2Event tone={v2.orange} time="09:36:51" code="ROUTE.REROUTE" tech="JONAS.L" detail="I-5 traffic · +8min" />
              <V2Event tone={v2.green} time="09:21:30" code="JOB.COMPLETE" tech="PRIYA.M" detail="Coronado · Garden trim" />
              <V2Event tone={v2.blue} time="09:04:12" code="INVOICE.PAID" tech="SYSTEM" detail="Aldridge · $186.00" />
              <V2Event tone={v2.orange} time="08:58:00" code="ALERT" tech="KAI.O" detail="Filter PSI > 22" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V2Kpi({ label, value, sub, tone }) {
  return (
    <div style={{
      background: v2.panel, border: `1px solid ${v2.line}`, borderRadius: 8, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: v2.muted, fontFamily: v2.mono }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: tone, marginTop: 4, fontFamily: v2.mono, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 9, color: v2.muted, marginTop: 2, fontFamily: v2.mono }}>{sub}</div>
    </div>
  );
}

function V2Map() {
  // Stylized vector map with a grid + fake roads + pulsing technician markers
  const techs = [
    { x: 28, y: 36, color: v2.green, label: 'M-04' },
    { x: 52, y: 28, color: v2.blue, label: 'A-02' },
    { x: 70, y: 48, color: v2.orange, label: 'J-07' },
    { x: 38, y: 62, color: v2.green, label: 'P-01' },
    { x: 62, y: 70, color: v2.blue, label: 'K-09' },
    { x: 80, y: 22, color: v2.green, label: 'L-03' },
  ];
  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="grid2" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke={v2.grid} strokeWidth="0.18" />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={v2.blueDim} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="100" height="80" fill={v2.panel} />
      <rect width="100" height="80" fill="url(#grid2)" />
      <ellipse cx="50" cy="40" rx="40" ry="30" fill="url(#glow)" />

      {/* Roads */}
      <path d="M 0 30 Q 20 25 40 32 T 80 28 L 100 24" stroke={v2.line} strokeWidth="0.6" fill="none" />
      <path d="M 0 50 Q 30 60 60 52 T 100 56" stroke={v2.line} strokeWidth="0.6" fill="none" />
      <path d="M 30 0 Q 28 30 32 50 T 36 80" stroke={v2.line} strokeWidth="0.6" fill="none" />
      <path d="M 65 0 Q 70 30 68 50 T 72 80" stroke={v2.line} strokeWidth="0.6" fill="none" />

      {/* Active route highlights */}
      <path d="M 28 36 L 42 30 L 52 28" stroke={v2.blue} strokeWidth="0.5" fill="none" strokeDasharray="1 1" opacity="0.8" />
      <path d="M 38 62 L 55 64 L 62 70" stroke={v2.green} strokeWidth="0.5" fill="none" strokeDasharray="1 1" opacity="0.8" />

      {/* Job pins (gray = scheduled, colored = active) */}
      {[
        { x: 42, y: 30, c: v2.muted },
        { x: 55, y: 64, c: v2.muted },
        { x: 75, y: 38, c: v2.muted },
        { x: 22, y: 56, c: v2.muted },
        { x: 88, y: 60, c: v2.muted },
      ].map((p, i) => (
        <rect key={i} x={p.x - 0.6} y={p.y - 0.6} width="1.2" height="1.2" fill={p.c} opacity="0.6" />
      ))}

      {/* Technicians */}
      {techs.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r="2.6" fill={t.color} opacity="0.18">
            <animate attributeName="r" values="2.6;4;2.6" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </circle>
          <circle cx={t.x} cy={t.y} r="1.1" fill={t.color} stroke={v2.bgDeep} strokeWidth="0.3" />
        </g>
      ))}
    </svg>
  );
}

function V2Bars() {
  const data = [3.2, 4.1, 5.5, 6.8, 7.2, 8.1, 7.4, 6.9, 7.8, 8.4, 7.6, 6.4];
  const max = 9;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64, marginTop: 12 }}>
      {data.map((d, i) => {
        const isLive = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: `${(d / max) * 100}%`,
              background: isLive ? v2.green : v2.blue,
              opacity: isLive ? 1 : 0.55,
              boxShadow: isLive ? `0 0 8px ${v2.green}` : 'none',
              borderRadius: 1,
            }} />
            <span style={{ fontSize: 8, color: v2.muted, fontFamily: v2.mono }}>{i % 2 === 0 ? `${i*2}h` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

function V2Event({ tone, time, code, tech, detail }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 90px 70px 1fr',
      gap: 10, padding: '7px 14px', alignItems: 'center', fontSize: 11,
      fontFamily: v2.mono, borderBottom: `1px solid ${v2.line}`,
    }}>
      <span style={{ color: v2.muted }}>{time}</span>
      <span style={{ color: tone, fontWeight: 600, fontSize: 10 }}>{code}</span>
      <span style={{ color: v2.ink }}>{tech}</span>
      <span style={{ color: v2.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
    </div>
  );
}

window.V2Tech = V2Tech;
window.V2Dispatch = V2Dispatch;
