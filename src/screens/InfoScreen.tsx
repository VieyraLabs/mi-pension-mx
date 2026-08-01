/**
 * Pantalla informativa sobre la Ley 73 y conceptos relacionados.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card, List, useTheme, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { INFO_LEY73 } from '../constants/infoLegal';

export default function InfoScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.primary }]} elevation={3}>
        <Card.Content style={{ alignItems: 'center', padding: 20 }}>
          <Text variant="headlineSmall" style={{ color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }}>
            📚 Información Ley 73
          </Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 }}>
            Todo lo que necesitas saber sobre la Ley del Seguro Social de 1973
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          {INFO_LEY73.map((seccion) => (
            <List.Accordion
              key={seccion.id}
              title={seccion.titulo}
              expanded={expanded === seccion.id}
              onPress={() => setExpanded(expanded === seccion.id ? null : seccion.id)}
              titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 14 }}
              style={{ backgroundColor: 'transparent' }}
            >
              <Divider />
              {seccion.contenido.map((parrafo, i) => (
                <Text
                  key={i}
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurface, lineHeight: 20, marginVertical: 6, paddingHorizontal: 16 }}
                >
                  {parrafo}
                </Text>
              ))}
              {seccion.fuente && (
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 8, paddingHorizontal: 16, fontStyle: 'italic' }}>
                  Fuente: {seccion.fuente}
                </Text>
              )}
              <Divider style={{ marginTop: 8 }} />
            </List.Accordion>
          ))}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
        <Card.Content>
          <Text variant="bodySmall" style={{ color: '#795548', lineHeight: 18 }}>
            ⚖️ La información presentada es de carácter educativo e informativo. Para obtener asesoría oficial sobre tu pensión, acude a la Subdelegación del IMSS correspondiente o consulta el portal imss.gob.mx.
          </Text>
        </Card.Content>
      </Card>

      {/* Botón FAQ */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 4 }}>
            ¿Tienes más preguntas?
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Consulta las Preguntas Frecuentes en la sección FAQ.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { borderRadius: 16, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 16 },
});
