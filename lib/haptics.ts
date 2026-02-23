import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const canHaptic = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticLight() {
    if (canHaptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
}

export function hapticMedium() {
    if (canHaptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
}

export function hapticSuccess() {
    if (canHaptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
}

export function hapticError() {
    if (canHaptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
}
