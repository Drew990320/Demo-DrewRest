import { StyleSheet, View } from 'react-native';
import { IconTooltipButton } from './IconTooltipButton';
import {
  CATEGORIA_MENU_ICONOS,
  type CategoriaMenuIconId,
} from '../lib/categoria-menu-icon';

type Props = {
  value: CategoriaMenuIconId;
  onChange: (icon: CategoriaMenuIconId) => void;
  disabled?: boolean;
};

export function CategoriaIconPicker({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {CATEGORIA_MENU_ICONOS.map((item) => {
        const active = value === item.id;
        return (
          <IconTooltipButton
            key={item.id}
            iconSet="material-community"
            icon={item.id}
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
