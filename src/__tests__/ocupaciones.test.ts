import {
  M10_OCCUPATION_CATALOG,
  getOccupationDivision,
  getOccupationGroup,
  resolveRiskClass,
} from '../constants/ocupaciones';

describe('Catálogo de ocupaciones (Modalidad 10)', () => {
  test('resuelve la clase de riesgo a partir de división y grupo', () => {
    expect(resolveRiskClass('4', '41')).toBe(5); // Construcción → clase V
    expect(resolveRiskClass('5', '51')).toBe(1); // Comercio al por menor → clase I
    expect(resolveRiskClass('7', '73')).toBe(1); // Educación → clase I
  });

  test('devuelve undefined si la ocupación no existe', () => {
    expect(resolveRiskClass('99', '99')).toBeUndefined();
    expect(resolveRiskClass('1', undefined)).toBeUndefined();
    expect(resolveRiskClass(undefined, '11')).toBeUndefined();
  });

  test('todas las divisiones tienen grupos con clase válida', () => {
    for (const division of M10_OCCUPATION_CATALOG) {
      expect(division.groups.length).toBeGreaterThan(0);
      for (const group of division.groups) {
        expect([1, 2, 3, 4, 5]).toContain(group.riskClass);
        expect(getOccupationGroup(division.code, group.code)).toEqual(group);
      }
    }
    expect(getOccupationDivision('3')?.name).toContain('Industrias de transformación');
  });
});
