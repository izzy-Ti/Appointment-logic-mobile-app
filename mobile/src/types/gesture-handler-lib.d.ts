declare module 'react-native-gesture-handler/lib/module/init' {
    export function initialize(): void;
}

declare module 'react-native-gesture-handler/lib/module/components/GestureHandlerRootView' {
    import type { ComponentType, PropsWithChildren } from 'react';
    import type { StyleProp, ViewStyle } from 'react-native';

    const GestureHandlerRootView: ComponentType<
        PropsWithChildren<{ style?: StyleProp<ViewStyle> }>
    >;
    export default GestureHandlerRootView;
}
