// ============================================================
// ObraTrack — Landing.tsx
// Design: ObraTrack Industrial / Brand Orange + Industrial Navy
// ============================================================

import { motion } from 'framer-motion';
import { Link } from 'wouter';

// ─── Fade-up animation variant ──────────────────────────────
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut', delay },
  }),
};

export default function Landing() {
  return (
    <div className="min-h-screen font-inter text-on-surface bg-surface">

      {/* ── Header / TopNavBar ────────────────────────────────── */}
      <header className="bg-surface sticky top-0 z-50 border-b border-steel-border">
        <div className="flex justify-between items-center px-10 max-w-[1440px] mx-auto h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-black text-brand-orange uppercase tracking-tighter select-none">
              ⬡ ObraTrack
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <a className="text-brand-orange border-b-2 border-brand-orange pb-1 transition-all duration-150" href="#solutions">
              Soluciones
            </a>
            <a className="text-blueprint-gray hover:text-industrial-navy transition-colors" href="#specs">
              Especificaciones
            </a>
            <a className="text-blueprint-gray hover:text-industrial-navy transition-colors" href="#dashboard">
              Dashboard
            </a>
            <a className="text-blueprint-gray hover:text-industrial-navy transition-colors" href="#pricing">
              Precios
            </a>
          </nav>

          {/* CTA */}
          <Link href="/login">
            <button
              id="header-cta"
              className="bg-brand-orange text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 shadow-md transition-all"
            >
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </header>

      <main>

        {/* ── Hero Section ──────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-surface py-20 lg:py-32">
          {/* Decorative blob */}
          <div className="absolute -top-10 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-10 grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <motion.div
              className="z-10"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-industrial-navy leading-tight mb-6">
                Gestiona tu Proyecto con{' '}
                <span className="text-brand-orange">ObraTrack</span>
              </h1>
              <p className="text-lg text-blueprint-gray max-w-xl mb-10 leading-relaxed">
                La plataforma definitiva que conecta a ingenieros y arquitectos
                desde el primer plano hasta la entrega final. Precisión
                estructural y eficiencia operativa en una sola interfaz técnica.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <button
                    id="hero-cta-primary"
                    className="bg-brand-orange text-white px-8 py-4 rounded font-semibold text-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    Comenzar Prueba Gratis
                  </button>
                </Link>
                <button
                  id="hero-cta-demo"
                  className="border-2 border-industrial-navy text-industrial-navy px-8 py-4 rounded font-semibold text-lg hover:bg-industrial-navy hover:text-white transition-all"
                >
                  Ver Demo Técnica
                </button>
              </div>
            </motion.div>

            {/* Hero image / mock */}
            <motion.div
              className="relative"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.15}
            >
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
              {/* Dashboard mock-up card */}
              <div className="relative z-10 w-full rounded-xl border border-steel-border shadow-lg overflow-hidden bg-white">
                {/* Fake browser bar */}
                <div className="bg-industrial-navy px-5 py-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
                  <span className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
                  <span className="ml-4 text-white/40 text-xs font-mono">obratrack.app/dashboard</span>
                </div>
                {/* Dashboard content preview */}
                <div className="p-6 blueprint-grid">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-industrial-navy uppercase tracking-wider">
                      PROYECTO: METRO-LINE-4_A_2024
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                      EN CURSO
                    </span>
                  </div>
                  {/* Fake progress bars */}
                  <div className="space-y-3 mb-6">
                    {[
                      { label: 'Estructura', pct: '75%', w: 'w-3/4' },
                      { label: 'Instalaciones', pct: '52%', w: 'w-1/2' },
                      { label: 'Acabados', pct: '30%', w: 'w-[30%]' },
                    ].map(({ label, pct, w }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-blueprint-gray mb-1">
                          <span>{label}</span>
                          <span className="font-semibold">{pct}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded">
                          <div className={`h-2 ${w} bg-brand-orange rounded transition-all duration-700`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Eficiencia', value: '+12%', color: 'text-green-600' },
                      { label: 'Seguridad', value: 'Nivel A', color: 'text-industrial-navy' },
                      { label: 'Equipo', value: '24 act.', color: 'text-blue-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 border border-steel-border">
                        <div className="text-xs text-blueprint-gray font-semibold uppercase mb-1">{label}</div>
                        <div className={`text-lg font-black ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Social Proof ─────────────────────────────────────── */}
        <section className="bg-surface-container-low py-12 border-y border-steel-border">
          <div className="max-w-[1440px] mx-auto px-10 text-center">
            <h3 className="text-xs font-semibold text-blueprint-gray uppercase tracking-widest mb-8">
              CONFIADO POR LÍDERES GLOBALES EN INFRAESTRUCTURA
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {['ARC-ENG', 'STRUCT X', 'URBAN-PLAN', 'STEEL CORE', 'AXIS DESIGN'].map((brand) => (
                <span key={brand} className="text-xl font-black text-blueprint-gray tracking-tight">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Solutions Bento Grid ──────────────────────────────── */}
        <section id="solutions" className="py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-10">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl font-bold text-industrial-navy mb-4">
                Soluciones de Ingeniería Digital
              </h2>
              <div className="h-1 w-20 bg-brand-orange mx-auto" />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '⚙️',
                  title: 'Gestión de Proyectos',
                  desc: 'Control total de cronogramas, recursos y presupuestos con una granularidad técnica sin precedentes.',
                },
                {
                  icon: '🔗',
                  title: 'Colaboración en Tiempo Real',
                  desc: 'Sincronización instantánea entre el campo y la oficina. Planos actualizados al segundo para todo el equipo.',
                },
                {
                  icon: '📊',
                  title: 'Análisis Predictivo',
                  desc: 'Anticípese a los riesgos estructurales y retrasos logísticos mediante algoritmos de IA especializados en obra.',
                },
              ].map(({ icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-white p-8 border border-steel-border rounded-lg shadow-sm group hover:border-brand-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-orange-50 flex items-center justify-center rounded-lg mb-6 text-2xl">
                    {icon}
                  </div>
                  <h4 className="text-xl font-bold text-industrial-navy mb-3">{title}</h4>
                  <p className="text-sm text-blueprint-gray mb-6 leading-relaxed">{desc}</p>
                  <a
                    className="text-sm font-semibold text-brand-orange flex items-center gap-2 group-hover:gap-4 transition-all"
                    href="#"
                  >
                    Saber más →
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technical Specs ───────────────────────────────────── */}
        <section id="specs" className="py-24 bg-surface-container overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-10 grid lg:grid-cols-2 gap-20 items-center">
            {/* Feature list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl font-bold text-industrial-navy mb-8">
                Potenciando a los Profesionales Técnicos
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Normative Compliance',
                    desc: 'Validación automática de estándares ISO y normativas locales de construcción.',
                  },
                  {
                    title: 'BIM 360 Integration',
                    desc: 'Integración nativa bidireccional con modelos Revit y plataformas de diseño CAD.',
                  },
                  {
                    title: 'Data Security',
                    desc: 'Cifrado de grado militar para la propiedad intelectual de sus planos técnicos.',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <span className="text-green-600 mt-0.5 text-xl flex-shrink-0">✓</span>
                    <div>
                      <h5 className="text-sm font-bold text-industrial-navy tracking-wide">{title}</h5>
                      <p className="text-sm text-blueprint-gray mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stats widget */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.15}
              className="relative bg-white rounded-xl border border-steel-border p-8 shadow-lg blueprint-grid"
            >
              <div className="flex justify-between items-center mb-8 border-b border-steel-border pb-4">
                <span className="text-sm font-bold text-industrial-navy tracking-wide">
                  ESTADO DE INTEGRACIÓN
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                  ACTIVO
                </span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs text-blueprint-gray mb-1.5">
                    <span>Sincronización BIM</span><span>75%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded">
                    <div className="h-2 w-3/4 bg-brand-orange rounded" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-blueprint-gray mb-1.5">
                    <span>Cobertura Normativa</span><span>52%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded">
                    <div className="h-2 w-1/2 bg-brand-orange rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="h-24 bg-gray-50 rounded border border-steel-border p-4">
                    <span className="text-xs text-blueprint-gray font-semibold">Sync Rate</span>
                    <div className="text-3xl font-black text-industrial-navy mt-1">99.8%</div>
                  </div>
                  <div className="h-24 bg-gray-50 rounded border border-steel-border p-4">
                    <span className="text-xs text-blueprint-gray font-semibold">Latency</span>
                    <div className="text-3xl font-black text-industrial-navy mt-1">12ms</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Dashboard Preview ─────────────────────────────────── */}
        <section id="dashboard" className="py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white border border-steel-border rounded-xl shadow-lg overflow-hidden"
            >
              {/* Dark header bar */}
              <div className="bg-industrial-navy p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-white text-lg">📊</span>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                    PANEL DE CONTROL TÉCNICO
                  </h3>
                </div>
                <div className="text-white/50 text-xs font-mono">
                  PROYECTO: METRO-LINE-4_A_2024
                </div>
              </div>

              <div className="p-10 grid lg:grid-cols-12 gap-10">
                {/* Main chart area */}
                <div className="lg:col-span-8">
                  <div className="flex justify-between items-end mb-6">
                    <h4 className="text-base font-bold text-industrial-navy uppercase tracking-wide">
                      PROYECTO ACTUAL: DISTRITO FINANCIERO
                    </h4>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-brand-orange rounded-full" />
                      <div className="w-3 h-3 bg-blueprint-gray rounded-full" />
                    </div>
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg border border-steel-border flex items-center justify-center relative overflow-hidden blueprint-grid">
                    <div className="relative text-center">
                      <div className="text-6xl font-black text-industrial-navy">75%</div>
                      <div className="text-xs font-bold text-blueprint-gray uppercase tracking-widest mt-2">
                        PROGRESO DE ESTRUCTURA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {[
                    { label: 'EFICIENCIA', badge: '+12%', badgeColor: 'text-green-600', value: 'Optimizado' },
                    { label: 'SEGURIDAD', badge: 'Nivel A', badgeColor: 'text-green-600', value: 'Cero Incidentes' },
                    { label: 'EQUIPO', badge: '24 Activos', badgeColor: 'text-blue-600', value: 'Sincronizado' },
                  ].map(({ label, badge, badgeColor, value }) => (
                    <div key={label} className="p-6 bg-gray-50 rounded-lg border border-steel-border">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-blueprint-gray font-bold">{label}</span>
                        <span className={`${badgeColor} font-bold text-sm`}>{badge}</span>
                      </div>
                      <div className="text-2xl font-black text-industrial-navy">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="bg-brand-orange py-20">
          <div className="max-w-[1440px] mx-auto px-10 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-5xl font-bold text-white mb-6">
                ¿Listo para digitalizar tu obra?
              </h2>
              <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                Únase a más de 5,000 ingenieros que ya están optimizando sus
                entregas con precisión milimétrica.
              </p>
              <Link href="/login">
                <button
                  id="final-cta"
                  className="bg-white text-brand-orange px-12 py-5 rounded font-semibold text-xl hover:bg-industrial-navy hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Empezar Ahora
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-surface-container-low text-on-surface py-12 border-t border-steel-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-10 max-w-[1440px] mx-auto">
          {/* Brand */}
          <div className="col-span-1">
            <div className="text-xl font-black text-industrial-navy uppercase tracking-tighter mb-4">
              ObraTrack
            </div>
            <p className="text-sm text-blueprint-gray pr-8 leading-relaxed">
              Soluciones tecnológicas de alta fidelidad para el sector de la
              construcción e infraestructura civil.
            </p>
          </div>

          {/* Columns */}
          {[
            {
              heading: 'Producto',
              links: ['Soluciones', 'Precios', 'API Documentation'],
            },
            {
              heading: 'Compañía',
              links: ['About Us', 'Careers', 'Support'],
            },
            {
              heading: 'Legal',
              links: ['Privacy Policy', 'Security Compliance'],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h6 className="text-xs font-bold text-industrial-navy mb-6 uppercase tracking-wider">
                {heading}
              </h6>
              <ul className="space-y-4">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-blueprint-gray hover:text-brand-orange transition-colors underline underline-offset-2"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1440px] mx-auto px-10 mt-12 pt-8 border-t border-steel-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-blueprint-gray">
            © {new Date().getFullYear()} ObraTrack Systems. Precision Engineered
            for Structural Integrity.
          </p>
          <div className="flex gap-6">
            {['🌐', '🔗', '⌨'].map((icon, i) => (
              <span
                key={i}
                className="text-blueprint-gray cursor-pointer hover:text-brand-orange transition-colors text-lg"
              >
                {icon}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
