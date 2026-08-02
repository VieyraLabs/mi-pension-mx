/**
 * Navegador raíz de la aplicación.
 * Usa React Navigation con Bottom Tabs y Stack Navigator.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import NewSimulationScreen from '../screens/NewSimulationScreen';
import ResultScreen from '../screens/ResultScreen';
import SimulatorScreen from '../screens/SimulatorScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InfoScreen from '../screens/InfoScreen';
import FAQScreen from '../screens/FAQScreen';
import PdfImportScreen from '../screens/PdfImportScreen';
import ValidationScreen from '../screens/ValidationScreen';
import type { DatosImportadosSimulacion } from '../models';

// ─────────────────────────────────────────────
// Tipos de rutas
// ─────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  NewSimulation: { datosImportados?: DatosImportadosSimulacion } | undefined;
  Result: { simulacionId?: string };
  PdfImport: undefined;
  Validation: { textoExtraido: string };
  FAQ: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Simulator: undefined;
  History: undefined;
  Info: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Simulator"
        component={SimulatorScreen}
        options={{
          title: 'Simular',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calculator" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Info"
        component={InfoScreen}
        options={{
          title: 'Info',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="information" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewSimulation"
        component={NewSimulationScreen}
        options={{ title: 'Nueva Simulación' }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Resultado de Pensión' }}
      />
      <Stack.Screen
        name="PdfImport"
        component={PdfImportScreen}
        options={{ title: 'Importar Constancia IMSS' }}
      />
      <Stack.Screen
        name="Validation"
        component={ValidationScreen}
        options={{ title: 'Validar Datos Importados' }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ title: 'Preguntas Frecuentes' }}
      />
    </Stack.Navigator>
  );
}
