/**
 * Pantalla principal (Dashboard) de la aplicación.
 * Muestra tarjetas de acceso rápido a las funcionalidades principales.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, Card, Surface, useTheme, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DashboardCard {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  onPress: () => void;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const tarjetas: DashboardCard[] = [
    {
      id: 'nueva',
      titulo: '🧮 Nueva Simulación',
      descripcion: 'Calcula tu pensión estimada paso a paso con todos los detalles',
      icono: '🧮',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('NewSimulation'),
    },
    {
      id: 'pdf',
      titulo: '📄 Importar Constancia IMSS',
      descripcion: 'Carga tu constancia de semanas cotizadas en PDF y extrae los datos automáticamente',
      icono: '📄',
      color: COLORS.accent,
      onPress: () => navigation.navigate('PdfImport'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Mi Pensión MX
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Calculadora de Pensión IMSS Ley 73
        </Text>
        <View style={styles.chipContainer}>
          <Chip
            style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            textStyle={{ color: '#FFFFFF', fontSize: 11 }}
            compact
          >
            ⚠️ Solo estimaciones — resolución oficial por IMSS
          </Chip>
        </View>
      </Surface>

      {/* Tarjetas principales */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        Acciones rápidas
      </Text>

      {tarjetas.map((tarjeta) => (
        <TouchableOpacity key={tarjeta.id} onPress={tarjeta.onPress} activeOpacity={0.8}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.cardIconContainer, { backgroundColor: tarjeta.color + '20' }]}>
                <Text style={styles.cardIcon}>{tarjeta.icono}</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {tarjeta.titulo}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {tarjeta.descripcion}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 20 }}>›</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Nota legal */}
      <Card style={[styles.legalCard, { backgroundColor: '#FFF8E1' }]} elevation={0}>
        <Card.Content>
          <Text variant="labelSmall" style={{ color: '#795548', lineHeight: 18 }}>
            ⚖️ <Text style={{ fontWeight: 'bold' }}>Aviso Legal:</Text> Esta aplicación proporciona ESTIMACIONES con fines informativos únicamente.
            Los cálculos se basan en la Ley del Seguro Social de 1973 y valores de referencia (UMA, SMG).
            La resolución oficial de su pensión corresponde exclusivamente al IMSS.
            Acuda a su Subdelegación del IMSS para información precisa y oficial.
          </Text>
        </Card.Content>
      </Card>

      {/* Info adicional */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        ¿Qué calcula esta app?
      </Text>
      <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          {[
            '✓ Cuantía básica según tabla Art. 167 LSS 1973',
            '✓ Incrementos anuales por semanas excedentes',
            '✓ Incremento del 11% (Decreto DOF 2001/2004)',
            '✓ Factor por edad (Cesantía 60–64 años)',
            '✓ Asignaciones familiares (cónyuge, hijos)',
            '✓ Ayuda asistencial',
            '✓ Pensión Mínima Garantizada',
            '✓ Tope 25 UMA',
            '✓ Ajuste por Modalidad 40',
          ].map((item, i) => (
            <Text key={i} variant="bodySmall" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
              {item}
            </Text>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  chipContainer: { marginTop: 12 },
  chip: { borderRadius: 20 },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 24 },
  cardTextContainer: { flex: 1 },
  legalCard: {
    marginBottom: 20,
    marginTop: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F00',
  },
  infoCard: {
    borderRadius: 12,
    marginBottom: 20,
  },
});
