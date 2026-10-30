import {
  M10_OCCUPATION_CATALOG,
  getOccupationDivision,
  getOccupationGroup,
  resolveRiskClass,
} from '../constants/ocupaciones';

describe('Catálogo de ocupaciones (Modalidad 10)', () => {
  test('resuelve la clase de riesgo a partir de división y grupo (clases confirmadas)', () => {
    expect(resolveRiskClass('4', '41')).toBe(5); // Construcción → clase V (fracción 412)
    expect(resolveRiskClass('6', '61')).toBe(2); // Comercio al por menor → clase II (fracción 611)
    expect(resolveRiskClass('8', '81')).toBe(1); // Servicios profesionales → clase I (fracción 841)
    expect(resolveRiskClass('7', '71')).toBe(5); // Transporte de carga → clase V (fracción 712)
    expect(resolveRiskClass('0', '01')).toBe(3); // Agricultura → clase III (fracción 011)
  });

  test('los grupos confirmados citan su fracción RACERF', () => {
    const confirmed = M10_OCCUPATION_CATALOG.flatMap((d) => d.groups).filter(
      (g) => g.sourceFraction,
    );
    expect(confirmed.length).toBeGreaterThan(0);
    for (const group of confirmed) {
      expect(typeof group.sourceFraction).toBe('string');
    }
  });

  test('devuelve undefined si la ocupación no existe', () => {
    expect(resolveRiskClass('99', '99')).toBeUndefined();
    expect(resolveRiskClass('1', undefined)).toBeUndefined();
    expect(resolveRiskClass(undefined, '11')).toBeUndefined();
  });

  test('hay 10 divisiones del RACERF y todos los grupos tienen clase válida', () => {
    expect(M10_OCCUPATION_CATALOG).toHaveLength(10);
    for (const division of M10_OCCUPATION_CATALOG) {
      expect(division.groups.length).toBeGreaterThan(0);
      for (const group of division.groups) {
        expect([1, 2, 3, 4, 5]).toContain(group.riskClass);
        expect(getOccupationGroup(division.code, group.code)).toEqual(group);
      }
    }
    expect(getOccupationDivision('0')?.name).toContain('Agricultura');
  });
});
