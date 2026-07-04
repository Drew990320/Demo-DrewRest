import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NavIcon } from '../lib/app-icons';
import { MOTION } from '../lib/motion';
import { colors } from '../lib/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

type MoreItem = {
  key: string;
  icon: IonName;
  label: string;
  href: string;
  subtitle?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Admin: panel completo. Mesero: solo cerrar sesión. */
  mode?: 'admin' | 'mesero';
};

export function AppNavMoreSheet({ visible, onClose, mode = 'admin' }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const items: MoreItem[] = [
    { key: 'usuarios', icon: NavIcon.usuarios, label: 'Usuarios', href: '/(app)/usuarios' },
    { key: 'menu', icon: NavIcon.editarMenu, label: 'Editar menú', href: '/(app)/menu-admin' },
    { key: 'categorias', icon: NavIcon.diasMenu, label: 'Días del menú', href: '/(app)/categorias-admin' },
    { key: 'mesas-admin', icon: NavIcon.gestionarMesas, label: 'Gestionar mesas', href: '/(app)/mesas-admin' },
    { key: 'config', icon: NavIcon.configuracion, label: 'Configuración', href: '/(app)/configuracion' },
    { key: 'conexion', icon: NavIcon.conexionMovil, label: 'Conexión móvil', href: '/(app)/conexion-movil' },
    { key: 'permisos', icon: NavIcon.permisos, label: 'Permisos meseros', href: '/(app)/permisos' },
    {
      key: 'turno',
      icon: NavIcon.meserosOperativos,
      label: 'Turno y beneficios',
      href: '/(app)/meseros-operativos',
    },
  ];

  function go(href: string) {
    onClose();
    router.replace(href);
  }

  async function onLogout() {
    onClose();
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(MOTION.fast)}
          exiting={FadeOut.duration(MOTION.fast)}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
      <Animated.View
        entering={FadeInUp.duration(MOTION.normal).springify()}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>
          {mode === 'admin' ? 'Administración' : 'Tu cuenta'}
        </Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'admin'
            ? items.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => go(item.href)}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
                </Pressable>
              ))
            : null}
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowDanger, pressed && styles.rowPressed]}
            onPress={() => void onLogout()}
          >
            <View style={[styles.rowIcon, styles.rowIconDanger]}>
              <Ionicons name={NavIcon.cerrarSesion} size={22} color={colors.danger} />
            </View>
            <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Cerrar</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 54, 48, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderInput,
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scroll: { maxHeight: 420 },
  scrollContent: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowDanger: { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.dangerLight },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  rowLabelDanger: { color: colors.dangerText },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  closeBtnText: { fontWeight: '700', color: colors.textMuted, fontSize: 15 },
});
