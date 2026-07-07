import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  NAV_APP_ICONOS,
  type NavAppIconId,
} from '@la-reserva/shared-domain/nav-app-icon';
import { IconTooltipButton } from './IconTooltipButton';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  value: NavAppIconId;
  onChange: (icon: NavAppIconId) => void;
  disabled?: boolean;
};

export function NavIconPicker({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {NAV_APP_ICONOS.map((item) => {
        const active = value === item.id;
        return (
          <IconTooltipButton
            key={item.id}
            iconSet="ionicons"
            icon={item.id as IonName}
            label={item.label}
            variant={active ? 'primary' : 'secondary'}
            fixedSize
            size={22}
            disabled={disabled}
            onPress={() => onChange(item.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
});
