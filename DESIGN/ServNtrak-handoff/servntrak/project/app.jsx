/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, DCPostit */
/* global V1Tech, V1Dispatch, V2Tech, V2Dispatch, V3Tech, V3Dispatch, V4Tech, V4Dispatch */
/* global TechReal, DispReal, TechAgendaReal, DispAgendaReal, IOSDevice, AndroidDevice */

const TECH_W = 380;
const TECH_H = 760;
const DISP_W = 1200;
const DISP_H = 760;

function App() {
  return (
    <DesignCanvas>
      {/* Page header — ServNtrak logo, top-left */}
      <div style={{ padding: '40px 60px 24px', width: 'max-content' }}>
        <img
          src="assets/Logo_ServNtrak_H.png"
          alt="ServNtrak — Field Service Management"
          style={{ display: 'block', width: 396, height: 'auto' }}
        />
      </div>

      <DCSection
        id="intro"
        title="ServNtrak — FSM Dashboards"
        subtitle="Peralta Gardens · paired técnico (móvel) + despacho (web). Variation 00 uses the real design tokens from the repo, repaletted to the official ServNtrak logo colours (Verde #4CAF50 · Teal #009688 · Laranja #E65100 · Slate #263238). Variations 01–03 are alternative aesthetic directions for comparison."
      >
        <DCArtboard id="intro-cover" label="Cover" width={1200} height={420}>
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #4CAF50 0%, #357A38 50%, #009688 100%)',
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Inter', system-ui, sans-serif", color: '#fff',
            display: 'flex', alignItems: 'center', padding: '0 64px',
          }}>
            <div style={{ position: 'absolute', inset: 0,
              background: `radial-gradient(at 30% 20%, rgba(255,255,255,0.18) 0px, transparent 50%),
                           radial-gradient(at 80% 80%, rgba(230,81,0,0.30) 0px, transparent 50%),
                           radial-gradient(at 0% 100%, rgba(0,150,136,0.40) 0px, transparent 50%)` }} />
            <div style={{ position: 'relative', flex: 1, maxWidth: 640 }}>
              <div style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 99,
                padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: 0.4,
                textTransform: 'uppercase', backdropFilter: 'blur(8px)',
              }}>Field Service Management</div>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5,
                lineHeight: 1.05, marginTop: 18 }}>ServNtrak</div>
              <div style={{ fontSize: 22, opacity: 0.92, marginTop: 10, lineHeight: 1.35,
                fontWeight: 500, letterSpacing: -0.3 }}>
                Técnico móvel · Despacho web<br />
                <span style={{ opacity: 0.8, fontWeight: 400 }}>Peralta Gardens · 4 variações de design</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                {[
                  { c: '#4CAF50', l: 'Verde' },
                  { c: '#009688', l: 'Teal' },
                  { c: '#E65100', l: 'Laranja' },
                  { c: '#263238', l: 'Slate' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(0,0,0,0.18)', borderRadius: 6, padding: '5px 9px',
                    fontSize: 11, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: s.c,
                      border: '1px solid rgba(255,255,255,0.4)' }} />
                    {s.l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', width: 380, height: 320,
              background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
              <img src="assets/Logo_ServNtrak_H.png" alt="ServNtrak"
                style={{ width: '70%', height: 'auto', display: 'block',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v0"
        title="00 · Live design system (ServNtrakV2)"
        subtitle="Built from the actual repo, repintado com as cores do logotipo: Verde #4CAF50 (folha) primária · Teal #009688 (onda) accent · Laranja #E65100 (N) destaque · Slate #263238 texto. Inter, glass-cards, gradient mesh, BottomNav PT-PT (Início · Clientes · Agenda · Relatórios · Perfil)."
      >
        <DCArtboard id="v0-tech" label="Técnico · Início (mobile)" width={380} height={760}>
          <TechReal />
        </DCArtboard>
        <DCArtboard id="v0-disp" label="Despacho · Web" width={1200} height={760}>
          <DispReal />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v0-devices"
        title="00 · Em frame de dispositivo (iOS + Android)"
        subtitle="O mesmo design (TechReal) renderizado dentro de bezels reais para validar safe areas: iPhone 15 (402×874, notch + home indicator) e Pixel/Android (412×892, status bar + gesture bar). O conteúdo respeita os 47px do topo (status bar) e 34px do fundo (home indicator) no iOS, e 40px+24px no Android."
      >
        <DCArtboard id="v0-ios" label="iOS · iPhone 15" width={420} height={895}>
          <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
            <IOSDevice width={402} height={874}>
              <div style={{
                width: '100%', height: '100%',
                paddingTop: 47,        /* status bar safe area */
                paddingBottom: 34,     /* home indicator safe area */
                boxSizing: 'border-box',
                background: '#FAFAF7',
              }}>
                <TechReal />
              </div>
            </IOSDevice>
          </div>
        </DCArtboard>
        <DCArtboard id="v0-android" label="Android · Pixel" width={430} height={910}>
          <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
            <AndroidDevice width={412} height={892}>
              <div style={{
                width: '100%', height: '100%',
                paddingTop: 40,        /* status bar */
                paddingBottom: 24,     /* gesture nav bar */
                boxSizing: 'border-box',
                background: '#FAFAF7',
              }}>
                <TechReal />
              </div>
            </AndroidDevice>
          </div>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v0-agenda"
        title="00 · Agenda — Técnico (móvel) + Despacho (web)"
        subtitle="Ecrã de agenda em ambas vistas, mantendo a paleta oficial e a tipografia do V0. No móvel: timeline diária com hour rail, faixas verde (piscinas) e teal (jardins), card 'next' destacado com endereço e CTA Navegar, banner de aguaceiro herdado do tempo. Na web: swimlane técnicos × horas (07–18) com linha 'agora' a 09:42, KPIs do dia e tray 'Por atribuir' para drag-and-drop."
      >
        <DCArtboard id="v0-agenda-tech" label="Técnico · Agenda (mobile)" width={380} height={760}>
          <TechAgendaReal />
        </DCArtboard>
        <DCArtboard id="v0-agenda-disp" label="Despacho · Agenda (swimlane)" width={1200} height={760}>
          <DispAgendaReal />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v0b"
        title="00b · Clean SaaS + cores ServNtrak"
        subtitle="Layout do 01 · Clean SaaS adaptado às cores oficiais do logotipo ServNtrak: verde #4CAF50 (folha) como primária, teal #009688 (onda) como accent de dados, laranja #E65100 (N central) para faturação e ações de destaque, slate #263238 para texto. Inter, copy em PT-PT. Par técnico (mobile) + despacho (web)."
      >
        <DCArtboard id="v0b-tech" label="Técnico · Clean + Verde (mobile)" width={380} height={760}>
          <V4Tech />
        </DCArtboard>
        <DCArtboard id="v0b-disp" label="Despacho · Clean + Verde" width={1200} height={760}>
          <V4Dispatch />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v1"
        title="01 · Clean SaaS"
        subtitle="Linear / Notion vibe. Restrained, airy, trustworthy. Geist + Geist Mono. Trustworthy blue with green and orange data accents."
      >
        <DCArtboard id="v1-tech" label="Technician · iPhone" width={TECH_W} height={TECH_H}>
          <V1Tech />
        </DCArtboard>
        <DCArtboard id="v1-disp" label="Dispatcher · Web" width={DISP_W} height={DISP_H}>
          <V1Dispatch />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v2"
        title="02 · Operations Control Room"
        subtitle="Dark, data-rich, neon accents. Space Grotesk + Geist Mono. Live event stream, fleet map, dense KPI grid. For ops-heavy power users."
      >
        <DCArtboard id="v2-tech" label="Technician · iPhone" width={TECH_W} height={TECH_H}>
          <V2Tech />
        </DCArtboard>
        <DCArtboard id="v2-disp" label="Dispatcher · Web" width={DISP_W} height={DISP_H}>
          <V2Dispatch />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v3"
        title="03 · Friendly & Approachable"
        subtitle="Warm, consumer-grade polish. DM Sans + Instrument Serif. Sage green primary, soft photographic header, generous rounding. Feels like a product crews actually want to open."
      >
        <DCArtboard id="v3-tech" label="Technician · iPhone" width={TECH_W} height={TECH_H}>
          <V3Tech />
        </DCArtboard>
        <DCArtboard id="v3-disp" label="Dispatcher · Web" width={DISP_W} height={DISP_H}>
          <V3Dispatch />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
