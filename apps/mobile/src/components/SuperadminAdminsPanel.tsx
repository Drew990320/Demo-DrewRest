import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DIAS_SEMANA_ACCESO,
  type HorarioAccesoDia,
} from '@la-reserva/shared-domain/horario-acceso-admin';
import {
  PERMISOS_ADMIN_KEYS,
  PERMISOS_ADMIN_LABELS,
  type PermisosAdminConfig,
} from '@la-reserva/shared-domain/permisos-admin';
import { FormModal } from './FormModal';
import { ActionIconBar } from './ActionIconBar';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFormStyles } from '../lib/form-layout';
import { api } from '../lib/api';
import { AdminIcon } from '../lib/app-icons';
import { showNotice } from '../lib/app-dialog';
import { manejarErrorAccion } from '../lib/recurso-disponible';
import type { AppColors } from '../lib/theme';

type AdminDetalle = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo: boolean;
  horarios_acceso: HorarioAccesoDia[];
  permisos_admin: PermisosAdminConfig;
};

type Props = {
  token: string;
  admins: { id: number; nombre: string; apellido: string; email: string; activo: boolean }[];
  onChanged: () => Promise<void>;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    block: { marginTop: 20, gap: 10 },
    title: { fontWeight: '800', color: c.text, fontSize: 16 },
    hint: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderLight,
    },
    rowMain: { flex: 1, paddingRight: 8 },
    rowName: { fontWeight: '700', color: c.text },
    rowEmail: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    permRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    permLabel: { color: c.text, flex: 1, paddingRight: 8 },
    horarioRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    horarioDia: { width: 88, color: c.textMuted, fontSize: 12 },
    horarioInput: { flex: 1 },
  });
}

const HORARIO_VACIO: HorarioAccesoDia[] = DIAS_SEMANA_ACCESO.map((d) => ({
  dia_semana: d.id,
  hora_inicio: '08:00',
  hora_fin: '22:00',
}));

