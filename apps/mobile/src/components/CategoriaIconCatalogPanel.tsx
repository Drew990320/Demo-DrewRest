import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CATEGORIA_MENU_ICON_CATEGORIAS,
  type CategoriaMenuIconId,
} from '@la-reserva/shared-domain/categoria-menu-icon';
import { useVisualTheme } from '../context/VisualThemeContext';
import {
  NAV_ICON_PICKER_WIDTH,
  RESUMEN_TOOLS_RAIL_WIDTH,
} from '../lib/layout-constants';
import { IconTooltipButton } from './IconTooltipButton';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  visible: boolean;
  value: CategoriaMenuIconId;
  targetLabel?: string;
  onChange: (icon: CategoriaMenuIconId) => void;
  onClose: () => void;
  presentation: 'drawer' | 'modal';
};

function CatalogBody({
  value,
  targetLabel,
  onChange,
  onClose,
}: Omit<Props, 'visible' | 'presentation'>) {
  const { colors } = useVisualTheme();

  return (
    <>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Elegir icono
          </Text>
          {targetLabel ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {targetLabel}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector de iconos"
        >
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIA_MENU_ICON_CATEGORIAS.map((cat) => (
          <View key={cat.id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {cat.titulo}
            </Text>
            <View style={styles.iconGrid}>
              {cat.iconos.map((item) => {
                const active = value === item.id;
                return (
                  <IconTooltipButton
                    key={item.id}
                    iconSet="material-community"
                    icon={item.id as MciName}
                    label={item.label}
                    variant={active ? 'primary' : 'default'}
                    fixedSize
                    size={22}
                    onPress={() => onChange(item.id)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

/** Catálogo de iconos de categoría (Material Community) agrupados por tema. */
export function CategoriaIconCatalogPanel({
  visible,
  value,
  targetLabel,
  onChange,
  onClose,
  presentation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useVisualTheme();

  if (!visible) return null;

  if (presentation === 'modal') {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginTop: Math.max(insets.top, 16),
                marginBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <CatalogBody
              value={value}
              targetLabel={targetLabel}
              onChange={onChange}
              onClose={onClose}
            />
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <View
      style={[
        styles.drawer,
        {
          width: NAV_ICON_PICKER_WIDTH,
          right: RESUMEN_TOOLS_RAIL_WIDTH,
          backgroundColor: colors.surface,
          borderLeftColor: colors.border,
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <CatalogBody
        value={value}
        targetLabel={targetLabel}
        onChange={onChange}
        onClose={onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 30,
    borderLeftWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { boxShadow: '-4px 0 16px rgba(61,54,48,0.08)' } as object,
      default: {},
    }),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalSheet: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, lineHeight: 16 },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
  },
  pressed: { opacity: 0.75 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
  },
  section: { gap: 8, paddingTop: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
