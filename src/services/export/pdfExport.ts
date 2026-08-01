/**
 * Servicio de exportación de resultados de pensión a PDF.
 * Usa expo-print y expo-sharing para generar y compartir el PDF.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { PensionResult } from '../../models';
import { formatCurrency, formatPercent, formatDateLong } from '../../utils/format';

/**
 * Genera el contenido HTML del reporte de pensión.
 */
function generarHTML(resultado: PensionResult): string {
  const { input } = resultado;
  const fechaCalculo = new Date(resultado.fechaCalculo);

  const pasosHTML = resultado.pasos
    .map(
      (paso) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; font-weight: bold;">${paso.titulo}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; color: #555;">${paso.descripcion}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; font-weight: bold; color: #1565C0; text-align: right;">${formatCurrency(paso.valor)}</td>
    </tr>
    ${paso.baseLegal ? `<tr><td colspan="3" style="padding: 2px 8px 8px; font-size: 10px; color: #888; font-style: italic;">📋 ${paso.baseLegal}</td></tr>` : ''}
    ${paso.esEstimacion ? `<tr><td colspan="3" style="padding: 2px 8px 8px; font-size: 10px; color: #FF6F00;">⚠️ ESTIMACIÓN</td></tr>` : ''}
  `,
    )
    .join('');

  const advertenciasHTML = resultado.advertencias
    .map((adv) => `<li style="margin-bottom: 8px; font-size: 11px; line-height: 1.5;">${adv}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte de Pensión IMSS Ley 73</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1 { color: #1565C0; border-bottom: 3px solid #1565C0; padding-bottom: 8px; font-size: 20px; }
    h2 { color: #1565C0; font-size: 16px; margin-top: 24px; }
    .estimacion-banner { background: #FFF8E1; border-left: 4px solid #FF6F00; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 12px; color: #795548; }
    .resultado-principal { background: #1565C0; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0; }
    .resultado-principal .monto { font-size: 32px; font-weight: bold; }
    .resultado-principal .label { font-size: 13px; opacity: 0.85; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 8px 0; }
    .sub-monto { background: rgba(255,255,255,0.15); padding: 12px; border-radius: 6px; text-align: center; }
    .sub-monto .valor { font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { background: #E3F2FD; color: #1565C0; padding: 10px 8px; text-align: left; font-size: 12px; }
    .footer { margin-top: 32px; border-top: 2px solid #eee; padding-top: 12px; font-size: 10px; color: #888; }
    .chip { display: inline-block; background: #E3F2FD; color: #1565C0; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin: 2px; }
  </style>
</head>
<body>
  <h1>🧮 Calculadora de Pensión IMSS Ley 73</h1>
  <p style="font-size: 12px; color: #666;">Generado el ${formatDateLong(fechaCalculo)} | Mi Pensión MX</p>

  <div class="estimacion-banner">
    ⚠️ <strong>AVISO LEGAL:</strong> Este reporte contiene ESTIMACIONES con fines informativos únicamente.
    La resolución oficial de la pensión corresponde exclusivamente al IMSS conforme a sus procedimientos institucionales.
  </div>

  <!-- Datos del asegurado -->
  <h2>Datos del asegurado</h2>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    ${input.datosPersonales.nombre ? `<tr><td>Nombre</td><td>${input.datosPersonales.nombre}</td></tr>` : ''}
    <tr><td>Sexo</td><td>${input.datosPersonales.sexo === 'masculino' ? 'Masculino' : 'Femenino'}</td></tr>
    <tr><td>Edad de retiro</td><td>${input.datosPersonales.edadRetiro} años</td></tr>
    <tr><td>Tipo de pensión</td><td>${resultado.tipoPension === 'vejez' ? 'Vejez (Art. 145 LSS 1973)' : 'Cesantía en Edad Avanzada (Art. 138 LSS 1973)'}</td></tr>
    <tr><td>Semanas cotizadas</td><td>${input.historialLaboral.semanasTotales}</td></tr>
    <tr><td>Salario diario promedio (SBC)</td><td>${formatCurrency(input.salarioPromedio.salarioDiario)}</td></tr>
    <tr><td>UMA utilizada</td><td>${formatCurrency(input.uma.umaDiaria)}/día (${input.uma.anio}${input.uma.esPersonalizada ? ', personalizada' : ''})</td></tr>
    ${input.modalidad40.activa ? `<tr><td>Modalidad 40</td><td>Activa — $${input.modalidad40.salarioCotizacion}/día</td></tr>` : ''}
  </table>

  <!-- Resultado principal -->
  <div class="resultado-principal">
    <div class="label">Pensión mensual estimada</div>
    <div class="monto">${formatCurrency(resultado.pensionMensual)}</div>
    <div class="grid-2" style="margin-top: 12px;">
      <div class="sub-monto">
        <div class="label">Anual</div>
        <div class="valor">${formatCurrency(resultado.pensionAnual)}</div>
      </div>
      <div class="sub-monto">
        <div class="label">Diario</div>
        <div class="valor">${formatCurrency(resultado.montoDiario)}</div>
      </div>
    </div>
  </div>

  <!-- Indicadores -->
  <p>
    ${resultado.aplicoTope ? '<span class="chip">⚠️ Tope 25 UMA aplicado</span>' : ''}
    ${resultado.aplicoPMG ? '<span class="chip">⚠️ PMG aplicada</span>' : ''}
    <span class="chip">Factor edad: ${formatPercent(resultado.factorEdad * 100)}</span>
  </p>

  <!-- Desglose del cálculo -->
  <h2>Desglose del cálculo (Ley 73)</h2>
  <table>
    <tr>
      <th>Paso</th>
      <th>Descripción</th>
      <th style="text-align: right;">Valor</th>
    </tr>
    ${pasosHTML}
  </table>

  <!-- Advertencias -->
  <h2>Notas y advertencias</h2>
  <ul style="padding-left: 16px; color: #795548;">
    ${advertenciasHTML}
  </ul>

  <div class="footer">
    <p><strong>Mi Pensión MX</strong> — Calculadora de Pensión IMSS Ley 73</p>
    <p>Esta aplicación es solo para fines informativos. No constituye asesoría legal ni financiera.</p>
    <p>Para información oficial sobre tu pensión, visita imss.gob.mx o acude a la Subdelegación del IMSS de tu zona.</p>
    <p>Fuentes: Ley del Seguro Social de 1973 (DOF 12-mar-1973); Criterios operativos IMSS.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Genera el PDF del resultado de la pensión y lo abre para compartir.
 */
export async function generarPDF(resultado: PensionResult): Promise<void> {
  const html = generarHTML(resultado);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const puedeCompartir = await Sharing.isAvailableAsync();
  if (puedeCompartir) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir reporte de pensión',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
