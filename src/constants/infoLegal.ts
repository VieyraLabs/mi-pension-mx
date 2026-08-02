/**
 * Textos educativos e informativos sobre la Ley del Seguro Social 1973.
 * Utilizados en la sección de información y preguntas frecuentes.
 */

export interface SeccionInfo {
  id: string;
  titulo: string;
  contenido: string[];
  fuente?: string;
}

/**
 * Texto canónico del aviso de estimación/disclaimer legal.
 * Única fuente de verdad — antes había 7+ variantes redactadas de forma
 * distinta (mayúsculas, emoji y frase final inconsistentes) repetidas en
 * cada pantalla y en el PDF exportado.
 */
export const AVISO_ESTIMACION =
  'ESTIMACIÓN — Resultado con fines informativos. La resolución oficial de tu pensión corresponde exclusivamente al IMSS.';

/** Versión corta para chips/etiquetas. */
export const AVISO_ESTIMACION_CORTO = 'Solo estimaciones — resolución oficial por IMSS';

export const INFO_LEY73: readonly SeccionInfo[] = [
  {
    id: 'que_es_ley73',
    titulo: '¿Qué es la Ley 73?',
    contenido: [
      'La Ley del Seguro Social de 1973 (conocida como "Ley 73") fue publicada en el Diario Oficial de la Federación el 12 de marzo de 1973 y estuvo vigente hasta el 30 de junio de 1997.',
      'A partir del 1° de julio de 1997 entró en vigor una nueva Ley del Seguro Social (Ley 97), que introdujo el sistema de cuentas individuales (AFORE).',
      'Sin embargo, los trabajadores que comenzaron a cotizar ANTES del 1° de julio de 1997 tienen derecho a elegir entre el esquema de la Ley 73 o el de la Ley 97 al momento de pensionarse, eligiendo el que más les convenga.',
    ],
    fuente: 'Ley del Seguro Social 1973, DOF 12-mar-1973; Décimo Cuarto Transitorio LSS 1997',
  },
  {
    id: 'quien_puede_pensionarse',
    titulo: '¿Quién puede pensionarse bajo la Ley 73?',
    contenido: [
      'Puedes pensionarte bajo la Ley 73 si iniciaste tu vida laboral cotizando al IMSS ANTES del 1° de julio de 1997.',
      'Para la pensión de Vejez (Art. 145 LSS 1973): necesitas mínimo 500 semanas cotizadas y haber cumplido 65 años.',
      'Para la pensión de Cesantía en Edad Avanzada (Art. 138 LSS 1973): necesitas mínimo 500 semanas cotizadas y haber cumplido 60 años, con reducción del beneficio hasta los 65 años.',
      'No es necesario haber cotizado de forma continua; lo que importa es el total de semanas acumuladas.',
    ],
    fuente: 'Arts. 138, 145, 150 LSS 1973',
  },
  {
    id: 'que_es_modalidad40',
    titulo: '¿Qué es la Modalidad 40?',
    contenido: [
      'La Modalidad 40 (Art. 218 del Reglamento LSS) permite que un trabajador que dejó de cotizar obligatoriamente al IMSS continúe haciéndolo de forma voluntaria, incluso con un Salario Base de Cotización (SBC) mayor al último registrado.',
      'Su objetivo principal es incrementar el promedio salarial de las últimas 250 semanas, que es la base para calcular la cuantía de la pensión.',
      'Para inscribirse, el trabajador no debe tener relación laboral activa y debe haber cotizado al menos 52 semanas en el régimen obligatorio.',
      'El SBC de Modalidad 40 puede ser hasta 25 veces el valor de la UMA diaria.',
      'IMPORTANTE: La conveniencia de la Modalidad 40 depende de cada caso. Consultar con el IMSS o un asesor especializado.',
    ],
    fuente: 'Art. 218 Reglamento de la LSS 1973 (RIR-IMSS)',
  },
  {
    id: 'que_son_umas',
    titulo: '¿Qué es la UMA?',
    contenido: [
      'La Unidad de Medida y Actualización (UMA) es la referencia económica en pesos con la que se determinan la cuantía del pago de diversas obligaciones y supuestos previstos en las leyes federales.',
      'Fue creada mediante reforma constitucional publicada en el DOF el 27 de enero de 2016, sustituyendo al salario mínimo como referencia en obligaciones ajenas al ámbito laboral.',
      'Su valor es calculado y publicado por el INEGI anualmente a partir del 1° de febrero, con base en la variación del INPC.',
      'En materia de pensiones IMSS Ley 73, la UMA se utiliza principalmente para calcular el tope máximo del Salario Base de Cotización (25 UMA diarias) y como parámetro en algunos cálculos de la cuantía.',
    ],
    fuente: 'Art. 26 Constitución Política; Ley para Determinar el Valor de la UMA (DOF 30-dic-2015)',
  },
  {
    id: 'que_son_semanas',
    titulo: '¿Qué son las semanas cotizadas?',
    contenido: [
      'Las semanas cotizadas son las semanas durante las cuales el trabajador estuvo dado de alta ante el IMSS y su patrón realizó las aportaciones correspondientes.',
      'Cada semana completa de trabajo equivale a 7 días de cotización. Para tener una semana válida se requiere que el día de ingreso sea anterior al de egreso.',
      'Las semanas acumuladas determinan si el trabajador cumple el mínimo de 500 semanas requeridas para acceder a la pensión por Vejez o Cesantía en Edad Avanzada.',
      'También determinan el monto de los incrementos anuales a la cuantía básica: por cada 52 semanas adicionales a las 500 mínimas se obtiene un porcentaje extra.',
      'Puedes consultar tu historial de semanas cotizadas en el portal del IMSS (imss.gob.mx) con tu NSS, o solicitando la Constancia de Semanas Cotizadas.',
    ],
    fuente: 'Art. 167 LSS 1973; Criterios operativos IMSS',
  },
  {
    id: 'diferencia_ley73_ley97',
    titulo: '¿Cuál es la diferencia entre Ley 73 y Ley 97?',
    contenido: [
      'LEY 73 (vigente hasta jun-1997): Sistema de reparto. La pensión se calcula como un porcentaje del Salario Base de Cotización promedio de las últimas 250 semanas. El IMSS es quien paga la pensión directamente. Beneficia principalmente a trabajadores con salarios bajos/medios y muchas semanas cotizadas.',
      'LEY 97 (vigente desde jul-1997): Sistema de cuentas individuales (AFORE). La pensión depende del saldo acumulado en la cuenta del trabajador más la Pensión Garantizada del gobierno. El monto depende del ahorro individual y rendimientos.',
      'DERECHO DE ELECCIÓN: Los trabajadores con derechos mixtos (cotizaron antes y después de jul-1997) pueden elegir el sistema que más les convenga. Generalmente la Ley 73 es más favorable para quienes cuentan con muchas semanas cotizadas y/o salarios relativamente bajos.',
      'Esta aplicación calcula ÚNICAMENTE bajo la Ley 73. Para comparar ambos esquemas, acude al IMSS.',
    ],
    fuente: 'Décimo Cuarto Transitorio LSS 1997; Art. 138 y ss. LSS 1973',
  },
] as const;

