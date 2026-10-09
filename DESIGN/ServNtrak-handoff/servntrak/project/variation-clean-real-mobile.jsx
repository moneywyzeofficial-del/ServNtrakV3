/* global React */

// ============================================================================
// VARIATION 04 (mobile) — Técnico, same palette/typography as V4Dispatch
// Inter, Verde primary #2D6A4F, sky-blue accent, warm orange. PT-PT copy.
// ============================================================================

const v4m = {
  bg: '#FAFAF7',
  panel: '#FFFFFF',
  // ServNtrak logo palette
  ink: '#263238',
  muted: '#757575',
  line: '#E4E6E8',
  primary: '#4CAF50',
  primarySoft: '#E8F5E9',
  primaryDeep: '#357A38',
  accent: '#009688',
  accentSoft: '#E0F2F1',
  warm: '#E65100',
  warmSoft: '#FFF3E0',
  font: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

function V4Tech() {
  return (
    <div style={{
      width: '100%', height: '100%', background: v4m.bg, color: v4m.ink,
      fontFamily: v4m.font, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{
        padding: '14px 22px 6px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', fontSize: 13, fontWeight: 600, fontFamily: v4m.mono,
      }}>
        <span>09:42</span>
        <span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11 }}>
          <span>5G</span>
          <span>•••</span>
          <span>87%</span>
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '8px 22px 14px' }}>
        {/* Logo strip */}
        <div style={{ paddingBottom: 12 }}>
          <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak"
            style={{ height: 22, display: 'block' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 99, background: v4m.primarySoft,
              color: v4m.primary, display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 700,
            }}>TS</div>
            <div>
              <div style={{ fontSize: 11, color: v4m.muted, lineHeight: 1 }}>Bom dia</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Tiago Silva</div>
            </div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 10, border: `1px solid ${v4m.line}`,
            background: v4m.panel, display: 'grid', placeItems: 'center', fontSize: 14,
          }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${v4m.ink}`,
                display: 'inline-block',
              }} />
              <span style={{
                position: 'absolute', top: -3, right: -3, width: 7, height: 7,
                borderRadius: 99, background: v4m.warm, border: `1.5px solid ${v4m.bg}`,
              }} />
            </span>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: v4m.muted }}>Sexta-feira, 1 maio</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginTop: 2 }}>Hoje</div>
          </div>
          <div style={{
            fontSize: 11, color: v4m.primary, background: v4m.primarySoft,
            padding: '4px 9px', borderRadius: 6, fontWeight: 700,
          }}>6 visitas</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Weather — primeira janela */}
        <V4mWeather />

        {/* Active job card */}
        <div style={{
          background: v4m.primary, color: '#fff', borderRadius: 16, padding: 16,
          boxShadow: '0 6px 18px rgba(76, 175, 80, 0.28)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.18)', padding: '3px 8px', borderRadius: 5,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 99, background: '#fff',
              }} />
              Em curso
            </div>
            <div style={{ fontSize: 11, fontFamily: v4m.mono, opacity: 0.85 }}>42m restantes</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Hillcrest #14 · Peralta Gardens</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, marginTop: 4 }}>
              Piscina · Tratamento de algas
            </div>
          </div>

          <div style={{
            marginTop: 14, height: 5, background: 'rgba(255,255,255,0.22)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{ width: '36%', height: '100%', background: '#fff', borderRadius: 99 }} />
          </div>
          <div style={{
            marginTop: 6, display: 'flex', justifyContent: 'space-between',
            fontSize: 10, fontFamily: v4m.mono, opacity: 0.85,
          }}>
            <span>36% completo</span>
            <span>3 de 7 passos</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={{
              flex: 1, border: 'none', background: '#fff', color: v4m.primaryDeep,
              fontSize: 12, fontWeight: 700, padding: '9px 0', borderRadius: 9,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>Continuar</button>
            <button style={{
              border: '1px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff',
              fontSize: 12, fontWeight: 600, padding: '9px 14px', borderRadius: 9,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>Pausar</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <V4mKpi label="Concluídas" value="2" />
          <V4mKpi label="Restantes" value="4" />
          <V4mKpi label="Faturação" value="€186" accent />
        </div>

        {/* Próximas */}
        <div style={{
          background: v4m.panel, border: `1px solid ${v4m.line}`, borderRadius: 14,
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '11px 14px', borderBottom: `1px solid ${v4m.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Próximas visitas</div>
            <div style={{ fontSize: 11, color: v4m.muted, fontFamily: v4m.mono }}>4 hoje</div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <V4mNext time="11:30" client="Quinta da Aldegalega" task="Jardim · Poda" tag="Em rota" tagColor={v4m.accent} tagBg={v4m.accentSoft} />
            <V4mNext time="13:00" client="Vista Pointe" task="Piscina · Equipamento" tag="Agend." tagColor={v4m.muted} tagBg={v4m.bg} />
            <V4mNext time="14:30" client="Família Coronado" task="Jardim · Adubação" tag="Agend." tagColor={v4m.muted} tagBg={v4m.bg} />
            <V4mNext time="16:00" client="Marina Heights" task="Piscina · Filtro" tag="Agend." tagColor={v4m.muted} tagBg={v4m.bg} last />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        background: v4m.panel, borderTop: `1px solid ${v4m.line}`,
        padding: '10px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
      }}>
        {[
          { l: 'Início', active: true },
          { l: 'Clientes' },
          { l: 'Agenda' },
          { l: 'Relatórios' },
          { l: 'Perfil' },
        ].map((t) => (
          <div key={t.l} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: t.active ? v4m.primary : v4m.muted, fontSize: 10, fontWeight: t.active ? 700 : 500,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: t.active ? v4m.primarySoft : 'transparent',
              border: t.active ? 'none' : `1.5px solid ${v4m.muted}`,
              opacity: t.active ? 1 : 0.55,
            }} />
            {t.l}
          </div>
        ))}
      </div>
    </div>
  );
}

