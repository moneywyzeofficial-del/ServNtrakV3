/* global React */
const { useState } = React;

// ============================================================================
// VARIATION 1 — CLEAN SaaS (Linear / Notion vibe)
// Light, airy, restrained. Generous whitespace. Geist font. Subtle accents.
// Trustworthy blue as primary, soft green + amber as data accents.
// ============================================================================

const v1 = {
  bg: '#FAFAF7',
  panel: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#6B7280',
  line: '#EAEAE5',
  blue: '#2563EB',
  blueSoft: '#EFF4FF',
  green: '#16A34A',
  greenSoft: '#ECFDF3',
  orange: '#EA580C',
  orangeSoft: '#FFF4ED',
  font: "'Geist', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

// ----- Line-icon set (V3-microphone style: 24×24, no fill, stroke, round caps) -----
const V1Icon = ({ children, size = 18, color = 'currentColor', strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const IcoMic = (p) => <V1Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></V1Icon>;
const IcoBell = (p) => <V1Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></V1Icon>;
const IcoCheck = (p) => <V1Icon {...p}><polyline points="20 6 9 17 4 12" /></V1Icon>;
const IcoSun = (p) => <V1Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></V1Icon>;
const IcoCloudSun = (p) => <V1Icon {...p}><circle cx="7" cy="8" r="2.4" /><path d="M7 2v1.5M2.6 8H4M3.6 4.6l1 1M11.4 4.6l-1 1" /><path d="M9 16a4 4 0 1 1 4-7.5A4.5 4.5 0 0 1 17 17H9a3 3 0 0 1 0-1z" /></V1Icon>;
const IcoCloudRain = (p) => <V1Icon {...p}><path d="M7 17a4 4 0 1 1 1-7.9A5 5 0 0 1 17.5 11 3.5 3.5 0 0 1 17 18H7" /><path d="M9 21l1-2M13 21l1-2M17 21l1-2" /></V1Icon>;
const IcoCloudDrizzle = (p) => <V1Icon {...p}><path d="M7 17a4 4 0 1 1 1-7.9A5 5 0 0 1 17.5 11 3.5 3.5 0 0 1 17 18H7" /><path d="M9 21v-1M13 21v-1M17 21v-1" /></V1Icon>;
const IcoHome = (p) => <V1Icon {...p}><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></V1Icon>;
const IcoUsers = (p) => <V1Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2 21a7 7 0 0 1 14 0" /><circle cx="17" cy="6" r="2.5" /><path d="M16 13a5 5 0 0 1 6 5" /></V1Icon>;
const IcoCalendar = (p) => <V1Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></V1Icon>;
const IcoChart = (p) => <V1Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></V1Icon>;
const IcoUser = (p) => <V1Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></V1Icon>;
const IcoMapPin = (p) => <V1Icon {...p}><path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></V1Icon>;
const IcoWind = (p) => <V1Icon {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h17" /></V1Icon>;
const IcoAlert = (p) => <V1Icon {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></V1Icon>;

function V1Tech() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v1.bg, color: v1.ink,
      fontFamily: v1.font, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Phone-frame header strip */}
      <div style={{
        padding: '14px 20px 10px', borderBottom: `1px solid ${v1.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: v1.panel,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: v1.ink,
            color: '#fff', display: 'grid', placeItems: 'center',
          }}>
            <IcoUser size={16} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: v1.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Technician</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>Marco Reyes</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: v1.green }} />
            <span style={{ fontSize: 12, color: v1.muted }}>On route</span>
          </div>
          <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 8,
            border: `1px solid ${v1.line}`, display: 'grid', placeItems: 'center' }}>
            <IcoBell size={15} color={v1.ink} strokeWidth={2} />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7,
              borderRadius: 99, background: v1.orange, border: '1.5px solid #fff' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 20px', flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: v1.muted }}>Friday, May 1</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>Good morning, Marco</div>
          </div>
          <div style={{ fontSize: 12, color: v1.muted }}>5 stops · 7.2 hrs</div>
        </div>

        {/* Weather window — same structure as 00b mobile */}
        <V1Weather />

        {/* Today stats */}
        <div style={{
          background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 14,
          padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        }}>
          <V1Stat label="Completed" value="2" hint="of 5" accent={v1.green} />
          <V1Stat label="Next ETA" value="9:45" hint="Hillcrest pool" accent={v1.blue} />
          <V1Stat label="Revenue" value="$840" hint="today" accent={v1.orange} />
        </div>

        {/* Voice quick action */}
        <div style={{
          background: v1.panel, border: `1px solid ${v1.line}`,
          borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 99, background: v1.blueSoft,
            display: 'grid', placeItems: 'center',
          }}>
            <IcoMic size={18} color={v1.blue} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Hold to log work</div>
            <div style={{ fontSize: 11, color: v1.muted, marginTop: 1 }}>"pH was 7.8, added 2lb shock…"</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[3,5,2,7,4,6,3].map((h, i) => (
              <span key={i} style={{ width: 2, height: h*2, background: v1.blue, borderRadius: 2, opacity: 0.4 + i*0.08 }} />
            ))}
          </div>
        </div>

        {/* Today's route */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Today's route</div>
          <div style={{ fontSize: 11, color: v1.muted }}>3 remaining</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <V1Job time="8:30" status="done" client="Aldridge Estate" task="Pool · Weekly service" duration="42 min" />
          <V1Job time="9:15" status="done" client="Coronado Villas" task="Garden · Trim & feed" duration="38 min" />
          <V1Job time="9:45" status="next" client="Hillcrest #14" task="Pool · Algae treatment" duration="60 min" eta="ETA 9:42" />
          <V1Job time="11:30" status="upcoming" client="Bayview HOA" task="Garden · Irrigation check" duration="45 min" />
        </div>
      </div>

      {/* Bottom nav with line icons */}
      <div style={{
        background: v1.panel, borderTop: `1px solid ${v1.line}`,
        padding: '8px 12px 14px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
      }}>
        {[
          { l: 'Home', Ico: IcoHome, active: true },
          { l: 'Customers', Ico: IcoUsers },
          { l: 'Schedule', Ico: IcoCalendar },
          { l: 'Reports', Ico: IcoChart },
          { l: 'Profile', Ico: IcoUser },
        ].map(({ l, Ico, active }) => (
          <div key={l} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: active ? v1.blue : v1.muted, fontSize: 10, fontWeight: active ? 600 : 500,
            padding: '4px 0',
          }}>
            <Ico size={18} color={active ? v1.blue : v1.muted} strokeWidth={active ? 2.2 : 1.8} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Weather window for V1 (clean SaaS palette, line icons in V3 mic style) -----
function V1Weather() {
  const hours = [
    { t: '11h', Ico: IcoSun, deg: 22, rain: 0 },
    { t: '13h', Ico: IcoCloudSun, deg: 25, rain: 5 },
    { t: '15h', Ico: IcoCloudSun, deg: 26, rain: 10 },
    { t: '17h', Ico: IcoCloudRain, deg: 22, rain: 60, alert: true },
    { t: '19h', Ico: IcoCloudDrizzle, deg: 19, rain: 30 },
  ];
  return (
    <div style={{
      background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        background: v1.blueSoft,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: '#fff',
          display: 'grid', placeItems: 'center', border: `1px solid ${v1.line}`,
        }}>
          <IcoSun size={22} color={v1.orange} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10, color: v1.muted, fontWeight: 600,
            letterSpacing: 0.4, textTransform: 'uppercase' }}>
            <IcoMapPin size={10} color={v1.muted} strokeWidth={2} />
            <span>Peralta · now</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.6, fontFamily: v1.mono }}>20°</span>
            <span style={{ fontSize: 11, color: v1.muted }}>feels 22°</span>
          </div>
          <div style={{ fontSize: 11, color: v1.ink, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IcoWind size={11} color={v1.muted} strokeWidth={2} />
            <span>Clear · NE 8 km/h</span>
          </div>
        </div>
        <div style={{
          background: '#fff', borderRadius: 8, padding: '4px 9px',
          textAlign: 'center', minWidth: 44, border: `1px solid ${v1.line}`,
        }}>
          <div style={{ fontSize: 9, color: v1.muted, fontWeight: 600,
            letterSpacing: 0.3, textTransform: 'uppercase' }}>UV</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: v1.orange, fontFamily: v1.mono }}>6</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${v1.line}` }}>
        {hours.map((h, i) => (
          <div key={i} style={{
            padding: '8px 2px', textAlign: 'center',
            borderRight: i < hours.length - 1 ? `1px solid ${v1.line}` : 'none',
            background: h.alert ? v1.orangeSoft : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{ fontSize: 9, color: v1.muted, fontWeight: 600 }}>{h.t}</div>
            <h.Ico size={16} color={h.alert ? v1.orange : v1.ink} strokeWidth={2} />
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: v1.mono }}>{h.deg}°</div>
            <div style={{
              fontSize: 9, fontWeight: 600,
              color: h.rain >= 50 ? v1.orange : v1.blue, opacity: h.rain === 0 ? 0.4 : 1,
              fontFamily: v1.mono,
            }}>{h.rain}%</div>
          </div>
        ))}
      </div>
      <div style={{
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        borderTop: `1px solid ${v1.line}`, background: v1.orangeSoft,
      }}>
        <IcoAlert size={12} color={v1.orange} strokeWidth={2.2} />
        <span style={{ fontSize: 11, color: v1.ink, flex: 1 }}>
          <strong style={{ fontWeight: 600 }}>Showers at 17h</strong> · Marina Heights may be rescheduled
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: v1.orange }}>View →</span>
      </div>
    </div>
  );
}