export const FAQ_ITEMS: readonly SeccionInfo[] = [
  {
    id: 'faq_minimo_semanas',
    titulo: '¿Cuántas semanas necesito para pensionarme?',
    contenido: [
      'El mínimo es de 500 semanas cotizadas (equivalente a aproximadamente 9 años y 7 meses de trabajo continuo).',
      'Si tienes menos de 500 semanas, no cumples el requisito para la pensión de Vejez ni de Cesantía en Edad Avanzada bajo la Ley 73.',
      'En ese caso podrías tener derecho a otras prestaciones (devolución de aportaciones, etc.). Consulta directamente con el IMSS.',
    ],
    fuente: 'Arts. 138 y 145 LSS 1973',
  },
  {
    id: 'faq_edad',
    titulo: '¿A qué edad puedo pensionarme?',
    contenido: [
      'A los 65 años puedes tramitar la Pensión de Vejez (100% de la cuantía calculada).',
      'A partir de los 60 años puedes tramitar la Pensión de Cesantía en Edad Avanzada, pero con una reducción: 75% a los 60, 80% a los 61, 85% a los 62, 90% a los 63, 95% a los 64.',
    ],
    fuente: 'Arts. 138–140, 145 LSS 1973',
  },
  {
    id: 'faq_salario',
    titulo: '¿Qué salario se usa para calcular la pensión?',
    contenido: [
      'Se utiliza el promedio del Salario Base de Cotización (SBC) de las últimas 250 semanas (aproximadamente 4 años y 10 meses antes del retiro).',
      'El SBC es el salario sobre el cual cotizaste al IMSS, que puede incluir o no prestaciones según tu contrato.',
      'Si en los últimos años cotizaste en Modalidad 40 con un SBC mayor, ese salario también entra en el promedio.',
    ],
    fuente: 'Art. 167 LSS 1973',
  },
  {
    id: 'faq_beneficiarios',
    titulo: '¿Cómo afectan los beneficiarios a la pensión?',
    contenido: [
      'Los beneficiarios no reducen tu pensión, sino que pueden incrementarla mediante asignaciones familiares.',
      'Cónyuge o concubina/o: +15% de la cuantía de la pensión.',
      'Por cada hijo menor de 16 años (o mayor si está incapacitado): +10%.',
      'Si no tienes beneficiarios, recibes una ayuda asistencial del 15%.',
    ],
    fuente: 'Arts. 163–165 LSS 1973',
  },
  {
    id: 'faq_tope',
    titulo: '¿Existe un límite máximo en la pensión?',
    contenido: [
      'Sí. El Salario Base de Cotización máximo es de 25 UMA diarias (Art. 28 LSS vigente).',
      'Esto significa que aunque tu salario sea mayor, la pensión se calcula como máximo sobre 25 UMA diarias.',
      'Además existe una Pensión Mínima Garantizada equivalente al Salario Mínimo General vigente (Art. 170 LSS 1973).',
    ],
    fuente: 'Art. 28 LSS vigente; Art. 170 LSS 1973',
  },
  {
    id: 'faq_estimacion',
    titulo: '¿Por qué el resultado es una "estimación"?',
    contenido: [
      'El cálculo oficial de la pensión lo realiza exclusivamente el IMSS, considerando todos los datos de tu expediente y criterios administrativos vigentes.',
      'Esta aplicación utiliza las reglas públicas de la Ley 73 y valores de referencia (UMA, SMG) que pueden diferir ligeramente de los utilizados por el IMSS en tu caso particular.',
      'Los resultados tienen fines informativos y orientativos únicamente. Para conocer tu pensión exacta, acude a la Subdelegación del IMSS correspondiente.',
    ],
    fuente: 'LSS 1973; Criterios IMSS',
  },
] as const;
