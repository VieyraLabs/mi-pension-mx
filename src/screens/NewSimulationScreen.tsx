/**
 * Pantalla de nueva simulación — formulario por pasos (stepper).
 * Reúne todos los datos necesarios para calcular la pensión.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  SegmentedButtons,
  Switch,
  Divider,
  HelperText,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { usePensionForm } from '../hooks/usePensionForm';
import { calcularPension, validarInput } from '../services/pension/PensionCalculator';
import { useHistory } from '../hooks/useHistory';
import { TABLA_UMA_SMG } from '../constants/uma';
import { calcularEdad } from '../utils/date';
import { diarioAMensual, mensualADiario } from '../utils/format';
import { mostrarAlerta } from '../utils/alert';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'NewSimulation'>;

const PASOS = [
  'Datos personales',
  'Historial laboral',
  'Salario (SBC)',
  'UMA',
  'Modalidad 40',
  'Beneficiarios',
];

export default function NewSimulationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { input, actualizarDatosPersonales, actualizarHistorial, actualizarSalarioDiario, actualizarSalarioMensual, seleccionarUMAPorAnio, establecerUMAPersonalizada, actualizarModalidad40, actualizarBeneficiarios } = usePensionForm();
  const { guardar } = useHistory();

  const [paso, setPaso] = useState(0);
  const [salarioModoMensual, setSalarioModoMensual] = useState(false);
  const [umaPersonalizada, setUmaPersonalizada] = useState(false);
  const [precargadoDePdf, setPrecargadoDePdf] = useState(false);

  // Precarga el formulario con los datos revisados en ValidationScreen
  // (importación de PDF). Solo corre una vez, al entrar a la pantalla.
  useEffect(() => {
    const datosImportados = route.params?.datosImportados;
    if (!datosImportados) return;

    const { nombre, sexo, fechaNacimiento, semanasTotales, ultimoSBC } = datosImportados;

    const fecha = fechaNacimiento ? new Date(fechaNacimiento + 'T00:00:00') : undefined;
    actualizarDatosPersonales({
      ...(nombre ? { nombre } : {}),
      ...(sexo ? { sexo } : {}),
      ...(fecha && !isNaN(fecha.getTime()) ? { fechaNacimiento: fecha } : {}),
    });
    if (semanasTotales) {
      actualizarHistorial({ semanasTotales });
    }
    if (ultimoSBC) {
      actualizarSalarioDiario(ultimoSBC);
    }
    setPrecargadoDePdf(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.datosImportados]);

  const ir = (n: number) => setPaso((p) => Math.max(0, Math.min(PASOS.length - 1, p + n)));

  const calcular = async () => {
    const validation = validarInput(input);
    if (!validation.valido) {
      mostrarAlerta('Datos insuficientes', validation.errores.join('\n'));
      return;
    }
    const resultado = calcularPension(input);
    await guardar(resultado, input.datosPersonales.nombre ?? 'Simulación');
    navigation.navigate('Result', {});
  };

  const renderPaso = () => {
    switch (paso) {
      case 0:
        return <PasoDatosPersonales input={input} onChange={actualizarDatosPersonales} theme={theme} />;
      case 1:
        return <PasoHistorial input={input} onChange={actualizarHistorial} theme={theme} />;
      case 2:
        return (
          <PasoSalario
            input={input}
            onChangeDiario={actualizarSalarioDiario}
            onChangeMensual={actualizarSalarioMensual}
            modoMensual={salarioModoMensual}
            setModoMensual={setSalarioModoMensual}
            theme={theme}
          />
        );
      case 3:
        return (
          <PasoUMA
            input={input}
            onSeleccionarAnio={seleccionarUMAPorAnio}
            onPersonalizar={establecerUMAPersonalizada}
            personalizada={umaPersonalizada}
            setPersonalizada={setUmaPersonalizada}
            theme={theme}
          />
        );
      case 4:
        return <PasoModalidad40 input={input} onChange={actualizarModalidad40} theme={theme} />;
      case 5:
        return <PasoBeneficiarios input={input} onChange={actualizarBeneficiarios} theme={theme} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Indicador de progreso */}
      <View style={[styles.stepIndicator, { backgroundColor: theme.colors.surface }]}>
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
          Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}
        </Text>
        <View style={styles.stepDots}>
          {PASOS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                { backgroundColor: i <= paso ? theme.colors.primary : theme.colors.outline },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {precargadoDePdf && (
          <Card style={[styles.card, { backgroundColor: '#E3F2FD', marginBottom: 16 }]} elevation={0}>
            <Card.Content>
              <Text variant="bodySmall" style={{ color: '#1565C0', lineHeight: 18 }}>
                📄 Este formulario se precargó con los datos de tu constancia IMSS. Revisa cada paso —
                especialmente el SBC, que corresponde a tu último salario registrado, no necesariamente al
                promedio de tus últimas 250 semanas.
              </Text>
            </Card.Content>
          </Card>
        )}
        {renderPaso()}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button
          mode="outlined"
          onPress={() => ir(-1)}
          disabled={paso === 0}
          style={styles.btn}
        >
          Anterior
        </Button>
        {paso < PASOS.length - 1 ? (
          <Button mode="contained" onPress={() => ir(1)} style={styles.btn}>
            Siguiente
          </Button>
        ) : (
          <Button mode="contained" onPress={calcular} style={styles.btn} icon="calculator">
            Calcular Pensión
          </Button>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Sub-componentes de pasos
// ─────────────────────────────────────────────

function PasoDatosPersonales({ input, onChange, theme }: any) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Información personal
        </Text>
        <TextInput
          label="Nombre (opcional)"
          value={input.datosPersonales.nombre ?? ''}
          onChangeText={(v) => onChange({ nombre: v })}
          mode="outlined"
          style={styles.input}
        />
        <Text variant="labelMedium" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
          Sexo *
        </Text>
        <SegmentedButtons
          value={input.datosPersonales.sexo}
          onValueChange={(v) => onChange({ sexo: v as any })}
          buttons={[
            { value: 'masculino', label: 'Masculino' },
            { value: 'femenino', label: 'Femenino' },
          ]}
          style={{ marginBottom: 16 }}
        />
        <TextInput
          label="Fecha de nacimiento (AAAA-MM-DD) *"
          value={input.datosPersonales.fechaNacimiento?.toISOString().split('T')[0] ?? ''}
          onChangeText={(v) => {
            const d = new Date(v + 'T00:00:00');
            if (!isNaN(d.getTime())) onChange({ fechaNacimiento: d });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          placeholder="1965-01-15"
        />
        {input.datosPersonales.fechaNacimiento && (
          <HelperText type="info">
            Edad actual: {calcularEdad(input.datosPersonales.fechaNacimiento)} años
          </HelperText>
        )}
        <TextInput
          label="Edad de retiro (60–65 años) *"
          value={String(input.datosPersonales.edadRetiro)}
          onChangeText={(v) => {
            const n = parseInt(v);
            if (!isNaN(n)) onChange({ edadRetiro: n });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type="info">
          60–64 = Cesantía en Edad Avanzada (con reducción). 65+ = Vejez (sin reducción).
        </HelperText>
      </Card.Content>
    </Card>
  );
}

function PasoHistorial({ input, onChange, theme }: any) {
  const semanas = input.historialLaboral.semanasTotales;
  const cumple = semanas >= 500;

  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Historial laboral
        </Text>
        <TextInput
          label="Total de semanas cotizadas *"
          value={semanas > 0 ? String(semanas) : ''}
          onChangeText={(v) => {
            const n = parseInt(v);
            if (!isNaN(n)) onChange({ semanasTotales: n });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type={cumple ? 'info' : 'error'}>
          {cumple
            ? `✓ Cumple el mínimo de 500 semanas. Excedentes: ${semanas - 500} semanas (${Math.floor((semanas - 500) / 52)} años adicionales).`
            : `⚠️ Mínimo requerido: 500 semanas (Arts. 138 y 145 LSS 1973). Te faltan ${500 - semanas} semanas.`}
        </HelperText>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Puedes verificar tus semanas cotizadas en el portal del IMSS (imss.gob.mx) con tu NSS.
        </Text>
      </Card.Content>
    </Card>
  );
}

function PasoSalario({ input, onChangeDiario, onChangeMensual, modoMensual, setModoMensual, theme }: any) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Salario Base de Cotización (SBC)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
          Ingresa el promedio del SBC de tus últimas 250 semanas cotizadas (~4 años y 10 meses).
        </Text>
        <SegmentedButtons
          value={modoMensual ? 'mensual' : 'diario'}
          onValueChange={(v) => setModoMensual(v === 'mensual')}
          buttons={[
            { value: 'diario', label: 'Salario diario' },
            { value: 'mensual', label: 'Salario mensual' },
          ]}
          style={{ marginBottom: 16 }}
        />
        {!modoMensual ? (
          <>
            <TextInput
              label="Salario diario promedio (MXN) *"
              value={input.salarioPromedio.salarioDiario > 0 ? String(input.salarioPromedio.salarioDiario) : ''}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChangeDiario(n); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />
            {input.salarioPromedio.salarioDiario > 0 && (
              <HelperText type="info">
                Equivalente mensual: ${diarioAMensual(input.salarioPromedio.salarioDiario).toFixed(2)} MXN
              </HelperText>
            )}
          </>
        ) : (
          <>
            <TextInput
              label="Salario mensual promedio (MXN) *"
              value={input.salarioPromedio.salarioMensual > 0 ? String(input.salarioPromedio.salarioMensual) : ''}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChangeMensual(n); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />
            {input.salarioPromedio.salarioMensual > 0 && (
              <HelperText type="info">
                Equivalente diario: ${mensualADiario(input.salarioPromedio.salarioMensual).toFixed(2)} MXN
              </HelperText>
            )}
          </>
        )}
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          El SBC es el salario registrado ante el IMSS, no necesariamente el salario neto recibido.
        </Text>
      </Card.Content>
    </Card>
  );
}

function PasoUMA({ input, onSeleccionarAnio, onPersonalizar, personalizada, setPersonalizada, theme }: any) {
  const [umaCustom, setUmaCustom] = useState('');

  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Unidad de Medida y Actualización (UMA)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
          Selecciona el año de la UMA a utilizar en el cálculo.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Switch value={personalizada} onValueChange={setPersonalizada} />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            Ingresar UMA personalizada
          </Text>
        </View>

        {personalizada ? (
          <>
            <TextInput
              label="UMA diaria (MXN)"
              value={umaCustom}
              onChangeText={setUmaCustom}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Button
              mode="outlined"
              onPress={() => { const n = parseFloat(umaCustom); if (!isNaN(n)) onPersonalizar(n); }}
              style={{ marginTop: 8 }}
            >
              Usar esta UMA
            </Button>
          </>
        ) : (
          <>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Año de la UMA:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[...TABLA_UMA_SMG].slice(-5).reverse().map((r) => (
                  <Chip
                    key={r.anio}
                    selected={input.uma.anio === r.anio}
                    onPress={() => onSeleccionarAnio(r.anio)}
                    style={{ marginBottom: 4 }}
                  >
                    {r.anio}{r.esEstimacion ? ' ⚠️' : ''}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <Divider style={{ marginVertical: 12 }} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          UMA seleccionada: ${input.uma.umaDiaria.toFixed(2)}/día | ${input.uma.umaMensual.toFixed(2)}/mes
          {input.uma.esPersonalizada ? ' (personalizada)' : ` (${input.uma.anio})`}
        </Text>
      </Card.Content>
    </Card>
  );
}

function PasoModalidad40({ input, onChange, theme }: any) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Modalidad 40 (opcional)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Art. 218 Reglamento LSS — permite cotizar voluntariamente con un SBC mayor para aumentar el promedio de las últimas 250 semanas.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Switch
            value={input.modalidad40.activa}
            onValueChange={(v) => onChange({ activa: v })}
          />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            ¿Cotiza actualmente en Modalidad 40?
          </Text>
        </View>

        {input.modalidad40.activa && (
          <>
            <TextInput
              label="Salario de cotización M40 (diario, MXN) *"
              value={String(input.modalidad40.salarioCotizacion ?? '')}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ salarioCotizacion: n }); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              label="Meses cotizando en M40 (estimado)"
              value={String(input.modalidad40.mesesEsperados ?? '')}
              onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n)) onChange({ mesesEsperados: n }); }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Incremento salarial anual esperado (%) — opcional"
              value={String(input.modalidad40.incrementoSalarialAnual ?? '')}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ incrementoSalarialAnual: n }); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </>
        )}
      </Card.Content>
    </Card>
  );
}

