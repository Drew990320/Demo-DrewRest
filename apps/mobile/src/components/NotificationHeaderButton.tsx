import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationCenter } from '../context/NotificationCenterContext';
import { useVisualTheme } from '../context/VisualThemeContext';
import type { AppNotification } from '../lib/app-notifications';
import type { DialogVariant } from '../lib/app-dialog';
import { MOTION } from '../lib/motion';
import type { AppColors } from '../lib/theme';
import { statusFromAppColors } from '../lib/visual-theme';
import type { VisualLayoutTokens } from '@la-reserva/shared-domain/visual-style';

function variantColor(variant: DialogVariant, colors: AppColors): string {
  const st = statusFromAppColors(colors);
  switch (variant) {
    case 'success':
      return st.ok.accent;
    case 'error':
      return st.busy.accent;
    case 'warning':
      return st.warn.accent;
    default:
      return colors.primary;
  }
}

function createNotificationStyles(colors: AppColors, layout: VisualLayoutTokens) {
  const cardBorder =
    layout.cardBorderWidth > 0 ? layout.cardBorderWidth : StyleSheet.hairlineWidth;

  return StyleSheet.create({
    btn: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.danger,
      borderWidth: 2,
      borderColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: colors.onPrimary,
      fontSize: 10,
      fontWeight: '900',
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    panelBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${colors.text}59`,
    },
    panel: {
      backgroundColor: colors.background,
      borderTopLeftRadius: layout.radiusLg,
      borderTopRightRadius: layout.radiusLg,
      borderWidth: cardBorder,
      borderColor: colors.border,
      borderBottomWidth: 0,
      minHeight: 220,
      maxHeight: '78%',
      zIndex: 2,
      ...Platform.select({
        web: { boxShadow: `0 -4px 24px ${colors.text}1F` } as object,
        default: {},
      }),
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: layout.titleWeight,
      color: colors.text,
    },
    panelActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    panelActionText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    list: {
      flexGrow: 0,
      flexShrink: 1,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: layout.radiusMd,
      marginBottom: 6,
      backgroundColor: colors.surface,
      borderWidth: cardBorder,
      borderColor: colors.borderLight,
    },
    rowUnread: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primaryMuted,
    },
    rowDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    rowBody: { flex: 1 },
    rowTitle: {
      fontWeight: '800',
      fontSize: 15,
      color: colors.text,
    },
    rowMessage: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    rowTime: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: '600',
      color: colors.textHint,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    emptyText: {
      color: colors.textHint,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationRow({
  item,
  styles,
  colors,
}: {
  item: AppNotification;
  styles: ReturnType<typeof createNotificationStyles>;
  colors: AppColors;
}) {
  const accent = variantColor(item.variant, colors);
  return (
    <View style={[styles.row, !item.read && styles.rowUnread]}>
      <View style={[styles.rowDot, { backgroundColor: accent }]} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {!!item.message?.trim() && (
          <Text style={styles.rowMessage}>{item.message}</Text>
        )}
        <Text style={styles.rowTime}>{formatHora(item.createdAt)}</Text>
      </View>
    </View>
  );
}

/** Campana de notificaciones en el header (no flota sobre el contenido). */
export function NotificationHeaderButton() {
  const insets = useSafeAreaInsets();
  const { colors, layout } = useVisualTheme();
  const styles = useMemo(
    () => createNotificationStyles(colors, layout),
    [colors, layout],
  );
  const {
    notifications,
    unreadCount,
    panelOpen,
    openPanel,
    closePanel,
    clearAll,
  } = useNotificationCenter();

  return (
    <>
      <Pressable
        onPress={openPanel}
        style={styles.btn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
      >
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={24}
          color={colors.text}
        />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={panelOpen}
        transparent
        animationType="fade"
        onRequestClose={closePanel}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.panelBackdrop}
            onPress={closePanel}
            accessibilityRole="button"
            accessibilityLabel="Cerrar notificaciones"
          />
          <Animated.View
            entering={FadeInUp.duration(MOTION.normal).springify()}
            style={[
              styles.panel,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Notificaciones</Text>
              <View style={styles.panelActions}>
                {notifications.length > 0 ? (
                  <Pressable onPress={clearAll} hitSlop={8}>
                    <Text style={styles.panelActionText}>Limpiar</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={closePanel} hitSlop={8}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color={colors.textHint}
                />
                <Text style={styles.emptyText}>No hay notificaciones</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {notifications.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
