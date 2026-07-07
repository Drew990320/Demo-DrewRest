import { createElement, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { uploadVisualAsset } from '../lib/api-upload';
import { esArchivoImagenLogo } from '../lib/logo-image-upload';
import { notifyConfigUpdated } from '../lib/config-sync';
import { useVisualTheme } from '../context/VisualThemeContext';
import type { VisualAssetTipo } from '../lib/visual-theme';
import { colors } from '../lib/theme';

type Props = {
  token: string | null;
  tipo: VisualAssetTipo;
  label: string;
  tieneAsset: boolean;
  disabled?: boolean;
  onUploaded: () => void;
  onError: (error: unknown) => void;
};

const ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.webp,.ico';

function esArchivoVisualAceptado(file: File): boolean {
  if (esArchivoImagenLogo(file)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.ico');
}

export function VisualAssetDropzone({
  token,
  tipo,
  label,
  tieneAsset,
  disabled,
  onUploaded,
  onError,
}: Props) {
  const { assetUrl, reload, colors: themeColors } = useVisualTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [remoteBroken, setRemoteBroken] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRemoteBroken(false);
    if (!tieneAsset) {
      setLocalPreview((p) => {
        if (p) URL.revokeObjectURL(p);
        return null;
      });
      setInputKey((k) => k + 1);
    }
  }, [tieneAsset]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const subir = useCallback(
    async (file: File) => {
      if (!esArchivoVisualAceptado(file)) {
        onError(new Error('Usa PNG, JPEG, WebP o ICO'));
        return;
      }
      if (uploading) return;

      const blob = URL.createObjectURL(file);
      setLocalPreview((p) => {
        if (p) URL.revokeObjectURL(p);
        return blob;
      });
      setRemoteBroken(false);
      setUploading(true);
      try {
        await uploadVisualAsset(
          token,
          tipo,
          file,
          file.name || `asset-${tipo}.png`,
        );
        setInputKey((k) => k + 1);
        notifyConfigUpdated('visual');
        await reload();
        setLocalPreview((p) => {
          if (p) URL.revokeObjectURL(p);
          return null;
        });
        onUploaded();
      } catch (e) {
        setLocalPreview((p) => {
          if (p) URL.revokeObjectURL(p);
          return null;
        });
        onError(e);
      } finally {
        setUploading(false);
      }
    },
    [token, tipo, onUploaded, onError, reload, uploading],
  );

  const remote = tieneAsset && !localPreview ? assetUrl(tipo) : null;
  const preview = localPreview ?? (remoteBroken ? null : remote);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativeBox}>
        <Text style={styles.nativeTitle}>{label}</Text>
        <Text style={styles.nativeHint}>
          Sube este archivo desde la versión web en el PC.
        </Text>
      </View>
    );
  }

  const dropStyle: CSSProperties = {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: dragOver ? themeColors.primary : themeColors.border,
    borderRadius: 12,
    backgroundColor: dragOver ? themeColors.primaryLight : themeColors.surface,
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
    cursor: disabled || uploading ? 'not-allowed' : 'pointer',
    opacity: disabled || uploading ? 0.6 : 1,
    width: '100%',
    boxSizing: 'border-box',
  };

  return createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 } },
    createElement('span', { style: { fontSize: 13, fontWeight: 600, color: themeColors.text } }, label),
    createElement(
      'div',
      {
        style: dropStyle,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        },
        onClick: () => {
          if (!disabled && !uploading) inputRef.current?.click();
        },
        onDragEnter: (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragOver(true);
        },
        onDragOver: (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragOver(true);
        },
        onDragLeave: (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (disabled || uploading) return;
          const file = e.dataTransfer?.files?.[0];
          if (file) void subir(file);
        },
      },
      uploading
        ? createElement(ActivityIndicator, { color: themeColors.primary })
        : preview
          ? createElement('img', {
              key: remote ?? localPreview ?? tipo,
              src: preview,
              alt: label,
              style: {
                maxHeight: 80,
                maxWidth: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              },
              onError: () => {
                if (!localPreview) setRemoteBroken(true);
              },
            })
          : createElement('span', { style: { fontSize: 28 } }, '🖼'),
      createElement(
        'span',
        {
          style: { fontSize: 12, color: themeColors.textMuted, textAlign: 'center' },
        },
        uploading ? 'Subiendo…' : 'Arrastra o haz clic · máx. 5 MB',
      ),
      createElement('input', {
        key: inputKey,
        ref: inputRef,
        type: 'file',
        accept: ACCEPT,
        style: { display: 'none' },
        onChange: (e: Event) => {
          const input = e.target as HTMLInputElement;
          const file = input.files?.[0];
          input.value = '';
          if (file) void subir(file);
        },
      }),
    ),
  );
}

const styles = StyleSheet.create({
  nativeBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  nativeTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  nativeHint: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
