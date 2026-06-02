// ============================================================
// ObraTrack — Parser MaPreX Inteligente v2
// Soporta: .csv (PapaParse) y .xlsx/.xls (SheetJS)
//
// REGLAS MAPRE X:
//   1. Las primeras N filas son metadatos → se ignoran
//   2. Las filas de datos comienzan con columna índice 0 vacía
//   3. Búsqueda dinámica de la fila de encabezados que contenga:
//      "Part No.", "Descripción", "Unidad", "Cantidad",
//      "Precio Unitario", "Total $"
//   4. A partir de esa fila, extraer partidas mapeando índices
//
// TAMBIÉN soporta el formato genérico con columnas:
//   Capítulo, Código, Descripción, Unidad, Cantidad,
//   Precio Unitario USD, Precio Total USD
// ============================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import type { ParseResult, PartidaPresupuesto } from './types';

// ── Encabezados MaPreX (exactos, case-insensitive, trim) ──
const MAPRE_X_HEADERS = {
  partNo:        ['part no.', 'part no', 'partno', 'item no.', 'item no', 'no.', 'no'],
  descripcion:   ['descripción', 'descripcion', 'description', 'desc'],
  unidad:        ['unidad', 'unit', 'und'],
  cantidad:      ['cantidad', 'quantity', 'qty', 'cant'],
  precioUnit:    ['precio unitario', 'precio unit.', 'precio unit', 'unit price', 'p. unitario', 'p.unitario', 'pu'],
  total:         ['total $', 'total$', 'total usd', 'total', 'precio total', 'precio total usd', 'pt'],
};

// ── Encabezados Genéricos ─────────────────────────────────
const GENERIC_HEADERS = {
  capitulo:    ['capítulo', 'capitulo', 'chapter', 'cap', 'cap.'],
  codigo:      ['código', 'codigo', 'code', 'cod', 'cod.', 'item'],
  descripcion: ['descripción', 'descripcion', 'description', 'desc'],
  unidad:      ['unidad', 'unit', 'und'],
  cantidad:    ['cantidad', 'quantity', 'qty', 'cant'],
  precioUnit:  ['precio unitario usd', 'precio unitario', 'unit price usd', 'unit price', 'p. unitario', 'pu'],
  total:       ['precio total usd', 'precio total', 'total usd', 'total $', 'total', 'pt'],
};

// ── Utilidades ────────────────────────────────────────────

function normalizeCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar tildes
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesAny(cell: string, candidates: string[]): boolean {
  const norm = normalizeForMatch(cell);
  return candidates.some(c => normalizeForMatch(c) === norm);
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const s = String(val).replace(/[$,\s]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ── Detección de Formato ──────────────────────────────────

interface HeaderDetection {
  formato: 'mapre x' | 'generico' | 'desconocido';
  filaIdx: number;       // índice de la fila de encabezados en la matriz
  colMap: Record<string, number>; // nombre_campo → índice de columna
}

/**
 * Busca dinámicamente la fila de encabezados en la matriz de datos.
 * Intenta primero formato MaPreX, luego genérico.
 */
function detectHeaders(rows: string[][]): HeaderDetection {
  const MAX_SCAN_ROWS = 20; // escanear hasta las primeras 20 filas

  // ── Intento 1: Formato MaPreX ──────────────────────────
  for (let i = 0; i < Math.min(rows.length, MAX_SCAN_ROWS); i++) {
    const row = rows[i];
    // Verificar que la fila tenga al menos "Descripción" y "Total $"
    const hasDesc = row.some(c => matchesAny(c, MAPRE_X_HEADERS.descripcion));
    const hasTotal = row.some(c => matchesAny(c, MAPRE_X_HEADERS.total));
    const hasPrecio = row.some(c => matchesAny(c, MAPRE_X_HEADERS.precioUnit));

    if (hasDesc && hasTotal && hasPrecio) {
      const colMap: Record<string, number> = {};
      row.forEach((cell, j) => {
        const norm = cell;
        if (matchesAny(norm, MAPRE_X_HEADERS.partNo))      colMap.partNo    = j;
        if (matchesAny(norm, MAPRE_X_HEADERS.descripcion)) colMap.descripcion = j;
        if (matchesAny(norm, MAPRE_X_HEADERS.unidad))      colMap.unidad    = j;
        if (matchesAny(norm, MAPRE_X_HEADERS.cantidad))    colMap.cantidad  = j;
        if (matchesAny(norm, MAPRE_X_HEADERS.precioUnit))  colMap.precioUnit = j;
        if (matchesAny(norm, MAPRE_X_HEADERS.total))       colMap.total     = j;
      });
      return { formato: 'mapre x', filaIdx: i, colMap };
    }
  }

  // ── Intento 2: Formato Genérico ────────────────────────
  for (let i = 0; i < Math.min(rows.length, MAX_SCAN_ROWS); i++) {
    const row = rows[i];
    const hasDesc = row.some(c => matchesAny(c, GENERIC_HEADERS.descripcion));
    const hasCant = row.some(c => matchesAny(c, GENERIC_HEADERS.cantidad));

    if (hasDesc && hasCant) {
      const colMap: Record<string, number> = {};
      row.forEach((cell, j) => {
        if (matchesAny(cell, GENERIC_HEADERS.capitulo))    colMap.capitulo  = j;
        if (matchesAny(cell, GENERIC_HEADERS.codigo))      colMap.codigo    = j;
        if (matchesAny(cell, GENERIC_HEADERS.descripcion)) colMap.descripcion = j;
        if (matchesAny(cell, GENERIC_HEADERS.unidad))      colMap.unidad    = j;
        if (matchesAny(cell, GENERIC_HEADERS.cantidad))    colMap.cantidad  = j;
        if (matchesAny(cell, GENERIC_HEADERS.precioUnit))  colMap.precioUnit = j;
        if (matchesAny(cell, GENERIC_HEADERS.total))       colMap.total     = j;
      });
      return { formato: 'generico', filaIdx: i, colMap };
    }
  }

  return { formato: 'desconocido', filaIdx: 0, colMap: {} };
}

// ── Extracción de Partidas ────────────────────────────────

/**
 * Extrae partidas de la matriz de datos a partir de la fila de encabezados.
 * Maneja la "columna fantasma" inicial de MaPreX (col[0] vacía).
 */
function extractPartidas(
  rows: string[][],
  detection: HeaderDetection,
  advertencias: string[]
): Omit<PartidaPresupuesto, 'proyectoId' | 'sincronizado'>[] {
  const partidas: Omit<PartidaPresupuesto, 'proyectoId' | 'sincronizado'>[] = [];
  const { colMap, formato } = detection;
  const dataRows = rows.slice(detection.filaIdx + 1);

  let capituloActual = 'Sin Capítulo';
  let filasOmitidas = 0;

  dataRows.forEach((row, idx) => {
    const rowNum = detection.filaIdx + 2 + idx; // número de fila real en el archivo

    // ── Regla MaPreX: filas de datos tienen col[0] vacía ──
    // Las filas de capítulo/sección tienen col[0] con texto → son encabezados de grupo
    if (formato === 'mapre x') {
      const col0 = normalizeCell(row[0]);
      if (col0 !== '') {
        // Es una fila de capítulo/sección, no una partida
        // Usar como capítulo actual si tiene contenido significativo
        const posibleCap = normalizeCell(row[colMap.descripcion ?? 1] ?? row[1] ?? col0);
        if (posibleCap && posibleCap.length > 2) {
          capituloActual = posibleCap;
        }
        return; // saltar esta fila
      }
    }

    // Extraer campos
    const get = (field: string): string => {
      const idx = colMap[field];
      return idx !== undefined ? normalizeCell(row[idx]) : '';
    };

    const descripcion = get('descripcion');

    // Omitir filas sin descripción o completamente vacías
    if (!descripcion || row.every(c => normalizeCell(c) === '')) {
      filasOmitidas++;
      return;
    }

    // Omitir filas que parecen subtotales o totales
    const descLower = descripcion.toLowerCase();
    if (
      descLower.startsWith('total') ||
      descLower.startsWith('subtotal') ||
      descLower === 'total general' ||
      descLower === 'gran total'
    ) {
      filasOmitidas++;
      return;
    }

    const cantidadPlaneada = parseNumber(get('cantidad'));
    const precioUnitarioUSD = parseNumber(get('precioUnit'));
    let precioTotalUSD = parseNumber(get('total'));

    // Calcular total si no está presente
    if (precioTotalUSD === 0 && cantidadPlaneada > 0 && precioUnitarioUSD > 0) {
      precioTotalUSD = cantidadPlaneada * precioUnitarioUSD;
    }

    // En formato genérico, usar columna de capítulo si existe
    if (formato === 'generico' && colMap.capitulo !== undefined) {
      const cap = get('capitulo');
      if (cap) capituloActual = cap;
    }

    // Código: Part No. en MaPreX, Código en genérico
    const codigo = formato === 'mapre x'
      ? (get('partNo') || `P-${rowNum}`)
      : (get('codigo') || `P-${rowNum}`);

    partidas.push({
      id: nanoid(),
      capitulo: capituloActual,
      codigo,
      descripcion,
      unidad: get('unidad') || 'glb',
      cantidadPlaneada,
      precioUnitarioUSD,
      precioTotalUSD,
    });
  });

  if (filasOmitidas > 0) {
    advertencias.push(`${filasOmitidas} filas omitidas (vacías, totales o encabezados de sección)`);
  }

  return partidas;
}

// ── Parser Principal ──────────────────────────────────────

/**
 * Parsea un archivo CSV usando PapaParse.
 * Maneja automáticamente el formato MaPreX y el formato genérico.
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      skipEmptyLines: false, // NO saltar vacías aquí; las manejamos nosotros
      complete: (results) => {
        const rows = (results.data as string[][]).map(row =>
          row.map(cell => normalizeCell(cell))
        );
        resolve(processRows(rows, file.name));
      },
      error: (err) => {
        resolve({
          partidas: [],
          errores: [`Error al leer el CSV: ${err.message}`],
          advertencias: [],
          totalFilas: 0,
          filasOk: 0,
          filasOmitidas: 0,
          meta: { formatoDetectado: 'desconocido', columnasDetectadas: [] },
        });
      },
    });
  });
}

/**
 * Parsea un archivo XLSX/XLS usando SheetJS.
 * Lee la primera hoja del libro.
 */
export async function parseXLSXFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Leer la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convertir a matriz de strings (incluyendo celdas vacías)
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
          raw: false, // convertir números a string para uniformidad
        }) as string[][];

        const rows = rawRows.map(row => row.map(cell => normalizeCell(cell)));
        resolve(processRows(rows, file.name));
      } catch (err) {
        resolve({
          partidas: [],
          errores: [`Error al leer el archivo Excel: ${String(err)}`],
          advertencias: [],
          totalFilas: 0,
          filasOk: 0,
          filasOmitidas: 0,
          meta: { formatoDetectado: 'desconocido', columnasDetectadas: [] },
        });
      }
    };
    reader.onerror = () => {
      resolve({
        partidas: [],
        errores: ['Error al leer el archivo'],
        advertencias: [],
        totalFilas: 0,
        filasOk: 0,
        filasOmitidas: 0,
        meta: { formatoDetectado: 'desconocido', columnasDetectadas: [] },
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Dispatcher: elige el parser correcto según la extensión del archivo.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx' || ext === 'xls') {
    return parseXLSXFile(file);
  }
  return parseCSVFile(file);
}

/**
 * Lógica central de procesamiento de la matriz de filas.
 * Compartida entre CSV y XLSX.
 */
function processRows(rows: string[][], fileName: string): ParseResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  if (rows.length === 0) {
    return {
      partidas: [],
      errores: ['El archivo está vacío.'],
      advertencias: [],
      totalFilas: 0,
      filasOk: 0,
      filasOmitidas: 0,
      meta: { formatoDetectado: 'desconocido', columnasDetectadas: [] },
    };
  }

  // Detectar formato y fila de encabezados
  const detection = detectHeaders(rows);

  if (detection.formato === 'desconocido') {
    errores.push(
      `No se encontraron encabezados reconocibles en "${fileName}". ` +
      `Se buscaron: "Part No.", "Descripción", "Cantidad", "Total $" (MaPreX) ` +
      `o "Descripción", "Cantidad", "Precio Unitario" (formato genérico). ` +
      `Encabezados encontrados en fila 1: ${rows[0]?.filter(c => c).join(', ') || '(vacío)'}`
    );
    return {
      partidas: [],
      errores,
      advertencias,
      totalFilas: rows.length,
      filasOk: 0,
      filasOmitidas: rows.length,
      meta: {
        formatoDetectado: 'desconocido',
        columnasDetectadas: rows[0]?.filter(c => c) ?? [],
      },
    };
  }

  advertencias.push(
    `Formato detectado: ${detection.formato === 'mapre x' ? 'MaPreX' : 'Genérico'} ` +
    `(encabezados en fila ${detection.filaIdx + 1})`
  );

  const partidas = extractPartidas(rows, detection, advertencias);
  const filasOmitidas = rows.length - detection.filaIdx - 1 - partidas.length;

  if (partidas.length === 0) {
    errores.push(
      'No se encontraron partidas válidas después de los encabezados. ' +
      'Verifica que las filas de datos tengan Descripción y valores numéricos.'
    );
  }

  return {
    partidas,
    errores,
    advertencias,
    totalFilas: rows.length - detection.filaIdx - 1,
    filasOk: partidas.length,
    filasOmitidas: Math.max(0, filasOmitidas),
    meta: {
      formatoDetectado: detection.formato,
      filaEncabezadoEncontrada: detection.filaIdx + 1,
      columnasDetectadas: Object.keys(detection.colMap),
    },
  };
}

