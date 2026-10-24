/**
 * Tests de contrato del esquema de validación compartido (Zod).
 *
 * CHG-20261024-002 / US-004: `employmentRelations` está tipado con
 * `EmploymentRelationSchema` (espejo de `EmploymentRelation` de
 * src/models/index.ts) — ya no admite `any`. Estos tests fijan el contrato:
 * formularios, motor, parser PDF e historial comparten esta misma forma.
 *
 * Para ejecutar: npm test
 */
import {
  PensionInputSchema,
  WorkHistorySchema,
  EmploymentRelationSchema,
} from '../validation/pensionSchema';

function buildValidRelation() {
  return {
    employerName: 'EMPRESA DE PRUEBA SA DE CV',
    employerRegistrationNumber: 'E234567810',
    startDate: new Date(2018, 6, 1),
    endDate: new Date(2021, 0, 15),
    contributionBaseSalary: 500,
    movementType: '09',
    contributedDays: 920,
  };
}

function buildValidInput() {
  return {
    personalData: {
      name: 'Usuario de Prueba',
      sex: 'masculino' as const,
      birthDate: new Date(1965, 0, 1),
      age: 60,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: 60,
    },
    workHistory: {
      totalWeeks: 520,
      employmentRelations: [buildValidRelation()],
    },
    averageSalary: { dailySalary: 200, monthlySalary: 6080, isManual: true },
    uma: { dailyUMA: 113.14, monthlyUMA: 3439.46, annualUMA: 41296.1, year: 2025, isCustom: false },
    modalidad40: { active: false },
    beneficiaries: {
      hasSpouse: false,
      hasMinorChildren: false,
      numberOfMinorChildren: 0,
      hasDependentParents: false,
      numberOfDependentParents: 0,
    },
  };
}

describe('EmploymentRelationSchema', () => {
  test('acepta una relación laboral completa (forma que produce el parser PDF)', () => {
    const result = EmploymentRelationSchema.safeParse(buildValidRelation());
    expect(result.success).toBe(true);
  });

  test('acepta un empleo activo sin endDate', () => {
    const vigente = buildValidRelation();
    delete (vigente as Partial<typeof vigente>).endDate;
    const result = EmploymentRelationSchema.safeParse(vigente);
    expect(result.success).toBe(true);
  });

  test('rechaza contributedDays negativo con mensaje accionable', () => {
    const result = EmploymentRelationSchema.safeParse({
      ...buildValidRelation(),
      contributedDays: -10,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('no pueden ser negativos'))).toBe(
        true,
      );
    }
  });

  test('rechaza contributedDays fraccionario', () => {
    const result = EmploymentRelationSchema.safeParse({
      ...buildValidRelation(),
      contributedDays: 9.5,
    });
    expect(result.success).toBe(false);
  });

  test('rechaza contributionBaseSalary negativo', () => {
    const result = EmploymentRelationSchema.safeParse({
      ...buildValidRelation(),
      contributionBaseSalary: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('no puede ser negativo')),
      ).toBe(true);
    }
  });

  test('rechaza startDate faltante', () => {
    const sinAlta = buildValidRelation();
    delete (sinAlta as Partial<typeof sinAlta>).startDate;
    const result = EmploymentRelationSchema.safeParse(sinAlta);
    expect(result.success).toBe(false);
  });
});

describe('WorkHistorySchema — employmentRelations tipado', () => {
  test('aplica default [] cuando no se proveen relaciones', () => {
    const result = WorkHistorySchema.parse({ totalWeeks: 500 });
    expect(result.employmentRelations).toEqual([]);
  });

  test('valida las relaciones dentro del historial laboral', () => {
    const result = WorkHistorySchema.safeParse({
      totalWeeks: 500,
      employmentRelations: [{ ...buildValidRelation(), contributedDays: -1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('PensionInputSchema — contrato completo con historial reconstruido', () => {
  test('acepta un input válido que incluye una relación laboral completa', () => {
    const result = PensionInputSchema.safeParse(buildValidInput());
    expect(result.success).toBe(true);
  });

  test('rechaza el input completo si una relación tiene contributedDays negativo', () => {
    const input = buildValidInput();
    input.workHistory.employmentRelations = [
      { ...buildValidRelation(), contributedDays: -5 },
    ];
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.path.includes('employmentRelations'),
        ),
      ).toBe(true);
    }
  });
});

describe('PensionInputSchema — mínimo de 500 semanas (comportamiento previo intacto)', () => {
  test('rechaza un sexo no soportado con el mensaje del errorMap (enum SexSchema)', () => {
    const input = buildValidInput();
    input.personalData.sex = 'otro' as typeof input.personalData.sex;
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Selecciona el sexo'))).toBe(true);
    }
  });

  test('rechaza edad de retiro menor a 60 citando el límite legal (Cesantía en Edad Avanzada)', () => {
    const input = buildValidInput();
    input.personalData.retirementAge = 58;
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('mínima de retiro es 60')),
      ).toBe(true);
    }
  });

  test('rechaza 499 semanas sin Modalidad 40', () => {
    const input = { ...buildValidInput() };
    input.workHistory = { totalWeeks: 499, employmentRelations: [buildValidRelation()] };
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('mínimo 500 semanas')),
      ).toBe(true);
    }
  });

  test('acepta 480 semanas + Modalidad 40 planeada que completa el mínimo', () => {
    const input = { ...buildValidInput() };
    input.workHistory = { totalWeeks: 480, employmentRelations: [buildValidRelation()] };
    input.modalidad40 = {
      active: true,
      contributionSalary: 300,
      startDate: new Date(2025, 0, 1),
      expectedMonths: 24,
      annualSalaryIncrease: 5,
    } as typeof input.modalidad40;
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  test('rechaza 400 semanas aunque Modalidad 40 planeada no alcance el mínimo', () => {
    const input = { ...buildValidInput() };
    input.workHistory = { totalWeeks: 400, employmentRelations: [] };
    input.modalidad40 = {
      active: true,
      contributionSalary: 300,
      startDate: new Date(2025, 0, 1),
      expectedMonths: 6,
      annualSalaryIncrease: 5,
    } as typeof input.modalidad40;
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('planeadas en Modalidad 40')),
      ).toBe(true);
    }
  });
});
