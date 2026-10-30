/**
 * Catálogo de ocupaciones para derivar la clase de riesgo laboral (I–V) que
 * determina la prima de Riesgos de Trabajo de la Modalidad 10.
 *
 * FUENTE: Catálogo de Actividades para la Clasificación de las Empresas en el
 * Seguro de Riesgos de Trabajo, del Reglamento de la Ley del Seguro Social en
 * materia de Afiliación, Clasificación de Empresas, Recaudación y Fiscalización
 * (RACERF, art. 196). La clasificación oficial llega hasta FRACCIÓN, que es
 * donde se asigna la clase. Para la captura se reduce a dos niveles
 * (División → Grupo) y se conserva la clase PREDOMINANTE de cada grupo.
 *
 * - Las 10 divisiones (códigos 0–9) y sus nombres siguen al RACERF.
 * - Los grupos con `sourceFraction` tienen la clase confirmada contra el
 *   Clasificador oficial del IMSS (serviciosdigitales.imss.gob.mx/clasificador/).
 * - Los grupos sin `sourceFraction` son una aproximación y deben verificarse
 *   contra la fracción que corresponda (docs/runbooks/05-actualizar-uma-y-constantes-legales.md).
 *
 * LIMITACIÓN DECLARADA: la clase real se asigna por FRACCIÓN; un mismo grupo
 * puede contener fracciones de distinta clase. Para el costo exacto hace falta
 * capturar la fracción, no solo división y grupo.
 *
 * Solo lectura y función pura: aquí no hay UI ni estado.
 */
import type { RiskClass } from '../models';

export interface OccupationGroup {
  /** Código del grupo dentro de su división (cadena para permitir ceros a la izquierda). */
  code: string;
  name: string;
  /** Clase de riesgo PREDOMINANTE del grupo (aproximación de la fracción). */
  riskClass: RiskClass;
  /** Fracción RACERF de la que se tomó la clase, cuando está confirmada. */
  sourceFraction?: string;
}

export interface OccupationDivision {
  /** Código de división (0–9, cadena para permitir ceros a la izquierda). */
  code: string;
  name: string;
  groups: OccupationGroup[];
}

/** Catálogo de 10 divisiones del RACERF con sus grupos y clase predominante. */
export const M10_OCCUPATION_CATALOG: readonly OccupationDivision[] = [
  {
    code: '0',
    name: 'Agricultura, ganadería, silvicultura, pesca y caza',
    groups: [
      { code: '01', name: 'Agricultura', riskClass: 3, sourceFraction: '011' },
      { code: '02', name: 'Ganadería', riskClass: 3, sourceFraction: '021' },
      { code: '03', name: 'Silvicultura', riskClass: 3 },
      { code: '04', name: 'Pesca y caza', riskClass: 4 },
    ],
  },
  {
    code: '1',
    name: 'Industrias extractivas',
    groups: [
      { code: '11', name: 'Minería', riskClass: 5 },
      { code: '12', name: 'Extracción de petróleo y gas', riskClass: 4, sourceFraction: '121' },
    ],
  },
  {
    code: '2',
    name: 'Industrias de transformación',
    groups: [
      { code: '21', name: 'Alimentos y bebidas', riskClass: 2 },
      { code: '22', name: 'Textil y confección', riskClass: 3 },
      { code: '23', name: 'Madera, papel e imprenta', riskClass: 3 },
      { code: '24', name: 'Química, plástico y derivados', riskClass: 4 },
      { code: '25', name: 'Metalúrgica, maquinaria y equipo', riskClass: 4 },
    ],
  },
  {
    code: '3',
    name: 'Industrias de transformación (continuación)',
    groups: [{ code: '31', name: 'Otras manufacturas', riskClass: 3 }],
  },
  {
    code: '4',
    name: 'Industria de la construcción',
    groups: [
      { code: '41', name: 'Edificación e infraestructura', riskClass: 5, sourceFraction: '412' },
    ],
  },
  {
    code: '5',
    name: 'Industria eléctrica y captación de agua',
    groups: [{ code: '51', name: 'Electricidad y agua', riskClass: 4 }],
  },
  {
    code: '6',
    name: 'Comercio',
    groups: [
      { code: '61', name: 'Comercio al por menor', riskClass: 2, sourceFraction: '611' },
      { code: '62', name: 'Comercio al por mayor', riskClass: 2 },
    ],
  },
  {
    code: '7',
    name: 'Transportes y comunicaciones',
    groups: [
      { code: '71', name: 'Transporte de carga', riskClass: 5, sourceFraction: '712' },
      { code: '72', name: 'Transporte de pasajeros', riskClass: 4, sourceFraction: '711' },
      { code: '73', name: 'Transporte ferroviario', riskClass: 5, sourceFraction: '713' },
      { code: '74', name: 'Comunicaciones', riskClass: 1 },
    ],
  },
  {
    code: '8',
    name: 'Servicios para empresas, personas y el hogar',
    groups: [
      { code: '81', name: 'Servicios profesionales y técnicos', riskClass: 1, sourceFraction: '841' },
      { code: '82', name: 'Servicios personales y del hogar', riskClass: 1 },
      { code: '83', name: 'Restaurantes y hoteles', riskClass: 2 },
    ],
  },
  {
    code: '9',
    name: 'Servicios sociales y comunales',
    groups: [
      { code: '91', name: 'Educación', riskClass: 1 },
      { code: '92', name: 'Salud y asistencia social', riskClass: 2 },
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