function V1Stat({ label, value, hint, accent }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: accent }} />
        <span style={{ fontSize: 11, color: v1.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 4, fontFamily: v1.mono }}>{value}</div>
      <div style={{ fontSize: 11, color: v1.muted, marginTop: 1 }}>{hint}</div>
    </div>
  );
}

function V1Job({ time, status, client, task, duration, eta }) {
  const isDone = status === 'done';
  const isNext = status === 'next';
  const dotColor = isDone ? v1.green : isNext ? v1.blue : v1.muted;
  const dotBg = isDone ? v1.greenSoft : isNext ? v1.blueSoft : '#F5F5F2';

  return (
    <div style={{
      background: v1.panel, border: `1px solid ${isNext ? v1.blue : v1.line}`,
      borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: isNext ? `0 0 0 3px ${v1.blueSoft}` : 'none',
      opacity: isDone ? 0.65 : 1,
    }}>
      <div style={{ minWidth: 42, fontSize: 12, fontFamily: v1.mono, color: v1.muted }}>{time}</div>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: dotBg,
        display: 'grid', placeItems: 'center',
      }}>
        {isDone ? (
          <IcoCheck size={14} color={dotColor} strokeWidth={2.4} />
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: 99, background: dotColor }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none' }}>{client}</div>
        <div style={{ fontSize: 11, color: v1.muted, marginTop: 2 }}>{task}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {isNext && eta ? (
          <div style={{ fontSize: 11, color: v1.blue, fontWeight: 600 }}>{eta}</div>
        ) : (
          <div style={{ fontSize: 11, color: v1.muted, fontFamily: v1.mono }}>{duration}</div>
        )}
      </div>
    </div>
  );
}

