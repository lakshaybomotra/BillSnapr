// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'printer': 'print',
  'printer.fill': 'print',
  'xmark.circle': 'cancel',
  'banknote': 'attach-money',
  'creditcard': 'credit-card',
  'qrcode': 'qr-code',
  'doc.text': 'article',
  'building.2': 'business',
  'rectangle.portrait.and.arrow.right': 'logout',
  'plus': 'add',
  'trash': 'delete',
  'magnifyingglass': 'search',
  'cart': 'shopping-cart',
  'person.fill': 'person',
  'list.bullet': 'list',
  'cube.box': 'inventory',
  'clock': 'schedule',
  'gear': 'settings',
  'cross': 'close',
  // Tab Bar Icons
  'cart.fill': 'shopping-cart',
  'list.bullet.rectangle.fill': 'receipt',
  'square.grid.2x2.fill': 'grid-view',
  'gearshape.fill': 'settings',
  'list.bullet.clipboard.fill': 'assignment',
  'plus.circle.fill': 'add-circle'
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
