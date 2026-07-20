import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoints } from './useBreakpoints';
import { CONTAINER_MAX_WIDTHS, CONTAINER_H_PADDING } from './breakpoints';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  /**
   * Override the automatic max-width derived from the current breakpoint.
   */
  maxWidth?: number;
  /**
   * Override horizontal padding (both sides).
   * Defaults to the breakpoint-driven value from CONTAINER_H_PADDING.
   */
  horizontalPadding?: number;
  /**
   * When true (default), the inner content is centered horizontally.
   * Set to false for left-aligned layouts.
   */
  centered?: boolean;
  /**
   * Apply safe-area insets automatically.
   * Defaults to true so all screens are notch-safe without extra effort.
   */
  safeArea?: boolean;
  /**
   * Override safe-area sides. Defaults to all four sides when safeArea=true.
   */
  safeAreaEdges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  /**
   * Extra style applied to the outer (full-width) wrapper.
   */
  wrapperStyle?: StyleProp<ViewStyle>;
  /**
   * Extra style applied to the inner (max-width constrained) view.
   */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResponsiveContainer
 *
 * The single layout wrapper that every screen and section should use.
 * Automatically provides:
 *   • Breakpoint-driven max-width capping
 *   • Horizontal padding that scales with screen size
 *   • Horizontal centering for tablet / desktop
 *   • Safe-area inset padding (opt-out with safeArea={false})
 *   • Web margin:auto centering
 *
 * @example
 * <ResponsiveContainer>
 *   <Text>Content</Text>
 * </ResponsiveContainer>
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  horizontalPadding,
  centered = true,
  safeArea = true,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  wrapperStyle,
  style,
  ...props
}) => {
  const { breakpoint, isPhone } = useBreakpoints();
  const insets = useSafeAreaInsets();

  const resolvedMaxWidth = maxWidth ?? CONTAINER_MAX_WIDTHS[breakpoint];
  const resolvedHPadding = horizontalPadding ?? CONTAINER_H_PADDING[breakpoint];

  // Build safe-area padding overrides
  const safeAreaPadding: ViewStyle = safeArea
    ? {
        paddingTop:    safeAreaEdges.includes('top')    ? insets.top    : 0,
        paddingBottom: safeAreaEdges.includes('bottom') ? insets.bottom : 0,
        paddingLeft:   safeAreaEdges.includes('left')   ? insets.left   : 0,
        paddingRight:  safeAreaEdges.includes('right')  ? insets.right  : 0,
      }
    : {};

  return (
    <View
      style={[
        styles.wrapper,
        centered && styles.wrapperCentered,
        wrapperStyle,
      ]}
    >
      <View
        style={[
          styles.inner,
          // Only cap max-width on non-phone screens
          !isPhone && { maxWidth: resolvedMaxWidth },
          { paddingHorizontal: resolvedHPadding },
          safeAreaPadding,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
  },
  wrapperCentered: {
    alignItems: 'center',
    // Web only: margin:auto horizontally centres within the browser viewport
    ...(Platform.OS === 'web' ? { marginHorizontal: 'auto' as any } : {}),
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