// ----- Dispatcher (web dashboard) ---------------------------------------

function V1Dispatch() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v1.bg, color: v1.ink,
      fontFamily: v1.font, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px', borderBottom: `1px solid ${v1.line}`, background: v1.panel,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: v1.ink,
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
          }}>S</div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3 }}>ServNtrak</div>
          <div style={{ width: 1, height: 16, background: v1.line }} />
          {['Dispatch', 'Routes', 'Customers', 'Inventory', 'Reports'].map((t, i) => (
            <div key={t} style={{
              fontSize: 13, color: i === 0 ? v1.ink : v1.muted, fontWeight: i === 0 ? 500 : 400,
              padding: '4px 0', borderBottom: i === 0 ? `1.5px solid ${v1.ink}` : 'none',
            }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: v1.bg, borderRadius: 8, padding: '6px 10px',
            fontSize: 12, color: v1.muted, fontFamily: v1.mono,
          }}>⌘K  Search jobs, customers…</div>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: '#E7E2D9', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>EJ</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: v1.muted }}>Today · Friday, May 1</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, marginTop: 2 }}>Operations</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              border: `1px solid ${v1.line}`, background: v1.panel, fontSize: 13,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', color: v1.ink,
            }}>Filters</button>
            <button style={{
              border: 'none', background: v1.ink, color: '#fff', fontSize: 13,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            }}>+ New job</button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <V1Kpi label="Active jobs" value="47" delta="+8" deltaPos />
          <V1Kpi label="Technicians on duty" value="12" delta="11 active" />
          <V1Kpi label="On-time rate" value="94%" delta="+2.1%" deltaPos />
          <V1Kpi label="Today's revenue" value="$8,420" delta="+12%" deltaPos accent />
        </div>

        {/* Two columns: jobs feed + sparkline panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* Live jobs */}
          <div style={{
            background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 14,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: `1px solid ${v1.line}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Live jobs</div>
              <div style={{ display: 'flex', gap: 4, fontSize: 11, color: v1.muted }}>
                <span style={{ background: v1.bg, padding: '3px 8px', borderRadius: 5 }}>All 47</span>
                <span style={{ padding: '3px 8px' }}>In progress 18</span>
                <span style={{ padding: '3px 8px' }}>Scheduled 21</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <V1Row tech="Marco R." color="#2563EB" client="Hillcrest #14" task="Pool · Algae treatment" status="In progress" eta="42m left" pct={36} />
              <V1Row tech="Aiya T." color="#16A34A" client="Sunset Cove" task="Garden · Hedge prune" status="In progress" eta="18m left" pct={68} />
              <V1Row tech="Jonas L." color="#EA580C" client="Vista Pointe" task="Pool · Equipment" status="In progress" eta="1h 12m" pct={20} />
              <V1Row tech="Priya M." color="#9333EA" client="Bayview HOA" task="Irrigation audit" status="In progress" eta="29m left" pct={54} />
              <V1Row tech="Kai O." color="#0891B2" client="Marina Heights" task="Pool · Filter swap" status="Scheduled" eta="11:30" pct={null} />
              <V1Row tech="Marco R." color="#2563EB" client="Bayview HOA" task="Garden · Irrigation" status="Scheduled" eta="11:30" pct={null} />
            </div>
          </div>

          {/* Right column: chart + activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            <div style={{
              background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 14, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: v1.muted }}>Jobs completed · 14 days</div>
                  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 2, fontFamily: v1.mono }}>328</div>
                </div>
                <div style={{ fontSize: 11, color: v1.green, background: v1.greenSoft, padding: '3px 8px', borderRadius: 5, fontWeight: 500 }}>+18% vs prior</div>
              </div>
              <V1Spark />
            </div>

            <div style={{
              background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 14, flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${v1.line}`, fontSize: 13, fontWeight: 600 }}>Activity</div>
              <div style={{ padding: '4px 16px', overflow: 'hidden', flex: 1 }}>
                <V1Activity time="9:42" actor="Marco R." what="started" detail="Hillcrest #14 · Pool service" />
                <V1Activity time="9:38" actor="Aiya T." what="logged" detail="pH 7.4 · added shock 2lb" />
                <V1Activity time="9:21" actor="System" what="rerouted" detail="Jonas L. · traffic on 405" />
                <V1Activity time="9:04" actor="Priya M." what="completed" detail="Coronado · Garden trim" />
                <V1Activity time="8:50" actor="Customer" what="approved" detail="Aldridge · invoice $186" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V1Kpi({ label, value, delta, deltaPos, accent }) {
  return (
    <div style={{
      background: v1.panel, border: `1px solid ${v1.line}`, borderRadius: 12, padding: 14,
    }}>
      <div style={{ fontSize: 11, color: v1.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{
        fontSize: 26, fontWeight: 600, letterSpacing: -0.7, marginTop: 6,
        color: accent ? v1.orange : v1.ink, fontFamily: v1.mono,
      }}>{value}</div>
      <div style={{
        fontSize: 11, marginTop: 4,
        color: deltaPos ? v1.green : v1.muted,
      }}>{delta}</div>
    </div>
  );
}

function V1Row({ tech, color, client, task, status, eta, pct }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr 100px 90px 60px',
      gap: 14, padding: '11px 16px', borderBottom: `1px solid ${v1.line}`,
      alignItems: 'center', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 18, height: 18, borderRadius: 99, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600 }}>
          {tech.split(' ').map(p => p[0]).join('')}
        </span>
        <span style={{ fontWeight: 500 }}>{tech}</span>
      </div>
      <div>
        <div style={{ fontWeight: 500 }}>{client}</div>
        <div style={{ color: v1.muted, fontSize: 11, marginTop: 1 }}>{task}</div>
      </div>
      <div>
        {pct != null ? (
          <div style={{ height: 5, background: v1.bg, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
          </div>
        ) : (
          <span style={{ color: v1.muted, fontSize: 11 }}>—</span>
        )}
      </div>
      <div style={{ color: v1.muted, fontFamily: v1.mono, fontSize: 11 }}>{eta}</div>
      <div style={{
        fontSize: 10, padding: '3px 7px', borderRadius: 5, textAlign: 'center',
        background: status === 'In progress' ? v1.greenSoft : v1.bg,
        color: status === 'In progress' ? v1.green : v1.muted,
        fontWeight: 500,
      }}>{status === 'In progress' ? 'Live' : 'Sched'}</div>
    </div>
  );
}

