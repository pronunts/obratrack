// ============================================================
// ObraTrack — Landing.tsx v2 (Visual Overhaul)
// ============================================================

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';

const fadeUp: any = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn: any = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay },
  }),
};

// ── Contador animado ─────────────────────────────────────
function AnimatedCounter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) { setValue(to); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, to]);

  return (
    <span ref={ref}>{prefix}{value.toLocaleString('es')}{suffix}</span>
  );
}

// ── Iconos SVG inline ────────────────────────────────────
const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconSync = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);
const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function Landing() {
  return (
    <div className="min-h-screen font-inter text-on-surface bg-white overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="flex justify-between items-center px-6 lg:px-10 max-w-[1440px] mx-auto h-18 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">OT</span>
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">ObraTrack</span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            {['Soluciones', 'Precios', 'Dashboard'].map((item) => (
              <a key={item} className="text-slate-500 hover:text-slate-900 transition-colors" href={`#${item.toLowerCase()}`}>
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-4 py-2">
                Iniciar sesión
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 active:scale-95 shadow-sm transition-all">
                Empezar gratis
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 blueprint-grid opacity-30 pointer-events-none" />
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
            {/* Texto */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                PLATAFORMA DE GESTIÓN DE OBRAS CIVILES
              </div>

              <h1 className="text-5xl lg:text-[3.75rem] font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Controlá tu obra<br />
                desde cualquier{' '}
                <span className="text-orange-500 relative">
                  dispositivo
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                    <path d="M0 5 Q100 0 200 5" stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
                Importá tu presupuesto en CSV o Excel, registrá el avance desde el campo y accedé a los mismos datos desde la obra, la oficina o el teléfono.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/login">
                  <button className="bg-orange-500 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
                    Comenzar ahora — es gratis
                    <IconArrow />
                  </button>
                </Link>
                <a href="#dashboard">
                  <button className="border border-slate-200 bg-white text-slate-700 px-8 py-3.5 rounded-lg font-semibold text-base hover:border-slate-300 hover:bg-slate-50 transition-all">
                    Ver demo
                  </button>
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-5 text-sm text-slate-500">
                {['Sin tarjeta de crédito', 'Funciona sin conexión', 'Datos en la nube'].map(item => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="text-green-500"><IconCheck /></span>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* App mockup — tabla de presupuesto */}
            <motion.div
              className="relative"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.18}
            >
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden bg-white">
                {/* Browser chrome */}
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-md px-3 py-1 text-slate-400 text-xs font-mono">
                    obratrack.app/presupuesto
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Sincronizado" />
                </div>

                {/* Toolbar */}
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">PROYECTO: TORRE RESIDENCIAL B-4</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">EN CURSO</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Sincronizado
                  </div>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr] bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 border-b border-slate-200">
                  <span>Partida</span><span className="text-right">Cant.</span><span className="text-right">P.Unit</span><span className="text-right">Total USD</span>
                </div>

                {/* Table rows */}
                {[
                  { cap: '01', code: '01.01', desc: 'Excavación manual', und: 'm³', qty: '145', pu: '$42', total: '$6,090', pct: 78, color: 'bg-green-500' },
                  { cap: '01', code: '01.02', desc: 'Relleno compactado', und: 'm³', qty: '80', pu: '$28', total: '$2,240', pct: 52, color: 'bg-orange-500' },
                  { cap: '02', code: '02.01', desc: 'Cimentación corrida', und: 'm²', qty: '210', pu: '$115', total: '$24,150', pct: 91, color: 'bg-green-500' },
                  { cap: '02', code: '02.02', desc: 'Columnas de H°A°', und: 'ml', qty: '320', pu: '$88', total: '$28,160', pct: 34, color: 'bg-red-500' },
                  { cap: '03', code: '03.01', desc: 'Encofrado de losa', und: 'm²', qty: '180', pu: '$65', total: '$11,700', pct: 0, color: 'bg-slate-300' },
                ].map(({ code, desc, qty, pu, total, pct, color }, i) => (
                  <motion.div
                    key={code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="grid grid-cols-[2fr_1fr_1fr_1.2fr] items-center px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div>
                      <div className="text-xs text-slate-400 font-mono mb-0.5">{code}</div>
                      <div className="text-sm font-medium text-slate-700 truncate">{desc}</div>
                      <div className="mt-1 h-1.5 w-24 bg-slate-100 rounded-full">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-600">{qty}</div>
                    <div className="text-right text-sm text-slate-600">{pu}</div>
                    <div className="text-right text-sm font-bold text-slate-800">{total}</div>
                  </motion.div>
                ))}

                {/* Footer summary */}
                <div className="bg-slate-800 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono">5 partidas · Capítulos 01–03</span>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">TOTAL PRESUPUESTADO</div>
                    <div className="text-lg font-black text-white">$72,340 USD</div>
                  </div>
                </div>
              </div>

              {/* Floating sync badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                className="absolute -bottom-5 -left-6 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 z-20"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <IconSync />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Sync completado</div>
                  <div className="text-xs text-slate-400">Móvil · Escritorio · Tablet</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats band ────────────────────────────────────────── */}
        <section className="bg-slate-900 py-14">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-slate-700">
              {[
                { value: 5200, suffix: '+', label: 'Proyectos gestionados', prefix: '' },
                { value: 2400, suffix: 'M', label: 'USD en presupuestos', prefix: '$' },
                { value: 99, suffix: '.1%', label: 'Uptime garantizado', prefix: '' },
                { value: 40, suffix: '%', label: 'Menos tiempo en reportes', prefix: '' },
              ].map(({ value, suffix, label, prefix }, i) => (
                <motion.div
                  key={label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="text-center md:px-8"
                >
                  <div className="text-3xl lg:text-4xl font-black text-white mb-1">
                    <AnimatedCounter to={value} suffix={suffix} prefix={prefix} />
                  </div>
                  <div className="text-sm text-slate-400 font-medium">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="soluciones" className="py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <motion.div
              className="text-center mb-16"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <div className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em] mb-3">FUNCIONALIDADES</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Todo lo que necesitás para gestionar una obra
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Desde la importación del presupuesto hasta el seguimiento diario en campo, en una sola plataforma.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <IconUpload />,
                  title: 'Importá CSV y Excel',
                  desc: 'Subí tu presupuesto en el formato que ya usás. Detectamos automáticamente columnas, capítulos y códigos.',
                  color: 'bg-orange-50 text-orange-600',
                  visual: (
                    <div className="mt-4 border-2 border-dashed border-orange-200 rounded-xl p-4 text-center bg-orange-50/50">
                      <div className="text-orange-400 text-2xl mb-2">📄</div>
                      <div className="text-xs text-orange-600 font-semibold">presupuesto.xlsx</div>
                      <div className="text-xs text-orange-400 mt-1">CSV · Excel · MaPreX</div>
                    </div>
                  ),
                },
                {
                  icon: <IconSync />,
                  title: 'Sync cross-device',
                  desc: 'Los datos se guardan en la nube automáticamente. Accedé desde el teléfono, tablet o computadora.',
                  color: 'bg-blue-50 text-blue-600',
                  visual: (
                    <div className="mt-4 flex justify-center gap-3 items-center">
                      {['💻', '📱', '🖥️'].map((icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-lg">{icon}</div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        </div>
                      ))}
                      <div className="text-blue-300 text-xs font-mono">↔ sync</div>
                    </div>
                  ),
                },
                {
                  icon: <IconChart />,
                  title: 'Avance en tiempo real',
                  desc: 'Registrá cuánto ejecutaste por partida, con fecha y observaciones. El porcentaje se actualiza al instante.',
                  color: 'bg-green-50 text-green-600',
                  visual: (
                    <div className="mt-4 space-y-2">
                      {[{ label: 'Estructura', pct: 75 }, { label: 'Instalaciones', pct: 52 }, { label: 'Acabados', pct: 28 }].map(({ label, pct }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{label}</span><span className="font-semibold">{pct}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  icon: <IconShield />,
                  title: 'Control de gastos',
                  desc: 'Registrá cada gasto diario por partida y categoría. Compará presupuestado vs. ejecutado en USD o moneda local.',
                  color: 'bg-purple-50 text-purple-600',
                  visual: (
                    <div className="mt-4 space-y-2">
                      {[
                        { label: 'Materiales', pct: 68, color: 'bg-purple-500' },
                        { label: 'Mano de obra', pct: 45, color: 'bg-pink-500' },
                        { label: 'Equipos', pct: 30, color: 'bg-indigo-400' },
                      ].map(({ label, pct, color }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color.replace('bg-', '') }} />
                          <span className="text-xs text-slate-500 flex-1">{label}</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-8 text-right">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ].map(({ icon, title, desc, color, visual }, i) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.09}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>{icon}</div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  {visual}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ─────────────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <motion.div
              className="text-center mb-16"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <div className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em] mb-3">CÓMO FUNCIONA</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">En 3 pasos estás operativo</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 z-0" />

              {[
                {
                  step: '01',
                  title: 'Subí tu presupuesto',
                  desc: 'Arrastrá tu archivo CSV o Excel. ObraTrack detecta automáticamente el formato y organiza las partidas por capítulo.',
                  icon: '📂',
                  detail: 'Compatible con MaPreX, PRESWIN y formatos genéricos.',
                },
                {
                  step: '02',
                  title: 'Registrá el avance',
                  desc: 'Desde la obra, con el teléfono, indicá cuánto ejecutaste por partida. Los datos se sincronizan en tiempo real.',
                  icon: '📲',
                  detail: 'Funciona offline. Se sincroniza automáticamente al recuperar señal.',
                },
                {
                  step: '03',
                  title: 'Analizá y reportá',
                  desc: 'Mirá el avance de cada partida, los gastos vs. presupuesto y detectá desvíos antes de que sean un problema.',
                  icon: '📊',
                  detail: 'Dashboard en tiempo real con alertas de desvío.',
                },
              ].map(({ step, title, desc, icon, detail }, i) => (
                <motion.div
                  key={step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.12}
                  className="relative z-10 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/25">
                      {icon}
                    </div>
                    <span className="text-5xl font-black text-slate-100 select-none">{step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
                  <div className="text-xs text-orange-600 font-medium bg-orange-50 rounded-lg px-3 py-2">
                    {detail}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard preview ─────────────────────────────────── */}
        <section id="dashboard" className="py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <motion.div
              className="text-center mb-12"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <div className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em] mb-3">PANEL DE CONTROL</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Todo el proyecto, en una sola pantalla
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/8 overflow-hidden"
            >
              {/* Nav bar oscura */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-black text-xs">OT</span>
                  </div>
                  <span className="text-white font-semibold text-sm">ObraTrack</span>
                  <span className="text-slate-500 text-sm">/ Torre Residencial B-4</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">AVANCE GLOBAL</span>
                  <span className="text-white font-black text-lg">57%</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-md">EN CURSO</span>
                </div>
              </div>

              <div className="p-8 bg-slate-50 grid lg:grid-cols-12 gap-6">
                {/* KPI Cards */}
                <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Presupuesto Total', value: '$72,340', sub: 'USD', color: 'text-slate-900', bg: 'bg-white' },
                    { label: 'Gasto Real', value: '$41,280', sub: 'ejecutado', color: 'text-slate-900', bg: 'bg-white' },
                    { label: 'Desvío', value: '+$820', sub: '1.2% sobre presup.', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Días restantes', value: '47', sub: 'hasta entrega', color: 'text-blue-700', bg: 'bg-blue-50' },
                  ].map(({ label, value, sub, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl border border-slate-200 p-4`}>
                      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
                      <div className={`text-2xl font-black ${color}`}>{value}</div>
                      <div className="text-xs text-slate-400 mt-1">{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Progreso por capítulo */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">AVANCE POR CAPÍTULO</h4>
                    <span className="text-xs text-slate-400">Actualizado hace 2 min</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { cap: 'CAP 01 — Movimiento de suelos', pct: 92, color: 'bg-green-500', gasto: '$8,330', presup: '$8,330' },
                      { cap: 'CAP 02 — Estructuras de H°A°', pct: 71, color: 'bg-orange-500', gasto: '$37,240', presup: '$52,450' },
                      { cap: 'CAP 03 — Instalaciones', pct: 28, color: 'bg-blue-500', gasto: '$4,120', presup: '$11,560' },
                    ].map(({ cap, pct, color, gasto, presup }) => (
                      <div key={cap} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                            <span>{cap}</span><span>{pct}%</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-3 ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right w-28 text-xs text-slate-500">
                          <div className="font-semibold text-slate-700">{gasto}</div>
                          <div>de {presup}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel lateral */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-3">ÚLTIMA ACTIVIDAD</div>
                    <div className="space-y-3">
                      {[
                        { who: 'Javier R.', action: 'Registró 15m³ de excavación', time: 'hace 1h', dot: 'bg-green-500' },
                        { who: 'Marcelo P.', action: 'Cargó gasto: Acero $2,450', time: 'hace 3h', dot: 'bg-orange-500' },
                        { who: 'Ana G.', action: 'Actualizó avance encofrado', time: 'ayer', dot: 'bg-blue-500' },
                      ].map(({ who, action, time, dot }) => (
                        <div key={who} className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${dot} mt-1.5 flex-shrink-0`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-700">{who}</div>
                            <div className="text-xs text-slate-500">{action}</div>
                            <div className="text-xs text-slate-400">{time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
                    <div className="text-xs font-bold text-orange-600 uppercase mb-2">ALERTA DE DESVÍO</div>
                    <div className="text-sm text-orange-800 font-medium">CAP 02 · Columnas de H°A°</div>
                    <div className="text-xs text-orange-600 mt-1">Gasto real supera presupuesto en 8.2%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Social proof / Testimonial ────────────────────────── */}
        <section className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="flex justify-center mb-6">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-orange-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl font-medium text-slate-700 leading-relaxed mb-8">
                "Con ObraTrack podemos ver en tiempo real el avance de cada partida desde la oficina central. Antes llamábamos al capataz tres veces por día para saber dónde estábamos."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">RV</div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-800">Roberto Valenzuela</div>
                  <div className="text-xs text-slate-500">Jefe de Obras · Constructora Delta</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-900 py-24">
          <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="text-xs font-bold text-orange-400 uppercase tracking-[0.2em] mb-4">EMPEZÁ HOY</div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                ¿Listo para digitalizar<br />tu obra?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Creá tu cuenta en segundos, importá tu primer presupuesto y tenelo disponible en todos tus dispositivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <button className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 active:scale-95 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 justify-center">
                    Empezar gratis ahora
                    <IconArrow />
                  </button>
                </Link>
                <a href="mailto:hola@obratrack.app">
                  <button className="border border-slate-600 text-slate-300 px-10 py-4 rounded-xl font-semibold text-lg hover:border-slate-400 hover:text-white transition-all">
                    Hablar con el equipo
                  </button>
                </a>
              </div>
              <p className="text-slate-600 text-sm mt-6">Sin tarjeta de crédito · Cancelá cuando quieras</p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-6 lg:px-10 max-w-[1440px] mx-auto">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white font-black text-xs">OT</span>
              </div>
              <span className="text-white font-bold text-base">ObraTrack</span>
            </div>
            <p className="text-sm leading-relaxed">
              Plataforma de gestión para obras civiles e ingeniería. Control total desde el terreno.
            </p>
          </div>

          {[
            { heading: 'Producto', links: ['Funcionalidades', 'Precios', 'Changelog'] },
            { heading: 'Empresa', links: ['Nosotros', 'Contacto', 'Blog'] },
            { heading: 'Legal', links: ['Privacidad', 'Términos', 'Seguridad'] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h6 className="text-xs font-bold text-slate-300 mb-5 uppercase tracking-wider">{heading}</h6>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 mt-10 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ObraTrack. Construido para profesionales de la construcción.
          </p>
          <p className="text-xs text-slate-700">PWA · Offline-first · Cross-device sync</p>
        </div>
      </footer>
    </div>
  );
}
