/**
 * Pruebas de pdfExport (generación y compartición del reporte de pensión).
 * Mockea expo-print y expo-sharing para no depender de un dispositivo real.
 *
 * Para ejecutar: npm test
 */
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
  printAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { exportPensionResultToPdf } from '../services/export/pdfExport';
import { calculatePension } from '../services/pension/PensionCalculator';
import { formatCurrency, formatWeeksTargetText } from '../utils/format';
import type { PensionInput } from '../models';

const mockPrintToFileAsync = Print.printToFileAsync as jest.Mock;
const mockPrintAsync = Print.printAsync as jest.Mock;
const mockIsAvailableAsync = Sharing.isAvailableAsync as jest.Mock;
const mockShareAsync = Sharing.shareAsync as jest.Mock;

function buildResult(
  age = 65,
  estimatedRetirementDate = new Date(2025, 0, 1),
  modalidad40: PensionInput['modalidad40'] = { active: false },
) {
  const input: PensionInput = {
    personalData: {
      name: 'Juan Pérez',
      sex: 'masculino',
      birthDate: new Date(1960, 0, 1),
      age,
      estimatedRetirementDate,
      retirementAge: 65,
    },
    workHistory: { totalWeeks: 500, employmentRelations: [] },
    averageSalary: { dailySalary: 200, monthlySalary: 6080, isManual: true },
    uma: { dailyUMA: 113.14, monthlyUMA: 3439.46, annualUMA: 41296.1, year: 2025, isCustom: false },
    modalidad40,
    beneficiaries: {
      hasSpouse: false,
      hasMinorChildren: false,
      numberOfMinorChildren: 0,
      hasDependentParents: false,
      numberOfDependentParents: 0,
    },
  };
  return calculatePension(input);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///tmp/reporte.pdf' });
});

describe('exportPensionResultToPdf', () => {
  test('genera el archivo y lo comparte cuando compartir está disponible', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);

    await exportPensionResultToPdf(buildResult());

    expect(mockPrintToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({ base64: false, html: expect.stringContaining('Juan Pérez') }),
    );
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///tmp/reporte.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
    expect(mockPrintAsync).not.toHaveBeenCalled();
  });

  test('cae a la impresión directa cuando compartir no está disponible', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    await exportPensionResultToPdf(buildResult());

    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockPrintAsync).toHaveBeenCalledWith({ uri: 'file:///tmp/reporte.pdf' });
  });

  test('el HTML generado incluye el monto de la pensión mensual', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    const result = buildResult();

    await exportPensionResultToPdf(result);

    const html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(html).toContain(formatCurrency(result.monthlyPension));
    expect(html).toContain('AVISO LEGAL');
  });

  test('el HTML separa las semanas cotizadas actuales de las objetivo al jubilarte', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let result: ReturnType<typeof buildResult>;
    try {
      result = buildResult(45, new Date(2045, 5, 1));
    } finally {
      jest.useRealTimers();
    }

    await exportPensionResultToPdf(result);

    const html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(html).toContain('Semanas cotizadas actuales');
    expect(html).toContain('Semanas estimadas al pensionarte');
    expect(html).not.toContain('Semanas cotizadas registradas');
    // El intervalo exacto genera 1044 semanas proyectadas y 1544 objetivo.
    expect(html).toContain(
      '1,544 sem. (500 cotizadas + 1,044 proyectadas hasta la fecha de retiro)',
    );
    expect(html).not.toContain('aprox. por meses');
  });

  test('usa la fecha de cálculo guardada para el resumen M40 aunque el PDF se genere después', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let result: ReturnType<typeof buildResult>;
    try {
      result = buildResult(45, new Date(2026, 0, 31), {
        active: true,
        contributionSalary: 300,
        expectedMonths: 7,
      });
    } finally {
      jest.useRealTimers();
    }

    jest.useFakeTimers().setSystemTime(new Date(2030, 0, 1));
    try {
      await exportPensionResultToPdf(result!);
    } finally {
      jest.useRealTimers();
    }

    const html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(html).toContain('Semanas M40 dentro del promedio de últimas 250');
    expect(html).toContain('Semanas previas al periodo M40');
    expect(html).toContain('Semanas M40 planeadas hasta fin de mes de retiro');
    expect(html).toContain('Semanas cotizadas + semanas M40 planeadas');
    expect(html).toContain('Salario promedio ponderado');
    expect(html).toContain('31 sem.');
    expect(html).not.toContain('aprox. por meses');
  });

  test('usa el fallback histórico de meses cuando falta weeksProjection', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let result: ReturnType<typeof buildResult>;
    try {
      result = buildResult(45, new Date(2026, 0, 31), {
        active: true,
        contributionSalary: 300,
        expectedMonths: 7,
      });
    } finally {
      jest.useRealTimers();
    }
    delete result!.weeksProjection;

    await exportPensionResultToPdf(result!);

    const html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(html).toContain('Semanas cotizadas registradas');
    expect(html).not.toContain('Semanas estimadas al pensionarte');
    expect(html).toContain('30 sem.');
    expect(html).toContain('530 sem.');
    expect(html).toContain('Semanas M40 dentro del promedio de últimas 250 (aprox. por meses)');
    expect(html).toContain('Semanas previas al periodo M40 (aprox. por meses)');
    expect(html).toContain('Semanas M40 planeadas hasta fin de mes de retiro (aprox. por meses)');
    expect(html).toContain('Semanas cotizadas + semanas M40 planeadas (aprox. por meses)');
    expect(html).toContain('Salario promedio ponderado (aprox. por meses)');
  });

  test('incluye el resumen auditable de M40 activo y mantiene el resumen sin M40', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let result: ReturnType<typeof buildResult>;
    try {
      result = buildResult(45, new Date(2026, 0, 15), {
        active: true,
        contributionSalary: 300,
        expectedMonths: 7,
      });
    } finally {
      jest.useRealTimers();
    }

    await exportPensionResultToPdf(result);

    const html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(html).toContain('Meses que planeas cotizar');
    expect(html).toContain('7 meses');
    expect(html).toContain('Semanas M40 dentro del promedio de últimas 250');
    expect(html).toContain('31 sem.');
    expect(html).toContain('Semanas previas al periodo M40');
    expect(html).toContain('219 sem.');
    expect(html).toContain('Semanas M40 planeadas hasta fin de mes de retiro');
    expect(html).toContain('Semanas cotizadas + semanas M40 planeadas');
    expect(html).not.toContain('aprox. por meses');
    expect(html).toContain('SBC M40 con incremento anual');
    expect(html).toContain('Semanas estimadas al pensionarte');
    expect(html).toContain(
      formatWeeksTargetText(result.weeksProjection!, result.input.personalData.retirementAge),
    );
    expect(html).toContain('Salario promedio ponderado');
    expect(html).toContain(`${formatCurrency(212.4)}/día`);

    mockPrintToFileAsync.mockClear();
    const withoutM40 = buildResult();
    withoutM40.input.projectedAverageDailySalary = 300;
    await exportPensionResultToPdf(withoutM40);
    const noM40Html = mockPrintToFileAsync.mock.calls[0][0].html as string;
    expect(noM40Html).toContain('SBC actual (diario)');
    expect(noM40Html).toContain('SBC proyectado al retiro (diario)');
    expect(noM40Html).toContain(formatCurrency(200));
    expect(noM40Html).toContain(formatCurrency(300));
    expect(noM40Html).not.toContain('Meses que planeas cotizar');
    expect(noM40Html).not.toContain('Semanas M40 planeadas');
    expect(noM40Html).not.toContain('Salario promedio ponderado');
  });
});