function V1Spark() {
  // 14 days of completed jobs
  const data = [18, 22, 19, 24, 21, 26, 28, 24, 30, 27, 32, 29, 34, 28];
  const max = Math.max(...data);
  const w = 360, h = 80;
  const stepX = w / (data.length - 1);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (d / max) * (h - 6)}`).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80, marginTop: 10, display: 'block' }}>
      <defs>
        <linearGradient id="v1grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={v1.blue} stopOpacity="0.18" />
          <stop offset="100%" stopColor={v1.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#v1grad)" />
      <path d={path} stroke={v1.blue} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => i === data.length - 1 && (
        <circle key={i} cx={i * stepX} cy={h - (d / max) * (h - 6)} r="3" fill={v1.blue} stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  );
}

function V1Activity({ time, actor, what, detail }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: `1px dashed ${v1.line}`, alignItems: 'baseline',
    }}>
      <div style={{ fontSize: 11, color: v1.muted, fontFamily: v1.mono, minWidth: 32 }}>{time}</div>
      <div style={{ fontSize: 12, flex: 1 }}>
        <span style={{ fontWeight: 500 }}>{actor}</span>
        <span style={{ color: v1.muted }}> {what} </span>
        <span>{detail}</span>
      </div>
    </div>
  );
}

window.V1Tech = V1Tech;
window.V1Dispatch = V1Dispatch;
