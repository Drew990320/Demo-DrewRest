import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationCenter } from '../context/NotificationCenterContext';
import type { AppNotification } from '../lib/app-notifications';
import type { DialogVariant } from '../lib/app-dialog';
import { appShadow } from '../lib/shadow';
import { MOTION } from '../lib/motion';
import { colors } from '../lib/theme';

function variantColor(variant: DialogVariant): string {
  switch (variant) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.danger;
    case 'warning':
      return colors.warning;
    default:
      return colors.info;
  }
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationRow({ item }: { item: AppNotification }) {
  const accent = variantColor(item.variant);
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

export function NotificationFab() {
  const insets = useSafeAreaInsets();
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
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 8 },
          appShadow('dialog'),
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
      >
        <Ionicons name="notifications" size={26} color={colors.onPrimary} />
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
        animationType="none"
        onRequestClose={closePanel}
      >
        <Pressable style={styles.panelBackdrop} onPress={closePanel}>
          <Animated.View
            entering={FadeIn.duration(MOTION.fast)}
            exiting={FadeOut.duration(MOTION.fast)}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
        <Animated.View
          entering={FadeInUp.duration(MOTION.normal).springify()}
          style={[
            styles.panel,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: '78%',
            },
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
              <Ionicons name="notifications-off-outline" size={40} color={colors.textHint} />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(n) => n.id}
              renderItem={({ item }) => <NotificationRow item={item} />}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '900',
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 54, 48, 0.35)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
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
    fontWeight: '800',
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
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
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
