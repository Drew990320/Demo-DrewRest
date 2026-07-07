import { createElement, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CachedRemoteImage } from './CachedRemoteImage';
import { uploadRestaurantLogo } from '../lib/api-upload';
import { esArchivoImagenLogo } from '../lib/logo-image-upload';
import { restaurantLogoUrl } from '../lib/restaurant-branding';
import { colors } from '../lib/theme';

type Props = {
  token: string | null;
  tieneLogo: boolean;
  logoArchivo: string | null;
  disabled?: boolean;
  onUploaded: (result: { logo_archivo: string; tiene_logo: boolean }) => void;
  onError: (error: unknown) => void;
};

const ACCEPT = 'image/png,image/jpeg,image/webp';

export function LogoUploadDropzone({
  token,
  tieneLogo,
  logoArchivo,
  disabled,
  onUploaded,
  onError,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    },
    [localPreviewUrl],
  );

  const subir = useCallback(
    async (file: File) => {
      if (!esArchivoImagenLogo(file)) {
        onError(new Error('Solo se admiten imágenes PNG, JPEG o WebP'));
        return;
      }
      const blobUrl = URL.createObjectURL(file);
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return blobUrl;
      });
      setUploading(true);
      try {
        const res = await uploadRestaurantLogo(token, file, file.name);
        onUploaded(res);
        setPreviewVersion((v) => v + 1);
      } catch (e) {
        onError(e);
      } finally {
        setUploading(false);
      }
    },
    [token, onUploaded, onError],
  );

  const remotePreviewUri =
    tieneLogo && previewVersion >= 0
      ? `${restaurantLogoUrl()}?v=${previewVersion}`
      : null;
  const previewUri = localPreviewUrl ?? remotePreviewUri;

  if (Platform.OS === 'web') {
    const dropStyle: CSSProperties = {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: dragOver ? colors.primary : colors.border,
      borderRadius: 12,
      backgroundColor: dragOver ? colors.primaryMuted : colors.surface,
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 6,
      cursor: disabled || uploading ? 'not-allowed' : 'pointer',
      opacity: disabled || uploading ? 0.6 : 1,
      boxSizing: 'border-box',
      width: '100%',
    };

    const previewStyle: CSSProperties = {
      width: '100%',
      maxWidth: 280,
      height: 120,
      objectFit: 'contain',
    };

    return createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
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
          ? createElement(ActivityIndicator, {
              key: 'spinner',
              color: colors.primary,
            })
          : previewUri
            ? createElement('img', {
                key: 'preview',
                src: previewUri,
                alt: 'Vista previa del logo',
                style: previewStyle,
              })
            : createElement(
                'span',
                { key: 'icon', style: { fontSize: 36 } },
                '🖼',
              ),
        createElement(
          'span',
          {
            key: 'title',
            style: {
              fontSize: 14,
              fontWeight: 600,
              color: colors.text,
              textAlign: 'center',
            },
          },
          uploading
            ? 'Subiendo…'
            : dragOver
              ? 'Suelta la imagen aquí'
              : 'Arrastra el logo o haz clic',
        ),
        createElement(
          'span',
          {
            key: 'hint',
            style: {
              fontSize: 12,
              color: colors.textMuted,
              textAlign: 'center',
            },
          },
          'PNG, JPEG o WebP · máx. 5 MB',
        ),
        createElement('input', {
          key: 'input',
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
      logoArchivo
        ? createElement(
            'span',
            {
              style: { fontSize: 12, color: colors.textMuted },
            },
            `Archivo: ${logoArchivo}`,
          )
        : null,
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dropzone}>
        {uploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : previewUri ? (
          <CachedRemoteImage
            uri={previewUri}
            style={styles.preview}
            accessibilityLabel="Vista previa del logo"
          />
        ) : (
          <Text style={styles.icon}>🖼</Text>
        )}
        <Text style={styles.title}>Logo del restaurante</Text>
        <Text style={styles.hintNative}>
          Para subir un logo, usa la versión web en el PC del restaurante.
        </Text>
      </View>
      {logoArchivo ? (
        <Text style={styles.archivo}>Archivo: {logoArchivo}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  preview: {
    width: '100%',
    maxWidth: 280,
    height: 120,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  archivo: {
    fontSize: 12,
    color: colors.textMuted,
  },
  hintNative: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
