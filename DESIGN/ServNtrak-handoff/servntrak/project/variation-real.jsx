/* global React */
const { useState } = React;

// ============================================================================
// ServNtrak (Peralta Gardens) — based on real DESIGN_SYSTEM.md from repo
// Verde theme: --primary 152 55% 28% (#2D6A4F)
// Azul theme:  --primary 221 83% 53%
// Laranja:     --primary 31 91% 51%
// Font: Inter. Border-radius: 1rem. PT-PT copy.
// ============================================================================

// ServNtrak logo palette
// Verde #4CAF50 (folha) · Teal #009688 (onda) · Laranja #E65100 (N)
// Slate #263238 (texto) · Cinza #757575 (muted)
const T = {
  bg: '#FAFAF7',
  fg: '#263238',
  muted: '#EEF1F0',
  mutedFg: '#757575',
  card: '#ffffff',
  border: '#E4E6E8',
  // Verde (folha)
  primary: '#4CAF50',
  primaryFg: '#fff',
  primarySoft: '#E8F5E9',
  primaryDeep: '#357A38',
  // Accent teal (onda)
  accent: '#009688',
  accentSoft: '#E0F2F1',
  // Warm orange (letra N)
  warm: '#E65100',
  warmSoft: '#FFF3E0',
  destructive: '#D32F2F',
  font: "'Inter', system-ui, sans-serif",
  online: '#4CAF50',
  away: '#E65100',
  busy: '#D32F2F',
  offline: '#9CA3AF',
};

const gradPrimary = `linear-gradient(135deg, #4CAF50 0%, #357A38 100%)`;
const gradAccent = `linear-gradient(135deg, #009688 0%, #00695C 100%)`;
const gradWarm = `linear-gradient(135deg, #E65100 0%, #B33F00 100%)`;
const gradMesh = `
  radial-gradient(at 40% 20%, rgba(76, 175, 80, 0.30) 0px, transparent 50%),
  radial-gradient(at 80% 0%, rgba(0, 150, 136, 0.22) 0px, transparent 50%),
  radial-gradient(at 0% 50%, rgba(53, 122, 56, 0.22) 0px, transparent 50%),
  radial-gradient(at 80% 50%, rgba(76, 175, 80, 0.15) 0px, transparent 50%),
  radial-gradient(at 0% 100%, rgba(0, 150, 136, 0.18) 0px, transparent 50%)
`;

// ----------- TECHNICIAN (mobile, real PT-PT, Início page) ----------------

