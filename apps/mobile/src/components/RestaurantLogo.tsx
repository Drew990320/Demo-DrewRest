import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  restaurantBrandingUrl,
  restaurantDisplayName,
  restaurantLogoUrl,
  type RestaurantBranding,
} from '../lib/restaurant-branding';
import { useVisualTheme } from '../context/VisualThemeContext';
import { CachedRemoteImage } from './CachedRemoteImage';

const DEFAULT_LOGO = require('../../assets/logo.png');

const FACTURA_BANNER_MAX_ALTO = 220;
const FACTURA_BANNER_MIN_ALTO = 72;

function calcFacturaBanner(
  panelW: number,
  srcW: number,
  srcH: number,
): { width: number; height: number } {
  const scale = Math.min(panelW / srcW, FACTURA_BANNER_MAX_ALTO / srcH);
  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(
      FACTURA_BANNER_MIN_ALTO,
      Math.round(srcH * scale),
    ),
  };
}

type Props = {
  compact?: boolean;
  /** login = pantalla de acceso; factura = cobro; default = branding general */
  variant?: 'login' | 'factura' | 'default';
};

function FacturaLogoBanner({
  uri,
  label,
  backgroundColor,
  onError,
}: {
  uri: string;
  label: string;
  backgroundColor: string;
  onError: () => void;
}) {
  const [panelWidth, setPanelWidth] = useState(0);
  const [bannerSize, setBannerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setBannerSize(null);
  }, [uri]);

  const onPanelLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== panelWidth) setPanelWidth(w);
  };

  const bannerHeight = bannerSize?.height ?? FACTURA_BANNER_MIN_ALTO;

  return (
    <View
      style={[
        styles.wrapFactura,
        {
          height: bannerHeight,
          backgroundColor,
        },
      ]}
      onLayout={onPanelLayout}
    >
      <CachedRemoteImage
        uri={uri}
        style={
          bannerSize
            ? { width: bannerSize.width, height: bannerSize.height }
            : styles.logoFacturaBanner
        }
        cachePolicy="none"
        accessibilityLabel={label}
        onError={onError}
        onLoad={(e) => {
          if (panelWidth <= 0) return;
          const srcW = e.source.width;
          const srcH = e.source.height;
          if (srcW > 0 && srcH > 0) {
            setBannerSize(calcFacturaBanner(panelWidth, srcW, srcH));
          }
        }}
      />
    </View>
  );
}

export function RestaurantLogo({ compact, variant = 'default' }: Props) {
  const { colors, assetUrl } = useVisualTheme();
  const [branding, setBranding] = useState<RestaurantBranding | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [variant]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(restaurantBrandingUrl());
        if (!res.ok) return;
        const data = (await res.json()) as RestaurantBranding;
        if (!cancelled) setBranding(data);
      } catch {
        /* sin API */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nombre = branding?.nombre?.trim() || restaurantDisplayName();

  const brandingLogoUri =
    branding?.tiene_logo ? restaurantLogoUrl() : null;

  const visualUri =
    variant === 'login'
      ? assetUrl('login')
      : variant === 'factura'
        ? (assetUrl('factura') ?? assetUrl('login'))
        : null;

  const brandingUri = variant === 'default' ? brandingLogoUri : null;

  const logoUri = visualUri ?? brandingUri;
  const showRemoteLogo = Boolean(logoUri) && !logoFailed;
  const showLocalLogo = !logoUri && !logoFailed;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  if (showRemoteLogo && variant === 'factura') {
    return (
      <FacturaLogoBanner
        uri={logoUri!}
        label={nombre}
        backgroundColor={colors.background}
        onError={() => setLogoFailed(true)}
      />
    );
  }

  const pageBg = { backgroundColor: colors.background };

  const wrapVariantStyle =
    variant === 'factura'
      ? styles.wrapFactura
      : variant === 'login'
        ? styles.wrapLogin
        : styles.wrap;

  const imageVariantStyle = compact ? styles.logoCompact : styles.logo;

  if (showRemoteLogo) {
    return (
      <View style={[wrapVariantStyle, pageBg]}>
        <CachedRemoteImage
          uri={logoUri!}
          style={imageVariantStyle}
          cachePolicy="none"
          accessibilityLabel={nombre}
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }

  if (showLocalLogo) {
    return (
      <View style={[wrapVariantStyle, pageBg]}>
        <Image
          source={DEFAULT_LOGO}
          style={imageVariantStyle}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityLabel={nombre}
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }

  if (variant === 'factura') {
    return (
      <View style={[wrapVariantStyle, pageBg]}>
        <Text
          style={[styles.nombreFactura, { color: colors.primary }]}
          accessibilityRole="header"
          numberOfLines={2}
        >
          {nombre}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.nombre,
          compact && styles.nombreCompact,
          { color: colors.primary },
        ]}
        accessibilityRole="header"
      >
        {nombre}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  wrapLogin: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  wrapFactura: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 200,
  },
  logoCompact: {
    width: 220,
    height: 150,
  },
  logoFacturaBanner: {
    width: '100%',
    height: '100%',
  },
  nombre: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  nombreCompact: {
    fontSize: 24,
  },
  nombreFactura: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
