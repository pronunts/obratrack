# ObraTrack — Ideas de Diseño

## Contexto de Uso
Ingenieros residentes en campo, bajo el sol, con pantallas brillantes, manos sucias, conectividad limitada.
Prioridades: legibilidad extrema, botones grandes, contraste alto, feedback claro.

---

<response>
<probability>0.07</probability>
<idea>

## Opción A — "Industrial Brutalist"

**Design Movement:** Brutalismo Digital Industrial
**Core Principles:**
1. Tipografía pesada y sin adornos — comunicación directa
2. Contraste máximo — legible bajo luz solar directa
3. Estructura de cuadrícula rígida — no hay ambigüedad
4. Color funcional — el amarillo de advertencia, el rojo de alerta, el verde de éxito

**Color Philosophy:**
- Fondo: Gris carbón oscuro (#1C1C1E) en modo oscuro, blanco roto (#F5F5F0) en modo claro
- Primario: Amarillo construcción (#F5A623) — evoca cascos, maquinaria
- Acento: Naranja seguridad (#E8520A)
- Éxito: Verde lima (#7CB518)
- Error: Rojo alarma (#D62828)

**Layout Paradigm:**
- Sidebar fija izquierda en desktop, bottom navigation en móvil
- Cards con bordes gruesos (2px) sin sombras — estilo blueprint
- Tablas densas con alternancia de filas

**Signature Elements:**
1. Líneas de corte diagonales en headers de sección
2. Badges de estado con forma de hexágono (referencia a tuercas/pernos)
3. Progress bars de tipo "termómetro" gruesas

**Interaction Philosophy:**
- Feedback táctil inmediato — sin animaciones largas
- Confirmaciones explícitas para acciones destructivas
- Modo "campo" con botones mínimo 56px de alto

**Animation:**
- Transiciones instantáneas (< 150ms) — sin lujos
- Indicadores de carga tipo "barra de progreso" lineal
- Shake animation para errores de validación

**Typography System:**
- Display: Space Grotesk Bold 700 — industrial, moderno
- Body: IBM Plex Mono — evoca planos técnicos
- Números: Tabular nums siempre

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

## Opción B — "Blueprint Engineering" ✅ SELECCIONADA

**Design Movement:** Ingeniería de Precisión — Blueprint Moderno
**Core Principles:**
1. Claridad técnica — cada dato tiene su lugar, sin ruido visual
2. Jerarquía de información — lo crítico siempre visible
3. Robustez visual — diseño que "aguanta" el uso intensivo en campo
4. Bilingüismo visual — USD y moneda local siempre diferenciados por color

**Color Philosophy:**
- Modo claro: Fondo blanco cálido (#FAFAF8), texto carbón (#1A1A2E)
- Modo oscuro: Fondo azul marino profundo (#0D1B2A), texto arena (#E8E0D0)
- Primario: Azul acero (#1565C0) — confianza, precisión técnica
- Acento: Naranja obra (#F57C00) — energía, acción, alerta
- Éxito: Verde verificado (#2E7D32)
- Peligro: Rojo desviación (#C62828)
- USD: Verde dólar (#1B5E20)
- Moneda local: Azul índigo (#283593)

**Layout Paradigm:**
- Bottom navigation en móvil (4 tabs principales)
- Sidebar colapsable en desktop
- Cards con sombra suave y borde izquierdo de color (indicador de estado)
- Tablas con sticky header para scroll largo

**Signature Elements:**
1. Borde izquierdo grueso (4px) en cards como indicador de estado/capítulo
2. Badge de "offline/online" siempre visible en header
3. Porcentaje de avance con anillo circular SVG

**Interaction Philosophy:**
- Botones mínimo 52px de alto en móvil
- Búsqueda con debounce rápido (200ms)
- Toast notifications en esquina inferior (no bloquean contenido)

**Animation:**
- Entrada de cards: fade + slide-up 200ms
- Transición de tabs: 150ms ease-out
- Progress bars: animación de llenado al cargar

**Typography System:**
- Display: Barlow Condensed SemiBold — compacto, técnico, legible
- Body: Inter 400/500 — máxima legibilidad en pantalla
- Monospace: JetBrains Mono — para códigos de partida y números

</idea>
</response>

<response>
<probability>0.05</probability>
<idea>

## Opción C — "Field Commander Dashboard"

**Design Movement:** Tactical Dark UI — Estilo HUD militar/aeronáutico
**Core Principles:**
1. Dark-first — reduce fatiga visual en campo
2. Datos como protagonistas — sin decoración superflua
3. Densidad informacional alta — máximo dato por cm²
4. Alertas visuales inmediatas — semáforos de desviación

**Color Philosophy:**
- Fondo: Negro verdoso (#0A0F0D) — evoca pantallas de radar
- Primario: Verde terminal (#00FF41) — estética hacker/técnica
- Acento: Ámbar (#FFB300)
- Texto: Blanco suave (#E8F5E9)

**Layout Paradigm:**
- Panel único con secciones colapsables
- Densidad máxima — tablas compactas
- Mapa de calor de desviaciones

**Signature Elements:**
1. Scanline effect sutil en headers
2. Números con font monospace grande
3. Alertas parpadeantes para desviaciones > 20%

**Interaction Philosophy:**
- Modo "glove-friendly" — targets de 64px mínimo
- Gestos de swipe para navegar entre módulos

**Animation:**
- Typewriter effect en títulos
- Números que "cuentan" al cargar
- Pulse animation en indicadores de alerta

**Typography System:**
- Display: Orbitron — futurista, técnico
- Body: Source Code Pro — todo monospace
- Números: Tabulares siempre

</idea>
</response>

---

## Decisión Final: Opción B — "Blueprint Engineering"

Razón: Equilibra profesionalismo técnico con usabilidad extrema en campo.
El azul acero transmite confianza institucional, el naranja obra da energía y urgencia.
La tipografía Barlow Condensed es compacta pero legible bajo el sol.
