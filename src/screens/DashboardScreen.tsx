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
} from 'react-native';
import { Text, Card, Surface, useTheme, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../theme';
import { MessageBanner } from '../components/MessageBanner';
import { ESTIMATION_DISCLAIMER_SHORT } from '../constants/infoLegal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const cards: DashboardCard[] = [
    {
      id: 'nueva',
      title: '🧮 Nueva Simulación',
      description: 'Calcula tu pensión estimada paso a paso con todos los detalles',
      icon: '🧮',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('NewSimulation'),
    },
    {
      id: 'pdf',
      title: '📄 Importar Constancia IMSS',
      description: 'Carga tu constancia de semanas cotizadas en PDF y extrae los datos automáticamente',
      icon: '📄',
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
        <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
          Mi Pensión MX
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
          Calculadora de Pensión IMSS Ley 73
        </Text>
        <View style={styles.chipContainer}>
          <Chip
            style={[styles.chip, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)' }]}
            textStyle={{ color: theme.colors.onPrimary, fontSize: 11 }}
            compact
          >
            ⚠️ {ESTIMATION_DISCLAIMER_SHORT}
          </Chip>
        </View>
      </Surface>

      {/* Tarjetas principales */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        Acciones rápidas
      </Text>

      {cards.map((card) => (
        <TouchableOpacity key={card.id} onPress={card.onPress} activeOpacity={0.8}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.cardIconContainer, { backgroundColor: card.color + '20' }]}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {card.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {card.description}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 20 }}>›</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Nota legal */}
      <MessageBanner variant="warning" title="Aviso Legal" style={styles.legalCard}>
        Esta aplicación proporciona ESTIMACIONES con fines informativos únicamente.
        Los cálculos se basan en la Ley del Seguro Social de 1973 y valores de referencia (UMA, SMG).
        La resolución oficial de su pensión corresponde exclusivamente al IMSS.
        Acuda a su Subdelegación del IMSS para información precisa y oficial.
      </MessageBanner>

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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
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
    borderLeftColor: COLORS.accent,
  },
  infoCard: {
    borderRadius: 12,
    marginBottom: 20,
  },
});
