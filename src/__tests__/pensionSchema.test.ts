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

describe('PensionInputSchema — mínimo de 500 semanas (con proyección al jubilarse)', () => {
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

  test('el mensaje dice cuántas semanas faltan PARA AL JUBILARSE', () => {
    const input = { ...buildValidInput() };
    input.workHistory = { totalWeeks: 100, employmentRelations: [] };
    // El asegurado está en su edad de retiro: no hay horizonte a futuro.
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const mensaje = result.error.issues
        .map((i) => i.message)
        .find((m) => m.includes('mínimo 500 semanas'));
      expect(mensaje).toBeDefined();
      // 500 − 100 = 400 semanas faltantes, expresadas como faltan "al jubilarse".
      expect(mensaje).toMatch(/400/);
      expect(mensaje).toMatch(/al jubilarse/i);
    }
  });

  test('acepta pocas semanas si la proyección hasta el retiro alcanza las 500', () => {
    // 100 semanas cotizadas a los 30 años + 35 años proyectados (1820
    // semanas) = 1920 al jubilarse: se cumple el mínimo legal (Arts. 138 y 145).
    const input = { ...buildValidInput() };
    input.personalData = { ...input.personalData, age: 30, retirementAge: 65 };
    input.workHistory = { totalWeeks: 100, employmentRelations: [] };
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  test('quien no cumple hoy pero sí al jubilarse NO recibe el error de semanas', () => {
    // 100 semanas cotizadas a los 30 años: hoy NO cumple el mínimo, pero
    // al jubilarse tendrá 1920 (100 + 1820 proyectadas) y sí cumple.
    const input = { ...buildValidInput() };
    input.personalData = { ...input.personalData, age: 30, retirementAge: 65 };
    input.workHistory = { totalWeeks: 100, employmentRelations: [] };
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('mínimo 500 semanas')),
      ).toBe(false);
    }
  });

  test('rechaza cuando ni con la proyección se alcanza el mínimo de 500', () => {
    // 50 semanas cotizadas a los 64 años + 1 año proyectado (52) = 102.
    const input = { ...buildValidInput() };
    input.personalData = { ...input.personalData, age: 64, retirementAge: 65 };
    input.workHistory = { totalWeeks: 50, employmentRelations: [] };
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('mínimo 500 semanas')),
      ).toBe(true);
    }
  });

  test('el mensaje del mínimo de 500 narra las cifras de la proyección', () => {
    // 50 cotizadas + 52 proyectadas hasta los 65 años = 102 al jubilarse:
    // faltan 398 semanas.
    const input = { ...buildValidInput() };
    input.personalData = { ...input.personalData, age: 64, retirementAge: 65 };
    input.workHistory = { totalWeeks: 50, employmentRelations: [] };
    const result = PensionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const mensaje = result.error.issues
        .map((i) => i.message)
        .find((m) => m.includes('mínimo 500 semanas'));
      expect(mensaje).toBeDefined();
      // Cifras de la proyección: actuales, proyectadas y objetivo.
      expect(mensaje).toMatch(/50 cotizadas/);
      expect(mensaje).toMatch(/52 proyectadas hasta la edad de retiro/);
      expect(mensaje).toMatch(/= 102/);
      expect(mensaje).toMatch(/Te faltan 398 semanas/);
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
