import { createElement, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { VisualColorKey } from '@la-reserva/shared-domain/nav-app-icon';
import {
  GRUPOS_VISTA_PALETA_APP,
  generarSugerenciasTemaDesdePrincipal,
  type ModoTemaVisual,
} from '../lib/visual-palette';
import {
  sugerirPaletasDesdeImagen,
  type PaletaSugerida,
} from '../lib/visual-palette-image';
import { paletteToAppColors } from '../lib/visual-theme';
import type { AppColors } from '../lib/theme';

type Props = {
  primaryColor: string;
  colors: AppColors;
  disabled?: boolean;
  onApply: (palette: Record<VisualColorKey, string>) => void;
};

function FullPalettePreview({
  palette,
  accent,
  borderColor,
  title,
  modo,
  onApply,
  disabled,
}: {
  palette: Record<VisualColorKey, string>;
  accent: string;
  borderColor: string;
  title: string;
  modo: ModoTemaVisual;
  onApply: () => void;
  disabled?: boolean;
}) {
  const appColors = useMemo(() => paletteToAppColors(palette), [palette]);
  const isDark = modo === 'oscuro';

  return (
    <Pressable
      onPress={onApply}
      disabled={disabled}
      style={({ pressed }) => [
        styles.previewCard,
        {
          borderColor,
          backgroundColor: appColors.surface,
        },
        pressed && !disabled && styles.previewCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.previewHeader}>
        <View
          style={[styles.accentDot, { backgroundColor: accent, borderColor }]}
        />
        <Text
          style={[styles.previewTitle, { color: appColors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View
          style={[
            styles.modoBadge,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#E4ECF5',
              borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.modoBadgeText,
              { color: isDark ? '#EDF3FA' : '#3D4F63' },
            ]}
          >
            {isDark ? 'Oscuro' : 'Claro'}
          </Text>
        </View>
      </View>

      {GRUPOS_VISTA_PALETA_APP.map((grupo) => (
        <View key={grupo.titulo} style={styles.grupo}>
          <Text style={[styles.grupoLabel, { color: appColors.textMuted }]}>
            {grupo.titulo}
          </Text>
          <View style={styles.swatchRow}>
            {grupo.keys.map((key) => {
              const hex = appColors[key as keyof AppColors];
              if (typeof hex !== 'string') return null;
              return (
                <View
                  key={key}
                  style={[styles.swatch, { backgroundColor: hex }]}
                  accessibilityLabel={key}
                />
              );
            })}
          </View>
        </View>
      ))}

      <Text style={[styles.applyHint, { color: appColors.primaryDark }]}>
        Toca para aplicar este tema
      </Text>
    </Pressable>
  );
}

function TemaSugeridoPar({
  accent,
  claro,
  oscuro,
  borderColor,
  titleBase,
  disabled,
  onApply,
}: {
  accent: string;
  claro: Record<VisualColorKey, string>;
  oscuro: Record<VisualColorKey, string>;
  borderColor: string;
  titleBase: string;
  disabled?: boolean;
  onApply: (palette: Record<VisualColorKey, string>) => void;
}) {
  return (
    <View style={styles.parWrap}>
      <FullPalettePreview
        palette={claro}
        accent={accent}
        borderColor={borderColor}
        title={`${titleBase} · tema claro`}
        modo="claro"
        disabled={disabled}
        onApply={() => onApply(claro)}
      />
      <FullPalettePreview
        palette={oscuro}
        accent={accent}
        borderColor={borderColor}
        title={`${titleBase} · tema oscuro`}
        modo="oscuro"
        disabled={disabled}
        onApply={() => onApply(oscuro)}
      />
    </View>
  );
}

export function VisualPaletteSuggestPanel({
  primaryColor,
  colors,
  disabled,
  onApply,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePalettes, setImagePalettes] = useState<PaletaSugerida[]>([]);

  const sugerencias = useMemo(
    () => generarSugerenciasTemaDesdePrincipal(primaryColor),
    [primaryColor],
  );

  async function onPickImage(file: File | undefined) {
    if (!file || disabled) return;
    setImageLoading(true);
    setImageError(null);
    setImagePalettes([]);
    try {
      const sugeridas = await sugerirPaletasDesdeImagen(file);
      if (!sugeridas.length) {
        setImageError(
          'No encontramos colores útiles en la imagen. Prueba con otra foto o logo.',
        );
        return;
      }
      setImagePalettes(sugeridas);
    } catch {
      setImageError('No se pudo analizar la imagen.');
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.text }]}>
        Paletas sugeridas (opcional)
      </Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Incluye marca, fondos, texto, estados (éxito, aviso, error), mesas y
        bordes. Elige tema claro u oscuro; después puedes afinar color por color.
      </Text>

      <TemaSugeridoPar
        accent={primaryColor}
        claro={sugerencias.claro}
        oscuro={sugerencias.oscuro}
        borderColor={colors.border}
        titleBase="Desde el color principal"
        disabled={disabled}
        onApply={onApply}
      />

      {Platform.OS === 'web' ? (
        <View style={styles.imageSection}>
          <Text style={[styles.subheading, { color: colors.text }]}>
            Desde una imagen
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Analizamos los tonos dominantes y proponemos parejas claro / oscuro
            para cada uno.
          </Text>
          <Pressable
            onPress={() => !disabled && inputRef.current?.click()}
            disabled={disabled || imageLoading}
            style={({ pressed }) => [
              styles.uploadBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
              pressed && !disabled && styles.uploadBtnPressed,
            ]}
          >
            {imageLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.uploadBtnText, { color: colors.primaryDark }]}>
                Elegir imagen…
              </Text>
            )}
          </Pressable>
          {imageError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {imageError}
            </Text>
          ) : null}
          {imagePalettes.map((item, index) => (
            <TemaSugeridoPar
              key={item.id}
              accent={item.muestra}
              claro={item.claro}
              oscuro={item.oscuro}
              borderColor={colors.border}
              titleBase={`Imagen · opción ${index + 1} (${item.muestra})`}
              disabled={disabled}
              onApply={onApply}
            />
          ))}
          {createElement('input', {
            ref: inputRef,
            type: 'file',
            accept:
              'image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp',
            style: { display: 'none' },
            onChange: (e: Event) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              input.value = '';
              void onPickImage(file);
            },
          })}
        </View>
      ) : (
        <Text style={[styles.nativeHint, { color: colors.textMuted }]}>
          Para extraer colores de una imagen, abre esta pantalla en la versión web
          del PC.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  parWrap: { gap: 10 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  previewCardPressed: { opacity: 0.92 },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  previewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  modoBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  grupo: { gap: 4 },
  grupoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  applyHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  imageSection: { gap: 8 },
  uploadBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    minWidth: 140,
    alignItems: 'center',
  },
  uploadBtnPressed: { opacity: 0.9 },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
  },
  nativeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