// ── CSV de Ejemplo ────────────────────────────────────────

/** Genera un CSV de ejemplo en formato MaPreX para descarga */
export function generateSampleCSVMapreX(): string {
  const lines = [
    // Metadatos (6 filas que el parser ignora)
    'PRESUPUESTO DE OBRA,,,,,',
    'Proyecto: Construcción Puente Km 45,,,,,',
    'Fecha: 2026-02-20,,,,,',
    'Elaborado por: Ing. Residente,,,,,',
    'Moneda: USD,,,,,',
    ',,,,,',
    // Fila de encabezados MaPreX (col[0] vacía = columna fantasma)
    ',Part No.,Descripción,Unidad,Cantidad,Precio Unitario,Total $',
    // Fila de capítulo (col[0] con texto → el parser la usa como capítulo)
    '01,01,01 - MOVIMIENTO DE TIERRAS,,,,',
    // Partidas (col[0] vacía)
    ',01.01,Excavación manual en material suelto,m3,250,8.50,2125.00',
    ',01.02,Relleno y compactación con material propio,m3,180,6.20,1116.00',
    ',01.03,Transporte de material excedente,m3,70,12.00,840.00',
    '02,02,02 - OBRAS DE CONCRETO,,,,',
    ',02.01,Concreto f\'c=210 kg/cm² para cimentación,m3,45,185.00,8325.00',
    ',02.02,Acero de refuerzo fy=4200 kg/cm²,kg,1200,1.85,2220.00',
    ',02.03,Encofrado y desencofrado de muros,m2,120,22.50,2700.00',
    '03,03,03 - MUROS DE GAVIONES,,,,',
    ',03.01,Gavión tipo caja 2x1x1m,und,80,95.00,7600.00',
    ',03.02,Relleno de gaviones con piedra,m3,160,18.00,2880.00',
    '04,04,04 - DRENAJE,,,,',
    ',04.01,Tubería PVC 200mm para alcantarilla,ml,60,35.00,2100.00',
    ',04.02,Caja de revisión 60x60cm,und,8,280.00,2240.00',
    // Fila de total (el parser la omite automáticamente)
    ',,,,,Total General,34146.00',
  ];
  return lines.join('\n');
}

