import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVisualTheme } from '../context/VisualThemeContext';
import { AdminIcon } from '../lib/app-icons';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';
import { AppNavChrome } from './AppNavChrome';
import { IconTooltipButton } from './IconTooltipButton';

export type PersonalizacionPickerTab = 'iconos' | 'iconos_accion' | 'categorias' | null;

type Props = {
  saving: boolean;
  onGuardar: () => void;
  onRestablecer: () => void;
  pickerTab: PersonalizacionPickerTab;
  selectedPickerLabel: string | null;
  pickerOpen: boolean;
  onTogglePicker: () => void;
};

const PICKER_SECTION_TITLE: Record<Exclude<PersonalizacionPickerTab, null>, string> = {
  iconos: 'Iconos nav',
  iconos_accion: 'Iconos sistema',
  categorias: 'Categorías',
};

/** Barra derecha: guardar, restablecer y selector de iconos. */
export function PersonalizacionVisualToolsRail({
  saving,
  onGuardar,
  onRestablecer,
  pickerTab,
  selectedPickerLabel,
  pickerOpen,
  onTogglePicker,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useVisualTheme();
  const puedeElegirIcono = !!pickerTab && !!selectedPickerLabel;

  return (
    <AppNavChrome
      style={[
        styles.rail,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 12),
          borderLeftColor: colors.border,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Apariencia
          </Text>
          <View style={styles.actionsCol}>
            <IconTooltipButton
              icon={AdminIcon.guardar}
              label={saving ? 'Guardando…' : 'Guardar cambios'}
              variant="primary"
              disabled={saving}
              onPress={onGuardar}
              fixedSize
              size={26}
            />
            <IconTooltipButton
              icon={AdminIcon.restablecer}
              label={saving ? 'Restableciendo…' : 'Restablecer fábrica'}
              variant="danger"
              disabled={saving}
              onPress={onRestablecer}
              fixedSize
              size={26}
            />
          </View>
        </View>

        {pickerTab ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {PICKER_SECTION_TITLE[pickerTab]}
              </Text>
              <View style={styles.actionsCol}>
                <IconTooltipButton
                  icon={pickerOpen ? 'close-outline' : 'color-palette-outline'}
                  label={
                    pickerOpen
                      ? 'Cerrar selector'
                      : puedeElegirIcono
                        ? 'Seleccionar icono'
                        : 'Elige una fila'
                  }
                  variant={pickerOpen ? 'secondary' : puedeElegirIcono ? 'primary' : 'default'}
                  disabled={!puedeElegirIcono && !pickerOpen}
                  onPress={onTogglePicker}
                  fixedSize
                  size={26}
                />
              </View>
              {selectedPickerLabel ? (
                <Text
                  style={[styles.hint, { color: colors.textMuted }]}
                  numberOfLines={3}
                >
                  {pickerOpen
                    ? `Catálogo abierto para «${selectedPickerLabel}»`
                    : `Seleccionado: ${selectedPickerLabel}`}
                </Text>
              ) : (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Toca una fila del listado para elegir qué icono cambiar.
                </Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppNavChrome>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RESUMEN_TOOLS_RAIL_WIDTH,
    flexShrink: 0,
    alignSelf: 'stretch',
    borderLeftWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { boxShadow: '-2px 0 12px rgba(61,54,48,0.06)' } as object,
      default: {},
    }),
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    gap: 6,
  },
  section: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  actionsCol: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
    alignSelf: 'stretch',
  },
  hint: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});
