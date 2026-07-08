import { Image, type ImageContentFit, type ImageProps } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
  cachePolicy?: ImageProps['cachePolicy'];
  onError?: () => void;
  onLoad?: ImageProps['onLoad'];
};

/** Imagen remota con caché en disco (logos, navbar, etc.). */
export function CachedRemoteImage({
  uri,
  style,
  contentFit = 'contain',
  accessibilityLabel,
  cachePolicy = 'memory-disk',
  onError,
  onLoad,
}: Props) {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      transition={120}
      accessibilityLabel={accessibilityLabel}
      onError={onError}
      onLoad={onLoad}
    />
  );
}
