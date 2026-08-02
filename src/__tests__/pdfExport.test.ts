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
import { formatCurrency } from '../utils/format';
import type { PensionInput } from '../models';

const mockPrintToFileAsync = Print.printToFileAsync as jest.Mock;
const mockPrintAsync = Print.printAsync as jest.Mock;
const mockIsAvailableAsync = Sharing.isAvailableAsync as jest.Mock;
const mockShareAsync = Sharing.shareAsync as jest.Mock;

function buildResult() {
  const input: PensionInput = {
    personalData: {
      name: 'Juan Pérez',
      sex: 'masculino',
      birthDate: new Date(1960, 0, 1),
      age: 65,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: 65,
    },
    workHistory: { totalWeeks: 500, employmentRelations: [] },
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
});
