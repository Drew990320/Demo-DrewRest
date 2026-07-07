import { Image, type ImageContentFit, type ImageProps } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
  onError?: () => void;
  onLoad?: ImageProps['onLoad'];
};

/** Imagen remota con caché en disco (logos, navbar, etc.). */
export function CachedRemoteImage({
  uri,
  style,
  contentFit = 'contain',
  accessibilityLabel,
  onError,
  onLoad,
}: Props) {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      accessibilityLabel={accessibilityLabel}
      onError={onError}
      onLoad={onLoad}
    />
  );
}
