import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import {
  registerTicketPreviewHandler,
  unregisterTicketPreviewHandler,
  type TicketPreviewOptions,
} from '../lib/ticket-preview-registry';

type PreviewState = {
  html: string;
  titulo: string;
};

function WebTicketFrame({ html }: { html: string }) {
  if (Platform.OS !== 'web') {
    return (
      <Text style={{ padding: 16, textAlign: 'center' }}>
        La vista previa del ticket está disponible en la versión web de la demo.
      </Text>
    );
  }
  return (
    <iframe
      title="Vista previa ticket POS"
      srcDoc={html}
      style={{
        width: '100%',
        minHeight: 520,
        border: 'none',
        backgroundColor: '#e8e4df',
      }}
    />
  );
}

export function TicketPreviewProvider({ children }: { children: ReactNode }) {
  const { colors } = useVisualTheme();
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const close = useCallback(() => setPreview(null), []);

  const open = useCallback(async (html: string, opts?: TicketPreviewOptions) => {
    setPreview({
      html,
      titulo: opts?.titulo ?? 'Vista previa del ticket POS',
    });
  }, []);

  useEffect(() => {
    registerTicketPreviewHandler(open);
    return () => unregisterTicketPreviewHandler();
  }, [open]);

  const imprimirWeb = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !preview) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.open();
    ventana.document.write(preview.html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  return (
    <>
      {children}
      <Modal
        visible={preview != null}
        animationType="fade"
        transparent
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={[styles.panel, { backgroundColor: colors.surface }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                {preview?.titulo ?? 'Vista previa'}
              </Text>
              <Pressable onPress={close} hitSlop={12} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {preview ? <WebTicketFrame html={preview.html} /> : null}
            </ScrollView>
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {Platform.OS === 'web' ? (
                <Pressable
                  style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                  onPress={imprimirWeb}
                >
                  <Text style={styles.btnPrimaryText}>Guardar como PDF / Imprimir</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.btnSecondary, { borderColor: colors.border }]}
                onPress={close}
              >
                <Text style={[styles.btnSecondaryText, { color: colors.text }]}>
                  Cerrar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  panel: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '92%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    padding: 8,
  },
  footer: {
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnPrimary: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
