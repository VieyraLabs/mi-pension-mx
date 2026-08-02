/**
 * Pantalla de preguntas frecuentes (FAQ).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card, List, useTheme, Divider } from 'react-native-paper';
import { FAQ_ITEMS } from '../constants/infoLegal';
import { MessageBanner } from '../components/MessageBanner';

export default function FAQScreen() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.primary }]} elevation={3}>
        <Card.Content style={{ alignItems: 'center', padding: 20 }}>
          <Text variant="headlineSmall" style={{ color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }}>
            ❓ Preguntas Frecuentes
          </Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 }}>
            Respuestas a las preguntas más comunes sobre pensiones IMSS Ley 73
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          {FAQ_ITEMS.map((item) => (
            <List.Accordion
              key={item.id}
              title={item.title}
              expanded={expanded === item.id}
              onPress={() => setExpanded(expanded === item.id ? null : item.id)}
              titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 14 }}
              style={{ backgroundColor: 'transparent' }}
            >
              <Divider />
              {item.content.map((paragraph, i) => (
                <Text
                  key={i}
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurface, lineHeight: 20, marginVertical: 6, paddingHorizontal: 16 }}
                >
                  {paragraph}
                </Text>
              ))}
              {item.source && (
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 8, paddingHorizontal: 16, fontStyle: 'italic' }}>
                  Fuente: {item.source}
                </Text>
              )}
              <Divider style={{ marginTop: 8 }} />
            </List.Accordion>
          ))}
        </Card.Content>
      </Card>

      <MessageBanner variant="info" style={styles.card}>
        ¿No encontraste tu respuesta? Para información oficial y personalizada sobre tu pensión, acude a la Subdelegación del IMSS de tu zona o llama al 800 623 2323.
      </MessageBanner>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { borderRadius: 16, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 16 },
});