function TechReal() {
  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg, color: T.fg,
      fontFamily: T.font, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${T.border}`, overflow: 'hidden',
    }}>
      {/* Hero header — gradient mesh per design system (compact) */}
      <div style={{
        background: gradPrimary, color: '#fff', padding: '12px 18px 14px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: gradMesh, opacity: 0.6 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              background: '#fff', borderRadius: 8, padding: '4px 7px',
              display: 'flex', alignItems: 'center',
            }}>
              <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak"
                style={{ height: 18, display: 'block' }} />
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
              display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.3)',
            }}>TS</div>
          </div>
          <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 0.3, marginTop: 10 }}>Sexta-feira, 1 maio</div>
          <div style={{
            fontSize: 20, fontWeight: 800, marginTop: 2, letterSpacing: -0.4, lineHeight: 1.1,
          }}>Bom dia, Tiago</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>
            <strong style={{ fontWeight: 700 }}>5 visitas</strong> hoje · próxima às <strong style={{ fontWeight: 700 }}>09:45</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 14px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'block', position: 'relative', zIndex: 2 }}>
        {/* Weather card — first */}
        <div style={{ marginBottom: 14 }}><WeatherCard /></div>

        {/* Quick actions — matches .quick-action pattern in index.css */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Acções rápidas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <QA bg={T.muted} icon={<IconNote />} label="Nova nota" tone={T.primary} iconColor={T.primary} />
            <QA bg={T.muted} icon={<IconMic />} label="Voz" tone={T.accent} iconColor={T.accent} />
            <QA bg={T.muted} icon={<IconCamera />} label="Foto" tone={T.warm} iconColor={T.warm} />
            <QA bg={T.muted} icon={<IconCloud />} label="Tempo" tone={T.primaryDeep} iconColor={T.primaryDeep} />
          </div>
        </div>

        {/* Voice-to-text card — uses react-speech-recognition in real app */}
        <div style={{
          background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
          padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: gradAccent,
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 14px rgba(0, 150, 136, 0.35)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Registo por voz</div>
            <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 2 }}>"pH em 7.4, adicionei 2kg de cloro…"</div>
          </div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[3,5,7,4,6,8,5,3].map((h, i) => (
              <span key={i} style={{ width: 2, height: h*2, background: T.accent, borderRadius: 2, opacity: 0.5 + (i%3)*0.15 }} />
            ))}
          </div>
        </div>

        {/* Próximas visitas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Agenda de hoje</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>Ver tudo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Visit time="08:30" client="Quinta da Aldegalega" task="Piscina · Manutenção semanal" status="done" />
            <Visit time="09:15" client="Família Coronado" task="Jardim · Poda e adubação" status="done" />
            <Visit time="09:45" client="Hillcrest #14" task="Piscina · Tratamento de algas" status="next" eta="ETA 09:42" />
            <Visit time="11:30" client="Condomínio Bayview" task="Jardim · Verificação rega" status="upcoming" />
            <Visit time="13:00" client="Marina Heights" task="Piscina · Troca de filtro" status="upcoming" />
          </div>
        </div>
      </div>

      {/* Bottom nav — matches BottomNav.tsx */}
      <div style={{
        flex: '0 0 auto', background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)', borderTop: `1px solid ${T.border}`,
        borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(76, 175, 80, 0.10)',
        display: 'flex', height: 64, padding: '4px 8px', zIndex: 3,
      }}>
        {[
          { l: 'Início', I: NavHome, active: true },
          { l: 'Clientes', I: NavUsers },
          { l: 'Agenda', I: NavCal },
          { l: 'Relatórios', I: NavChart },
          { l: 'Perfil', I: NavUser },
        ].map((n, i) => {
          const I = n.I;
          return (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', borderRadius: 12, position: 'relative',
            background: n.active ? 'rgba(76, 175, 80, 0.12)' : 'transparent',
            color: n.active ? T.primary : T.mutedFg,
          }}>
            <I />
            <span style={{
              fontSize: 10, marginTop: 2,
              fontWeight: n.active ? 700 : 500,
              color: n.active ? T.primary : T.mutedFg,
            }}>{n.l}</span>
            {n.active && <span style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 99, background: T.primary }} />}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function WeatherCard() {
  // Hourly forecast for the day's route
  const hours = [
    { t: '09h', Ic: IconSun, deg: 18, rain: 0 },
    { t: '11h', Ic: IconSun, deg: 22, rain: 0 },
    { t: '13h', Ic: IconPartly, deg: 25, rain: 5 },
    { t: '15h', Ic: IconPartly, deg: 26, rain: 10 },
    { t: '17h', Ic: IconRain, deg: 22, rain: 60, alert: true },
    { t: '19h', Ic: IconShowers, deg: 19, rain: 30 },
  ];
  return (
    <div style={{
      background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
    }}>
      {/* Top row: now */}
      <div style={{
        padding: 14, display: 'flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(135deg, #E0F2F1 0%, #E8F5E9 100%)',
      }}>
        <div style={{ width: 44, height: 44, color: '#E6A100', display: 'grid', placeItems: 'center' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.6" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Peralta · agora</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: T.accent }}>20°</span>
            <span style={{ fontSize: 12, color: T.mutedFg }}>sente-se 22°</span>
          </div>
          <div style={{ fontSize: 12, color: T.fg, marginTop: 2, fontWeight: 500 }}>Sol · vento NE 8 km/h</div>
        </div>
        <div style={{
          background: '#fff', borderRadius: 10, padding: '6px 10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', minWidth: 64,
        }}>
          <div style={{ fontSize: 9, color: T.mutedFg, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>UV</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.fg, marginTop: 1 }}>6</div>
          <div style={{ fontSize: 9, color: T.mutedFg }}>alto</div>
        </div>
      </div>

      {/* Hourly strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderTop: `1px solid ${T.border}` }}>
        {hours.map((h, i) => {
          const Ic = h.Ic;
          return (
          <div key={i} style={{
            padding: '10px 4px', textAlign: 'center',
            borderRight: i < hours.length - 1 ? `1px solid ${T.border}` : 'none',
            background: h.alert ? '#FFF8F0' : 'transparent',
          }}>
            <div style={{ fontSize: 10, color: T.mutedFg, fontWeight: 600 }}>{h.t}</div>
            <div style={{ marginTop: 4, color: h.alert ? T.warm : (h.Ic === IconSun ? '#E6A100' : (h.rain >= 5 ? T.accent : T.primary)), display: 'grid', placeItems: 'center' }}><Ic /></div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, color: T.fg }}>{h.deg}°</div>
            <div style={{
              fontSize: 9, marginTop: 1, fontWeight: 600,
              color: h.rain >= 50 ? T.warm : T.mutedFg, opacity: h.rain === 0 ? 0.4 : 1,
            }}>{h.rain}%</div>
          </div>
          );
        })}
      </div>

      {/* Alert footer — affects today's route */}
      <div style={{
        padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8,
        borderTop: `1px solid ${T.border}`, background: '#FFF8F0',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 99, background: T.warm, flex: '0 0 auto',
        }} />
        <span style={{ fontSize: 11, color: T.fg, flex: 1 }}>
          <strong style={{ fontWeight: 700 }}>Aguaceiro previsto às 17h</strong> · Marina Heights pode ser adiada
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.warm }}>Ver →</span>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }) {  return (
    <div style={{ padding: '4px 8px' }}>
      <div style={{ fontSize: 10, color: T.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: tone, marginTop: 4, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function QA({ bg, icon, label, tone, iconColor }) {
  return (
    <div style={{
      background: bg, borderRadius: 16,
      padding: '12px 6px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 6, border: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: iconColor || T.primary,
        display: 'grid', placeItems: 'center',
        color: '#fff',
        boxShadow: `0 3px 10px ${iconColor ? iconColor + '40' : T.primary + '40'}`,
      }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 600, color: tone }}>{label}</span>
    </div>
  );
}

// Minimalist line icons — stroke-only, currentColor
function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}
function IconNote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1A4 4 0 0 0 7 17z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
    </svg>
  );
}
function IconPartly() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="9" r="3" />
      <path d="M8 3v1.5M3 9h1.5M4.6 5.6l1 1M11.4 5.6l-1 1M4.6 12.4l1-1" />
      <path d="M9 18h8a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-8.6-.8" />
    </svg>
  );
}
function IconRain() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 14h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1A4 4 0 0 0 7 14z" />
      <path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3" />
    </svg>
  );
}
function IconShowers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1A4 4 0 0 0 7 13z" />
      <path d="M10 16l-1 4M15 16l-1 4" />
    </svg>
  );
}

// Bottom nav line icons
function NavHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function NavUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.6-3.2 3.1-5 6-5s5.4 1.8 6 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15 14.5c2.5-.4 5 1 5.6 4" />
    </svg>
  );
}
function NavCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function NavChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function NavUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4 21c1-4.5 4.4-6.5 8-6.5s7 2 8 6.5" />
    </svg>
  );
}

function Visit({ time, client, task, status, eta }) {
  const isDone = status === 'done', isNext = status === 'next';
  return (
    <div style={{
      background: T.card, borderRadius: 16,
      border: `1px solid ${isNext ? T.primary : T.border}`,
      boxShadow: isNext ? `0 0 0 3px rgba(76, 175, 80, 0.12), 0 4px 14px rgba(76, 175, 80, 0.18)` : '0 1px 3px rgba(0,0,0,0.04)',
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      opacity: isDone ? 0.6 : 1,
    }}>
      <div style={{ minWidth: 44, fontSize: 12, fontWeight: 600, color: isNext ? T.primary : T.mutedFg }}>{time}</div>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: isDone ? T.primarySoft : isNext ? T.primary : T.muted,
        display: 'grid', placeItems: 'center',
      }}>
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : isNext ? (
          <span style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }} />
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: 99, background: T.mutedFg }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none' }}>{client}</div>
        <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 2 }}>{task}</div>
      </div>
      {isNext && eta && (
        <div style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>{eta}</div>
      )}
    </div>
  );
}

// ----------- DISPATCHER (web — based on real Home/Calendar pages) -----------

function DispReal() {
  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg, color: T.fg,
      fontFamily: T.font, display: 'flex', overflow: 'hidden',
    }}>
      {/* Sidebar — matches real nav structure */}
      <div style={{
        width: 220, background: gradPrimary, color: '#fff',
        display: 'flex', flexDirection: 'column', padding: '20px 12px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: gradMesh, opacity: 0.4 }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px' }}>
            <div style={{
              background: '#fff', borderRadius: 10, padding: '8px 10px',
              display: 'flex', alignItems: 'center',
            }}>
              <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak"
                style={{ height: 24, display: 'block' }} />
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Peralta Gardens</div>
          </div>

          {[
            ['🏠', 'Início', true],
            ['👥', 'Clientes'],
            ['📅', 'Agenda'],
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

          {/* Theme switcher hint — real app has this in Perfil → Aparência */}
          <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.18)', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Aparência</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ flex: 1, height: 24, borderRadius: 6, background: '#4CAF50', border: '2px solid #fff' }} title="Verde · folha" />
              <span style={{ flex: 1, height: 24, borderRadius: 6, background: '#009688' }} title="Teal · onda" />
              <span style={{ flex: 1, height: 24, borderRadius: 6, background: '#E65100' }} title="Laranja · N" />
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: T.mutedFg, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 600 }}>Sexta-feira, 1 maio</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, letterSpacing: -0.7 }}>Bom dia, Tiago</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              background: T.card, border: `1px solid ${T.border}`, padding: '8px 14px',
              borderRadius: 12, fontSize: 13, color: T.fg, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>Filtros</button>
            <button style={{
              background: gradPrimary, color: '#fff', border: 'none', padding: '8px 16px',
              borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              boxShadow: '0 4px 14px rgba(76, 175, 80, 0.32)',
            }}>+ Novo cliente</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Clientes activos" value="148" sub="+6 este mês" tone={T.primary} />
          <Kpi label="Visitas hoje" value="47" sub="2 alertas" tone={T.accent} />
          <Kpi label="Em rota" value="12" sub="11/12 em horário" tone={T.primary} />
          <Kpi label="Faturação · maio" value="€48,210" sub="+12%" tone={T.warm} />
        </div>

        {/* Two cols */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* Map */}
          <div style={{
            background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Rotas de hoje</div>
                <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 1 }}>Alentejo · 6 técnicos activos</div>
              </div>
              <div style={{ display: 'flex', gap: 4, fontSize: 11 }}>
                {['Todos','Piscinas','Jardins'].map((t, i) => (
                  <span key={t} style={{
                    padding: '5px 12px', borderRadius: 99, fontWeight: 600,
                    background: i === 0 ? T.primarySoft : 'transparent',
                    color: i === 0 ? T.primary : T.mutedFg,
                  }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
              <RealMap />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            {/* Weekly chart */}
            <div style={{
              background: T.card, borderRadius: 18, padding: 16, border: `1px solid ${T.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 11, color: T.mutedFg, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 600 }}>Esta semana</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>328 visitas</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: T.primarySoft, padding: '4px 10px', borderRadius: 99 }}>+18%</div>
              </div>
              <Bars />
            </div>

            {/* Activity */}
            <div style={{
              background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
              flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 16, fontWeight: 700 }}>Atividade recente</div>
              <div style={{ flex: 1, overflow: 'hidden', padding: '8px 18px' }}>
                <Tl tone={T.primary} when="agora" who="Tiago" what="iniciou visita em Hillcrest #14" />
                <Tl tone={T.accent} when="há 3 min" who="Ana" what='registou: "pH 7.4 · 2kg cloro"' />
                <Tl tone={T.warm} when="há 6 min" who="Sistema" what="redirecionou João (trânsito A2)" />
                <Tl tone={T.primary} when="há 21 min" who="Pedro" what="concluiu poda no Coronado" />
                <Tl tone={T.primary} when="há 38 min" who="Aldegalega" what="pagou fatura · €186" last />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div style={{
      background: T.card, borderRadius: 16, padding: 14, border: `1px solid ${T.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 10, color: T.mutedFg, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, marginTop: 6, color: tone }}>{value}</div>
      <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function RealMap() {
  const techs = [
    { x: 30, y: 38 }, { x: 52, y: 30 }, { x: 70, y: 50 },
    { x: 38, y: 64 }, { x: 62, y: 70 }, { x: 80, y: 24 },
  ];
  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="land" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#E0F2F1" />
        </linearGradient>
      </defs>
      <rect width="100" height="80" fill="url(#land)" />
      <path d="M -10 25 Q 25 15 55 25 T 110 22 L 110 -10 L -10 -10 Z" fill="#C8E6C9" opacity="0.7" />
      <path d="M -10 60 Q 35 52 70 64 T 110 58 L 110 90 L -10 90 Z" fill="#B2DFDB" opacity="0.6" />
      <path d="M 0 32 Q 30 28 60 34 T 100 30" stroke="#fff" strokeWidth="2.5" fill="none" />
      <path d="M 0 32 Q 30 28 60 34 T 100 30" stroke="#CFD8DC" strokeWidth="0.4" fill="none" />
      <path d="M 0 55 Q 35 62 65 56 T 100 60" stroke="#fff" strokeWidth="2.5" fill="none" />
      <path d="M 0 55 Q 35 62 65 56 T 100 60" stroke="#CFD8DC" strokeWidth="0.4" fill="none" />
      <path d="M 30 38 L 42 32 L 52 30" stroke={T.primary} strokeWidth="0.7" strokeDasharray="1.5 1" fill="none" />
      <path d="M 38 64 L 55 64 L 62 70" stroke={T.accent} strokeWidth="0.7" strokeDasharray="1.5 1" fill="none" />
      {techs.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r="3.5" fill={T.primary} opacity="0.18" />
          <circle cx={t.x} cy={t.y} r="2" fill={T.primary} stroke="#fff" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}

function Bars() {
  const data = [42, 48, 52, 56, 49, 58, 23];
  const labels = ['S','T','Q','Q','S','S','D'];
  const max = 60;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70, marginTop: 14 }}>
      {data.map((d, i) => {
        const isToday = i === 4;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: `${(d/max) * 100}%`, borderRadius: 6,
              background: isToday ? gradPrimary : T.primarySoft,
              border: isToday ? 'none' : `1px solid ${T.border}`,
            }} />
            <span style={{ fontSize: 10, color: isToday ? T.primary : T.mutedFg, fontWeight: isToday ? 700 : 500 }}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Tl({ tone, when, who, what, last }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 99, background: tone, border: '2px solid #fff', boxShadow: `0 0 0 1.5px ${tone}` }} />
        {!last && <div style={{ flex: 1, width: 1.5, background: T.border, marginTop: 3 }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12 }}>
          <strong style={{ fontWeight: 700 }}>{who}</strong>
          <span style={{ color: T.mutedFg }}> {what}</span>
        </div>
        <div style={{ fontSize: 10, color: T.mutedFg, marginTop: 2 }}>{when}</div>
      </div>
    </div>
  );
}

window.TechReal = TechReal;
window.DispReal = DispReal;
