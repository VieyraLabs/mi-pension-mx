/**
 * Catálogo de ocupaciones para derivar la clase de riesgo laboral (I–V) que
 * determina la prima de Riesgos de Trabajo de la Modalidad 10.
 *
 * FUENTE: la clasificación oficial vive en el Catálogo de Actividades para la
 * Clasificación de las Empresas en el Seguro de Riesgos de Trabajo (RACERF,
 * Reglamento de la Ley del Seguro Social en materia de Afiliación,
 * Clasificación de Empresas, Recaudación y Fiscalización). Ese catálogo llega
 * hasta el nivel de FRACCIÓN, que es donde se asigna la clase.
 *
 * MUESTRA PARCIAL — VERIFICAR: este catálogo reduce la clasificación a dos
 * niveles (División → Grupo) y asigna la clase PREDOMINANTE de cada grupo como
 * aproximación. No sustituye al RACERF: hay grupos con fracciones de distintas
 * clases. Antes de publicar la app hay que completarlo y contrastarlo contra el
 * RACERF vigente (ver docs/runbooks/05-actualizar-uma-y-constantes-legales.md).
 *
 * Solo lectura y función pura: aquí no hay UI ni estado.
 */
import type { RiskClass } from '../models';

export interface OccupationGroup {
  /** Código del grupo dentro de su división (cadena para permitir códigos con ceros a la izquierda). */
  code: string;
  name: string;
  /** Clase de riesgo PREDOMINANTE del grupo (aproximación de la fracción). */
  riskClass: RiskClass;
}

export interface OccupationDivision {
  /** Código de división (cadena para permitir códigos con ceros a la izquierda). */
  code: string;
  name: string;
  groups: OccupationGroup[];
}

/** Catálogo curado (muestra) de divisiones y grupos con su clase predominante. */
export const M10_OCCUPATION_CATALOG: readonly OccupationDivision[] = [
  {
    code: '1',
    name: 'Agricultura, ganadería y pesca',
    groups: [
      { code: '11', name: 'Agricultura', riskClass: 2 },
      { code: '12', name: 'Ganadería', riskClass: 2 },
      { code: '13', name: 'Pesca y acuicultura', riskClass: 3 },
    ],
  },
  {
    code: '2',
    name: 'Industrias extractivas (minería)',
    groups: [
      { code: '21', name: 'Extracción de minerales', riskClass: 5 },
      { code: '22', name: 'Extracción de petróleo y gas', riskClass: 5 },
    ],
  },
  {
    code: '3',
    name: 'Industrias de transformación',
    groups: [
      { code: '31', name: 'Alimentos y bebidas', riskClass: 2 },
      { code: '32', name: 'Textil y confección', riskClass: 3 },
      { code: '33', name: 'Madera, papel e imprenta', riskClass: 3 },
      { code: '34', name: 'Química, plástico y derivados', riskClass: 4 },
      { code: '35', name: 'Metalúrgica, maquinaria y equipo', riskClass: 4 },
    ],
  },
  {
    code: '4',
    name: 'Construcción',
    groups: [
      { code: '41', name: 'Edificación e infraestructura', riskClass: 5 },
    ],
  },
  {
    code: '5',
    name: 'Comercio',
    groups: [
      { code: '51', name: 'Comercio al por menor', riskClass: 1 },
      { code: '52', name: 'Comercio al por mayor', riskClass: 2 },
    ],
  },
  {
    code: '6',
    name: 'Transporte y comunicaciones',
    groups: [
      { code: '61', name: 'Transporte terrestre', riskClass: 3 },
      { code: '62', name: 'Transporte aéreo y marítimo', riskClass: 4 },
      { code: '63', name: 'Comunicaciones', riskClass: 1 },
    ],
  },
  {
    code: '7',
    name: 'Servicios',
    groups: [
      { code: '71', name: 'Servicios profesionales y técnicos', riskClass: 1 },
      { code: '72', name: 'Servicios personales y del hogar', riskClass: 1 },
      { code: '73', name: 'Educación', riskClass: 1 },
      { code: '74', name: 'Salud y asistencia social', riskClass: 2 },
      { code: '75', name: 'Restaurantes y hoteles', riskClass: 2 },
    ],
  },
];

/** Obtiene una división por su código. */
export function getOccupationDivision(code?: string): OccupationDivision | undefined {
  if (!code) return undefined;
  return M10_OCCUPATION_CATALOG.find((d) => d.code === code);
}

/** Obtiene un grupo por división y grupo. */
export function getOccupationGroup(
  divisionCode?: string,
  groupCode?: string,
): OccupationGroup | undefined {
  const division = getOccupationDivision(divisionCode);
  if (!division || !groupCode) return undefined;
  return division.groups.find((g) => g.code === groupCode);
}

/**
 * Deriva la clase de riesgo a partir de la división y el grupo seleccionados.
 * Devuelve `undefined` si la ocupación no está en el catálogo (o no se eligió).
 */
export function resolveRiskClass(
  divisionCode?: string,
  groupCode?: string,
): RiskClass | undefined {
  return getOccupationGroup(divisionCode, groupCode)?.riskClass;
}