export function SuperadminAdminsPanel({ token, admins, onChanged }: Props) {
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activo, setActivo] = useState(true);
  const [permisos, setPermisos] = useState<PermisosAdminConfig>(() =>
    Object.fromEntries(PERMISOS_ADMIN_KEYS.map((k) => [k, true])) as PermisosAdminConfig,
  );
  const [horarios, setHorarios] = useState<HorarioAccesoDia[]>([]);
  const [usarHorario, setUsarHorario] = useState(false);

  const abrirNuevo = () => {
    setEditId(null);
    setNombre('');
    setApellido('');
    setEmail('');
    setPassword('');
    setActivo(true);
    setPermisos(
      Object.fromEntries(PERMISOS_ADMIN_KEYS.map((k) => [k, true])) as PermisosAdminConfig,
    );
    setHorarios([]);
    setUsarHorario(false);
    setModal(true);
  };

  const abrirEditar = useCallback(
    async (id: number) => {
      setBusy(true);
      try {
        const d = await api<AdminDetalle>(`/usuarios/admins/${id}`, { token });
        setEditId(id);
        setNombre(d.nombre === 'Administrador' ? '' : d.nombre);
        setApellido(d.apellido);
        setEmail(d.email);
        setPassword('');
        setActivo(d.activo);
        setPermisos(d.permisos_admin);
        setHorarios(d.horarios_acceso.length ? d.horarios_acceso : HORARIO_VACIO);
        setUsarHorario(d.horarios_acceso.length > 0);
        setModal(true);
      } catch (e) {
        await manejarErrorAccion(e, 'cargar administrador');
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  async function guardar() {
    if (!nombre.trim() || !email.trim()) {
      await showNotice('Datos incompletos', 'Nombre y correo son obligatorios.', 'warning');
      return;
    }
    if (!editId && password.length < 6) {
      await showNotice('Contraseña', 'Mínimo 6 caracteres.', 'warning');
      return;
    }
    setBusy(true);
    try {
      const horariosBody = usarHorario ? horarios : [];
      if (editId) {
        await api(`/usuarios/admins/${editId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            activo,
            ...(password ? { password } : {}),
            permisos,
            horarios: horariosBody,
          }),
        });
      } else {
        await api('/usuarios/admins', {
          method: 'POST',
          token,
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim().toLowerCase(),
            password,
            permisos,
            horarios: horariosBody,
          }),
        });
      }
      setModal(false);
      await onChanged();
      await showNotice('Guardado', 'Administrador actualizado.', 'success');
    } catch (e) {
      await manejarErrorAccion(e, 'guardar administrador');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Administradores del restaurante</Text>
      <Text style={styles.hint}>
        Solo el superadmin DrewTech puede crear admins, definir horarios de acceso y
        permisos por sección.
      </Text>
      <ActionIconBar
        actions={[
          {
            key: 'nuevo-admin',
            icon: 'person-add-outline',
            label: 'Nuevo administrador',
            variant: 'primary',
            disabled: busy,
            onPress: abrirNuevo,
          },
        ]}
      />
      {admins.map((a) => (
        <Pressable key={a.id} style={styles.row} onPress={() => void abrirEditar(a.id)}>
          <View style={styles.rowMain}>
            <Text style={styles.rowName}>
              {a.nombre} {a.apellido}
            </Text>
            <Text style={styles.rowEmail}>{a.email}</Text>
            <Text style={styles.rowEmail}>{a.activo ? 'Activo' : 'Inactivo'}</Text>
          </View>
          <Text style={{ color: '#2563eb', fontWeight: '700' }}>Editar</Text>
        </Pressable>
      ))}

      <FormModal
        visible={modal}
        title={editId ? 'Editar administrador' : 'Nuevo administrador'}
        onClose={() => !busy && setModal(false)}
        scroll
        footer={
          <ActionIconBar
            actions={[
              {
                key: 'cancel',
                icon: AdminIcon.cancelar,
                label: 'Cancelar',
                variant: 'secondary',
                disabled: busy,
                onPress: () => setModal(false),
              },
              {
                key: 'save',
                icon: AdminIcon.guardar,
                label: busy ? 'Guardando…' : 'Guardar',
                variant: 'primary',
                disabled: busy,
                onPress: () => void guardar(),
              },
            ]}
          />
        }
      >
        <TextInput
          style={formStyles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
          editable={!busy}
        />
        <TextInput
          style={formStyles.input}
          placeholder="Apellido"
          value={apellido}
          onChangeText={setApellido}
          editable={!busy}
        />
        <TextInput
          style={formStyles.input}
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!busy && !editId}
        />
        <TextInput
          style={formStyles.input}
          placeholder={editId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!busy}
        />
        {editId ? (
          <View style={styles.permRow}>
            <Text style={styles.permLabel}>Cuenta activa</Text>
            <Switch value={activo} onValueChange={setActivo} disabled={busy} />
          </View>
        ) : null}
        <Text style={[styles.title, { marginTop: 12, fontSize: 14 }]}>Permisos</Text>
        {PERMISOS_ADMIN_KEYS.map((k) => (
          <View key={k} style={styles.permRow}>
            <Text style={styles.permLabel}>{PERMISOS_ADMIN_LABELS[k]}</Text>
            <Switch
              value={permisos[k]}
              onValueChange={(v) => setPermisos((p) => ({ ...p, [k]: v }))}
              disabled={busy}
            />
          </View>
        ))}
        <View style={[styles.permRow, { marginTop: 8 }]}>
          <Text style={styles.permLabel}>Restringir horario de acceso</Text>
          <Switch value={usarHorario} onValueChange={setUsarHorario} disabled={busy} />
        </View>
        {usarHorario
          ? horarios.map((h, idx) => (
              <View key={h.dia_semana} style={styles.horarioRow}>
                <Text style={styles.horarioDia}>
                  {DIAS_SEMANA_ACCESO.find((d) => d.id === h.dia_semana)?.label}
                </Text>
                <TextInput
                  style={[formStyles.input, styles.horarioInput]}
                  value={h.hora_inicio}
                  onChangeText={(t) => {
                    const next = [...horarios];
                    next[idx] = { ...h, hora_inicio: t };
                    setHorarios(next);
                  }}
                  placeholder="08:00"
                />
                <TextInput
                  style={[formStyles.input, styles.horarioInput]}
                  value={h.hora_fin}
                  onChangeText={(t) => {
                    const next = [...horarios];
                    next[idx] = { ...h, hora_fin: t };
                    setHorarios(next);
                  }}
                  placeholder="22:00"
                />
              </View>
            ))
          : null}
      </FormModal>
    </View>
  );
}