/** Genera un CSV de ejemplo en formato genérico para descarga */
export function generateSampleCSVGenerico(): string {
  const headers = ['Capítulo', 'Código', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unitario USD', 'Precio Total USD'];
  const rows = [
    ['01 - Movimiento de Tierras', '01.01', 'Excavación manual en material suelto', 'm3', '250', '8.50', '2125.00'],
    ['01 - Movimiento de Tierras', '01.02', 'Relleno y compactación con material propio', 'm3', '180', '6.20', '1116.00'],
    ['02 - Obras de Concreto', '02.01', "Concreto f'c=210 kg/cm² para cimentación", 'm3', '45', '185.00', '8325.00'],
    ['02 - Obras de Concreto', '02.02', 'Acero de refuerzo fy=4200 kg/cm²', 'kg', '1200', '1.85', '2220.00'],
    ['03 - Muros de Gaviones', '03.01', 'Gavión tipo caja 2x1x1m', 'und', '80', '95.00', '7600.00'],
    ['03 - Muros de Gaviones', '03.02', 'Relleno de gaviones con piedra', 'm3', '160', '18.00', '2880.00'],
    ['04 - Drenaje', '04.01', 'Tubería PVC 200mm para alcantarilla', 'ml', '60', '35.00', '2100.00'],
    ['04 - Drenaje', '04.02', 'Caja de revisión 60x60cm', 'und', '8', '280.00', '2240.00'],
  ];
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Alias para compatibilidad con código existente
export const generateSampleCSV = generateSampleCSVGenerico;
// Alias para compatibilidad
export const parseCSV = (content: string): ParseResult => {
  const rows = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.split(',').map(c => normalizeCell(c)));
  return processRows(rows, 'archivo.csv');
};
