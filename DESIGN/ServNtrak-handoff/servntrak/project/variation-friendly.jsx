/* global React */

// ============================================================================
// VARIATION 3 — FRIENDLY & APPROACHABLE
// Warm, consumer-grade polish. DM Sans + Instrument Serif for accents.
// Soft sage green primary, sky blue + warm orange. Generous, rounded, photo-ish.
// ============================================================================

const v3 = {
  bg: '#F7F5EF',
  panel: '#FFFFFF',
  ink: '#1F2A24',
  muted: '#6E7A72',
  line: '#E8E3D6',
  green: '#4F7F5E',
  greenSoft: '#E5EFE6',
  greenDeep: '#2F5440',
  blue: '#3B7BA8',
  blueSoft: '#E2EEF6',
  orange: '#E58239',
  orangeSoft: '#FBE8D5',
  cream: '#FAF6EB',
  font: "'DM Sans', -apple-system, system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
};

function V3Tech() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v3.bg, color: v3.ink,
      fontFamily: v3.font, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${v3.line}`, overflow: 'hidden',
    }}>
      {/* Hero header w/ greeting */}
      <div style={{
        background: v3.greenDeep, color: '#fff',
        padding: '20px 22px 28px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle leaf doodle */}
        <svg style={{ position: 'absolute', right: -10, top: -10, opacity: 0.16 }} width="140" height="140" viewBox="0 0 100 100">
          <path d="M50 10 Q 80 30 70 70 Q 50 90 30 70 Q 20 30 50 10 Z" fill="#fff" />
          <path d="M50 10 L 50 90" stroke="#fff" strokeWidth="0.5" />
        </svg>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.3 }}>Friday · May 1</div>
            <div style={{
              fontFamily: v3.serif, fontSize: 30, fontWeight: 400,
              marginTop: 6, letterSpacing: -0.5, lineHeight: 1.1,
            }}>Hi Marco, <em style={{ fontStyle: 'italic', opacity: 0.85 }}>good morning.</em></div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>You have <strong style={{ fontWeight: 600 }}>3 stops</strong> left · est. wrap by <strong style={{ fontWeight: 600 }}>2:30 pm</strong></div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 99, background: 'rgba(255,255,255,0.18)',
            display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600,
          }}>MR</div>
        </div>
      </div>

      <div style={{ padding: '0 18px', marginTop: -16, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Day-at-a-glance ring */}
        <div style={{
          background: v3.panel, borderRadius: 16, padding: 16,
          boxShadow: '0 4px 20px rgba(31,42,36,0.06)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <V3Ring pct={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: v3.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Today</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>2 of 5 done</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: v3.green }} />
                <span style={{ color: v3.muted }}>Pool · 3</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: v3.blue }} />
                <span style={{ color: v3.muted }}>Garden · 2</span>
              </span>
            </div>
          </div>
        </div>

        {/* Voice card */}
        <div style={{
          background: v3.orangeSoft, borderRadius: 16, padding: 14,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 99, background: v3.orange,
            display: 'grid', placeItems: 'center', boxShadow: `0 4px 12px ${v3.orange}55`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Tap & talk</div>
            <div style={{ fontSize: 11, color: v3.muted, marginTop: 2 }}>Log notes hands-free while you work</div>
          </div>
          <div style={{ fontSize: 11, color: v3.orange, fontWeight: 600 }}>Try →</div>
        </div>

        {/* Up next — featured card */}
        <div style={{ fontSize: 12, color: v3.muted, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>Up next</span>
          <span>in 3 min</span>
        </div>
        <div style={{
          background: v3.panel, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(31,42,36,0.06)', border: `1px solid ${v3.line}`,
        }}>
          {/* "Photo" placeholder of pool */}
          <div style={{
            height: 86, background: `linear-gradient(135deg, #6BA8C9 0%, #4F7F5E 100%)`,
            position: 'relative', overflow: 'hidden',
          }}>
            <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0 50 Q 50 35 100 50 T 200 50 L 200 80 L 0 80 Z" fill="rgba(255,255,255,0.18)" />
              <path d="M0 60 Q 50 45 100 60 T 200 60 L 200 80 L 0 80 Z" fill="rgba(255,255,255,0.12)" />
              <circle cx="170" cy="20" r="10" fill="rgba(255,239,180,0.7)" />
            </svg>
            <div style={{
              position: 'absolute', top: 10, left: 12,
              background: 'rgba(255,255,255,0.92)', borderRadius: 99,
              padding: '3px 8px', fontSize: 10, fontWeight: 600, color: v3.greenDeep,
            }}>POOL · ALGAE</div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{
              fontFamily: v3.serif, fontSize: 19, fontWeight: 400, letterSpacing: -0.3,
            }}>Hillcrest Estate <span style={{ color: v3.muted }}>#14</span></div>
            <div style={{ fontSize: 11, color: v3.muted, marginTop: 2 }}>1422 Oakmont Dr · 2.4 mi</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <span style={{ background: v3.greenSoft, color: v3.greenDeep, padding: '4px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>Weekly</span>
              <span style={{ background: v3.blueSoft, color: v3.blue, padding: '4px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>60 min</span>
              <span style={{ background: v3.cream, color: v3.muted, padding: '4px 9px', borderRadius: 99, fontSize: 10, fontWeight: 500, border: `1px solid ${v3.line}` }}>6 tasks</span>
            </div>
            <button style={{
              marginTop: 12, width: '100%', background: v3.greenDeep, color: '#fff',
              border: 'none', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>Start visit →</button>
          </div>
        </div>

        {/* Mini schedule */}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
          {[
            { t: '8:30', c: 'Aldridge', done: true },
            { t: '9:15', c: 'Coronado', done: true },
            { t: '11:30', c: 'Bayview', done: false },
            { t: '1:00', c: 'Marina', done: false },
          ].map((j, i) => (
            <div key={i} style={{
              flex: 1, background: v3.panel, borderRadius: 12, padding: 10,
              border: `1px solid ${v3.line}`, opacity: j.done ? 0.55 : 1,
            }}>
              <div style={{ fontSize: 10, color: v3.muted }}>{j.t}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, textDecoration: j.done ? 'line-through' : 'none' }}>{j.c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function V3Ring({ pct }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke={v3.greenSoft} strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={v3.green} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct/100)}
          transform="rotate(-90 32 32)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontSize: 14, fontWeight: 700, color: v3.greenDeep,
      }}>{pct}%</div>
    </div>
  );
}

// ----- Dispatcher (friendly web) ----------------------------------------

function V3Dispatch() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v3.bg, color: v3.ink,
      fontFamily: v3.font, display: 'flex', overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 200, background: v3.greenDeep, color: '#fff',
        display: 'flex', flexDirection: 'column', padding: '20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 18px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: '#fff',
            color: v3.greenDeep, display: 'grid', placeItems: 'center',
            fontSize: 14, fontWeight: 700, fontFamily: v3.serif,
          }}>S</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ServNtrak</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>Sage Pool & Garden</div>
          </div>
        </div>

        {[
          ['Today', true],
          ['Schedule', false],
          ['Customers', false],
          ['Routes', false],
          ['Inventory', false],
          ['Reports', false],
          ['Settings', false],
        ].map(([label, active]) => (
          <div key={label} style={{
            padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 2,
            background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
            fontWeight: active ? 600 : 400, opacity: active ? 1 : 0.78,
          }}>{label}</div>
        ))}

        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 12 }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>This week</div>
          <div style={{ fontFamily: v3.serif, fontSize: 22, marginTop: 2 }}>$48,210</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>↑ 12% vs last week</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: v3.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Friday, May 1</div>
            <div style={{ fontFamily: v3.serif, fontSize: 30, fontWeight: 400, marginTop: 2, letterSpacing: -0.5 }}>
              Good morning, Elena.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              background: v3.panel, border: `1px solid ${v3.line}`, padding: '8px 14px',
              borderRadius: 99, fontSize: 12, color: v3.ink, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            }}>Quick assign</button>
            <button style={{
              background: v3.greenDeep, color: '#fff', border: 'none', padding: '8px 16px',
              borderRadius: 99, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>+ New job</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <V3Kpi label="Jobs today" value="47" sub="2 alerts" tone={v3.green} icon="📋" />
          <V3Kpi label="Techs out" value="12" sub="11 on time" tone={v3.blue} icon="🚐" />
          <V3Kpi label="Gallons saved" value="2.1k" sub="this month" tone={v3.green} icon="💧" />
          <V3Kpi label="Revenue today" value="$8,420" sub="+12%" tone={v3.orange} icon="📈" />
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* Live map card */}
          <div style={{
            background: v3.panel, borderRadius: 18, overflow: 'hidden',
            border: `1px solid ${v3.line}`, display: 'flex', flexDirection: 'column',
            boxShadow: '0 2px 10px rgba(31,42,36,0.04)',
          }}>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: v3.serif, fontSize: 18, fontWeight: 400 }}>Today's routes</div>
                <div style={{ fontSize: 11, color: v3.muted, marginTop: 1 }}>San Diego County · 6 active</div>
              </div>
              <div style={{ display: 'flex', gap: 4, fontSize: 11 }}>
                {['All', 'Pool', 'Garden'].map((t, i) => (
                  <span key={t} style={{
                    padding: '5px 10px', borderRadius: 99,
                    background: i === 0 ? v3.greenSoft : 'transparent',
                    color: i === 0 ? v3.greenDeep : v3.muted,
                    fontWeight: i === 0 ? 600 : 500,
                  }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', background: v3.cream, minHeight: 0 }}>
              <V3Map />
            </div>
          </div>

          {/* Right: timeline + chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            {/* Weekly chart */}
            <div style={{
              background: v3.panel, borderRadius: 18, padding: 16, border: `1px solid ${v3.line}`,
              boxShadow: '0 2px 10px rgba(31,42,36,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 11, color: v3.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>This week</div>
                  <div style={{ fontFamily: v3.serif, fontSize: 22, marginTop: 4 }}>328 visits</div>
                </div>
                <div style={{ fontSize: 11, color: v3.green, background: v3.greenSoft, padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>+18%</div>
              </div>
              <V3Bars />
            </div>

            {/* Activity timeline */}
            <div style={{
              background: v3.panel, borderRadius: 18, border: `1px solid ${v3.line}`,
              flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(31,42,36,0.04)',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${v3.line}` }}>
                <div style={{ fontFamily: v3.serif, fontSize: 18, fontWeight: 400 }}>Live activity</div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', padding: '10px 18px' }}>
                <V3Timeline tone={v3.green} when="just now" who="Marco" what="started Hillcrest #14" />
                <V3Timeline tone={v3.blue} when="3 min ago" who="Aiya" what="logged: pH 7.4 · 2lb shock" />
                <V3Timeline tone={v3.orange} when="6 min ago" who="System" what="rerouted Jonas around traffic" />
                <V3Timeline tone={v3.green} when="21 min ago" who="Priya" what="finished Coronado garden trim" />
                <V3Timeline tone={v3.green} when="38 min ago" who="Aldridge" what="paid invoice · $186" last />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V3Kpi({ label, value, sub, tone, icon }) {
  return (
    <div style={{
      background: v3.panel, borderRadius: 16, padding: 14, border: `1px solid ${v3.line}`,
      boxShadow: '0 2px 10px rgba(31,42,36,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, color: v3.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: v3.serif, fontSize: 28, fontWeight: 400, letterSpacing: -0.5, marginTop: 6, color: tone }}>{value}</div>
      <div style={{ fontSize: 11, color: v3.muted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function V3Map() {
  const techs = [
    { x: 30, y: 38, c: v3.green },
    { x: 52, y: 30, c: v3.blue },
    { x: 70, y: 50, c: v3.orange },
    { x: 38, y: 64, c: v3.green },
    { x: 62, y: 70, c: v3.blue },
    { x: 80, y: 24, c: v3.green },
  ];
  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      {/* Soft topographical blobs */}
      <path d="M -10 30 Q 30 10 60 30 T 110 25 L 110 -10 L -10 -10 Z" fill={v3.greenSoft} opacity="0.7" />
      <path d="M -10 60 Q 40 50 80 65 T 110 60 L 110 90 L -10 90 Z" fill={v3.blueSoft} opacity="0.6" />
      <path d="M 20 0 Q 40 40 30 80 L 0 80 L 0 0 Z" fill={v3.cream} opacity="0.5" />

      {/* Roads */}
      <path d="M 0 32 Q 30 28 60 34 T 100 30" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M 0 32 Q 30 28 60 34 T 100 30" stroke={v3.line} strokeWidth="0.4" fill="none" />
      <path d="M 0 55 Q 35 62 65 56 T 100 60" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M 0 55 Q 35 62 65 56 T 100 60" stroke={v3.line} strokeWidth="0.4" fill="none" />

      {/* Routes */}
      <path d="M 30 38 L 42 32 L 52 30" stroke={v3.greenDeep} strokeWidth="0.6" strokeDasharray="1.5 1" fill="none" />
      <path d="M 38 64 L 55 64 L 62 70" stroke={v3.blue} strokeWidth="0.6" strokeDasharray="1.5 1" fill="none" />

      {/* Tech markers */}
      {techs.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r="3.5" fill={t.c} opacity="0.18" />
          <circle cx={t.x} cy={t.y} r="2" fill={t.c} stroke="#fff" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}

function V3Bars() {
  const data = [42, 48, 52, 56, 49, 58, 23];
  const labels = ['M','T','W','T','F','S','S'];
  const max = 60;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70, marginTop: 14 }}>
      {data.map((d, i) => {
        const isToday = i === 4;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: `${(d/max) * 100}%`, borderRadius: 6,
              background: isToday ? v3.green : v3.greenSoft,
              border: isToday ? 'none' : `1px solid ${v3.line}`,
            }} />
            <span style={{ fontSize: 10, color: isToday ? v3.greenDeep : v3.muted, fontWeight: isToday ? 700 : 500 }}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function V3Timeline({ tone, when, who, what, last }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 12, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 99, background: tone, border: '2px solid #fff', boxShadow: `0 0 0 1.5px ${tone}` }} />
        {!last && <div style={{ flex: 1, width: 1.5, background: v3.line, marginTop: 3 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: -2 }}>
        <div style={{ fontSize: 12 }}>
          <strong style={{ fontWeight: 600 }}>{who}</strong>
          <span style={{ color: v3.muted }}> {what}</span>
        </div>
        <div style={{ fontSize: 10, color: v3.muted, marginTop: 2 }}>{when}</div>
      </div>
    </div>
  );
}

window.V3Tech = V3Tech;
window.V3Dispatch = V3Dispatch;