function PasoBeneficiarios({ input, onChange, theme }: any) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Beneficiarios
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
          Arts. 163–165 LSS 1973. Los beneficiarios incrementan tu pensión con asignaciones familiares.
        </Text>

        <View style={styles.switchRow}>
          <Switch
            value={input.beneficiarios.tieneConyuge}
            onValueChange={(v) => onChange({ tieneConyuge: v })}
          />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            Tiene cónyuge o concubina/o (+15%)
          </Text>
        </View>

        <View style={styles.switchRow}>
          <Switch
            value={input.beneficiarios.tieneHijosMenores}
            onValueChange={(v) => onChange({ tieneHijosMenores: v, numeroHijosMenores: v ? 1 : 0 })}
          />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            Tiene hijos menores de 16 años (+10% por hijo)
          </Text>
        </View>

        {input.beneficiarios.tieneHijosMenores && (
          <TextInput
            label="Número de hijos menores"
            value={String(input.beneficiarios.numeroHijosMenores)}
            onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n)) onChange({ numeroHijosMenores: n }); }}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, { marginLeft: 40 }]}
          />
        )}

        <View style={styles.switchRow}>
          <Switch
            value={input.beneficiarios.tienePadresDependientes}
            onValueChange={(v) => onChange({ tienePadresDependientes: v, numeroPadresDependientes: v ? 1 : 0 })}
          />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface, flex: 1 }}>
            Tiene padres dependientes económicamente (+10%) — solo si no hay cónyuge ni hijos
          </Text>
        </View>

        <Divider style={{ marginVertical: 12 }} />
        <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
          {!input.beneficiarios.tieneConyuge && !input.beneficiarios.tieneHijosMenores
            ? '✓ Se aplicará ayuda asistencial del 15% (sin beneficiarios)'
            : input.beneficiarios.tieneConyuge && !input.beneficiarios.tieneHijosMenores
              ? '✓ Se aplicará ayuda asistencial del 10% (cónyuge sin hijos)'
              : '✓ Asignaciones familiares activas'}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepIndicator: { padding: 16, alignItems: 'center', elevation: 2 },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  btn: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
});
