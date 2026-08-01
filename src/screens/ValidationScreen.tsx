/**
 * Pantalla de validación de datos importados desde PDF.
 * Permite al usuario revisar y corregir los datos extraídos.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, useTheme, Divider, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ConstanciaIMSSParser } from '../services/pdf/parsers/PersonalDataParser';
import { mostrarAlerta } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Validation'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ValidationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { textoExtraido } = route.params;

  const [datos, setDatos] = useState({
    nombre: '',
    curp: '',
    nss: '',
    semanasTotales: '',
    ultimoSBC: '',
    fechaNacimiento: '',
  });
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);

  useEffect(() => {
    const resultado = ConstanciaIMSSParser.parse(textoExtraido);
    if (resultado.ok && resultado.data) {
      const d = resultado.data;
      setDatos({
        nombre: d.nombre ?? '',
        curp: d.curp ?? '',
        nss: d.nss ?? '',
        semanasTotales: d.semanasTotales ? String(d.semanasTotales) : '',
        ultimoSBC: d.ultimoSBC ? String(d.ultimoSBC) : '',
        fechaNacimiento: d.fechaNacimiento ? d.fechaNacimiento.toISOString().split('T')[0] ?? '' : '',
      });
      setAdvertencias(resultado.advertencias);
      setCamposFaltantes(resultado.camposFaltantes);
    }
  }, [textoExtraido]);

  const usarDatos = () => {
    if (!datos.semanasTotales || parseInt(datos.semanasTotales) <= 0) {
      mostrarAlerta('Error', 'Por favor ingresa el número de semanas cotizadas.');
      return;
    }
    // Los datos validados se pasan via navegación a NewSimulation
    // En un flujo real, se cargarían en el PensionForm context
    mostrarAlerta(
      'Datos validados',
      'Los datos han sido revisados. Ve a "Nueva Simulación" para calcular tu pensión con estos datos.',
      [{ text: 'OK', onPress: () => navigation.navigate('NewSimulation') }],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Advertencias */}
      {advertencias.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
          <Card.Title title="Notas de extracción" titleVariant="titleSmall" />
          <Card.Content>
            {advertencias.map((adv, i) => (
              <Text key={i} variant="bodySmall" style={{ color: '#795548', lineHeight: 18, marginBottom: 4 }}>
                • {adv}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Campos faltantes */}
      {camposFaltantes.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: '#C62828', marginBottom: 8 }}>
              ⚠️ Campos no encontrados en el PDF (completa manualmente):
            </Text>
            <View style={styles.chips}>
              {camposFaltantes.map((campo) => (
                <Chip key={campo} compact style={{ backgroundColor: '#FFCDD2' }}>{campo}</Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Datos personales */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="Datos personales extraídos" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          <TextInput label="Nombre completo" value={datos.nombre} onChangeText={(v) => setDatos({ ...datos, nombre: v })} mode="outlined" style={styles.input} />
          <TextInput label="CURP" value={datos.curp} onChangeText={(v) => setDatos({ ...datos, curp: v })} mode="outlined" style={styles.input} autoCapitalize="characters" />
          <TextInput label="NSS (Número de Seguridad Social)" value={datos.nss} onChangeText={(v) => setDatos({ ...datos, nss: v })} mode="outlined" style={styles.input} keyboardType="numeric" />
          <TextInput label="Fecha de nacimiento (AAAA-MM-DD)" value={datos.fechaNacimiento} onChangeText={(v) => setDatos({ ...datos, fechaNacimiento: v })} mode="outlined" style={styles.input} />
        </Card.Content>
      </Card>

      {/* Datos de cotización */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="Datos de cotización" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          <TextInput
            label="Total de semanas cotizadas *"
            value={datos.semanasTotales}
            onChangeText={(v) => setDatos({ ...datos, semanasTotales: v })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Último SBC (salario diario, MXN)"
            value={datos.ultimoSBC}
            onChangeText={(v) => setDatos({ ...datos, ultimoSBC: v })}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 }}>
        ✏️ Revisa y corrige los datos extraídos. Los datos marcados con * son requeridos para el cálculo de la pensión.
      </Text>

      <Button mode="contained" onPress={usarDatos} icon="check" style={styles.btn}>
        Confirmar y continuar
      </Button>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.btn}>
        Volver a importar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 16 },
  input: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { marginBottom: 12, borderRadius: 8 },
});
