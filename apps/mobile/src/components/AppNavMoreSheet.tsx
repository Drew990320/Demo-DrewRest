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
import { useVisualTheme } from '../context/VisualThemeContext';
import type { NavIconKey } from '@la-reserva/shared-domain/nav-app-icon';
import { MOTION } from '../lib/motion';

type IonName = ComponentProps<typeof Ionicons>['name'];

type MoreItem = {
  key: NavIconKey;
  label: string;
  href: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  mode?: 'admin' | 'mesero';
  modulos?: { modulo_meseros_operativos_activo?: boolean };
};

export function AppNavMoreSheet({
  visible,
  onClose,
  mode = 'admin',
  modulos,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { colors, navIcon } = useVisualTheme();

  const items: MoreItem[] = [
    { key: 'usuarios', label: 'Usuarios', href: '/(app)/usuarios' },
    { key: 'editar_menu', label: 'Editar menú', href: '/(app)/menu-admin' },
    { key: 'categorias', label: 'Días del menú', href: '/(app)/categorias-admin' },
    { key: 'mesas_admin', label: 'Gestionar mesas', href: '/(app)/mesas-admin' },
    {
      key: 'descuentos_promociones',
      label: 'Descuentos y promociones',
      href: '/(app)/descuentos-promociones',
    },
    { key: 'creditos', label: 'Créditos / fiados', href: '/(app)/creditos' },
    { key: 'personalizacion', label: 'Personalización visual', href: '/(app)/personalizacion-visual' },
    { key: 'configuracion', label: 'Configuración', href: '/(app)/configuracion' },
    { key: 'conexion', label: 'Conexión móvil', href: '/(app)/conexion-movil' },
    { key: 'permisos', label: 'Permisos', href: '/(app)/permisos' },
    ...(modulos?.modulo_meseros_operativos_activo !== false
      ? [{ key: 'turno' as const, label: 'Turno y beneficios', href: '/(app)/meseros-operativos' }]
      : []),
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
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderColor: colors.border }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.borderInput }]} />
        <Text style={[styles.title, { color: colors.text, borderBottomColor: colors.border }]}>
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
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { backgroundColor: colors.surfaceMuted },
                  ]}
                  onPress={() => go(item.href)}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name={navIcon(item.key)} size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
                </Pressable>
              ))
            : null}
          <Pressable
            style={({ pressed }) => [
              styles.row,
              styles.rowDanger,
              { borderTopColor: colors.border },
              pressed && { backgroundColor: colors.surfaceMuted },
            ]}
            onPress={() => void onLogout()}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name={navIcon('cuenta')} size={22} color={colors.danger} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.dangerText }]}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
        <Pressable style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]} onPress={onClose}>
          <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>Cerrar</Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  rowDanger: { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: { fontWeight: '700', fontSize: 15 },
});
