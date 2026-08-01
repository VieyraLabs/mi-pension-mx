import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppTheme } from './src/theme/useAppTheme';

/** ErrorBoundary para mostrar errores de render en lugar de pantalla en blanco */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold', marginTop: 40 }}>
            ❌ Error de renderizado
          </Text>
          <Text style={{ color: '#333', marginTop: 12, fontSize: 13 }}>
            {this.state.error?.message}
          </Text>
          <Text style={{ color: '#666', marginTop: 12, fontSize: 11 }}>
            {this.state.error?.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

/**
 * Punto de entrada principal de la aplicación.
 * Configura los providers globales: SafeArea, Paper (MD3), Navigation.
 */
export default function App(): React.JSX.Element {
  const { theme, isDark } = useAppTheme();

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, minHeight: '100%' as any }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <NavigationContainer theme={theme as any}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <RootNavigator />
              </NavigationContainer>
            </PaperProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </View>
    </ErrorBoundary>
  );
}