function V4mWeather() {
  const hours = [
    { t: '11h', icon: '☀️', deg: 22, rain: 0 },
    { t: '13h', icon: '⛅', deg: 25, rain: 5 },
    { t: '15h', icon: '⛅', deg: 26, rain: 10 },
    { t: '17h', icon: '🌧', deg: 22, rain: 60, alert: true },
    { t: '19h', icon: '🌦', deg: 19, rain: 30 },
  ];
  return (
    <div style={{
      background: v4m.panel, border: `1px solid ${v4m.line}`, borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(135deg, #E0F2F1 0%, #E8F5E9 100%)',
      }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>☀️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: v4m.muted, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>Peralta · agora</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>20°</span>
            <span style={{ fontSize: 10, color: v4m.muted }}>sente-se 22°</span>
          </div>
          <div style={{ fontSize: 10, color: v4m.ink, marginTop: 1, fontWeight: 500 }}>Sol · NE 8 km/h</div>
        </div>
        <div style={{
          background: '#fff', borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 44,
        }}>
          <div style={{ fontSize: 8, color: v4m.muted, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>UV</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: v4m.warm }}>6</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${v4m.line}` }}>
        {hours.map((h, i) => (
          <div key={i} style={{
            padding: '7px 2px', textAlign: 'center',
            borderRight: i < hours.length - 1 ? `1px solid ${v4m.line}` : 'none',
            background: h.alert ? v4m.warmSoft : 'transparent',
          }}>
            <div style={{ fontSize: 9, color: v4m.muted, fontWeight: 600 }}>{h.t}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{h.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 1 }}>{h.deg}°</div>
            <div style={{
              fontSize: 8, fontWeight: 600,
              color: h.rain >= 50 ? v4m.warm : v4m.accent, opacity: h.rain === 0 ? 0.4 : 1,
            }}>{h.rain}%</div>
          </div>
        ))}
      </div>
      <div style={{
        padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7,
        borderTop: `1px solid ${v4m.line}`, background: v4m.warmSoft,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: v4m.warm }} />
        <span style={{ fontSize: 10, color: v4m.ink, flex: 1 }}>
          <strong style={{ fontWeight: 700 }}>Aguaceiro às 17h</strong> · Marina Heights pode ser adiada
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: v4m.warm }}>Ver →</span>
      </div>
    </div>
  );
}

function V4mKpi({ label, value, accent }) {
  return (
    <div style={{
      background: v4m.panel, border: `1px solid ${v4m.line}`, borderRadius: 11, padding: '10px 11px',
    }}>
      <div style={{ fontSize: 9, color: v4m.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 800, letterSpacing: -0.5, marginTop: 4,
        color: accent ? v4m.warm : v4m.ink,
      }}>{value}</div>
    </div>
  );
}

function V4mNext({ time, client, task, tag, tagColor, tagBg, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
      borderBottom: last ? 'none' : `1px solid ${v4m.line}`,
    }}>
      <div style={{ fontFamily: v4m.mono, fontSize: 11, color: v4m.muted, minWidth: 38 }}>{time}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client}</div>
        <div style={{ fontSize: 11, color: v4m.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task}</div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
        color: tagColor, background: tagBg,
      }}>{tag}</div>
    </div>
  );
}

window.V4Tech = V4Tech;
