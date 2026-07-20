import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useBreakpoints } from './useBreakpoints';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ResponsiveStackProps extends ViewProps {
  children: React.ReactNode;
  /**
   * Stack direction on phone-sized screens.
   * @default 'column'
   */
  phoneDirection?: 'row' | 'column';
  /**
   * Stack direction on tablet-sized screens.
   * @default 'row'
   */
  tabletDirection?: 'row' | 'column';
  /**
   * Stack direction on desktop-sized screens.
   * @default 'row'
   */
  desktopDirection?: 'row' | 'column';
  /**
   * Gap between children in logical pixels.
   * @default 12
   */
  gap?: number;
  /**
   * Alignment of children along the cross axis.
   */
  align?: ViewStyle['alignItems'];
  /**
   * Alignment of children along the main axis.
   */
  justify?: ViewStyle['justifyContent'];
  /**
   * When true, children share space equally (flex: 1 on each child).
   * @default false
   */
  equalWidth?: boolean;
  /**
   * Wrap children when they overflow the main axis.
   * @default false
   */
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  childStyle?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResponsiveStack
 *
 * A layout primitive that changes flex direction based on screen size.
 * On phones it stacks vertically; on tablets and desktops it goes horizontal.
 * Both directions are individually configurable.
 *
 * @example — Button row that collapses to a column on mobile
 * <ResponsiveStack gap={12} align="center">
 *   <Button title="Cancel" />
 *   <Button title="Save" />
 * </ResponsiveStack>
 *
 * @example — Two-column card layout on tablet
 * <ResponsiveStack
 *   phoneDirection="column"
 *   tabletDirection="row"
 *   gap={24}
 *   equalWidth
 * >
 *   <ProfileCard />
 *   <StatsCard />
 * </ResponsiveStack>
 */
export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  phoneDirection = 'column',
  tabletDirection = 'row',
  desktopDirection = 'row',
  gap = 12,
  align,
  justify,
  equalWidth = false,
  wrap = false,
  style,
  childStyle,
  ...props
}) => {
  const { isPhone, isTablet } = useBreakpoints();

  const direction: 'row' | 'column' = isPhone
    ? phoneDirection
    : isTablet
    ? tabletDirection
    : desktopDirection;

  const items = React.Children.toArray(children);

  return (
    <View
      style={[
        styles.stack,
        {
          flexDirection: direction,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    >
      {items.map((child, index) => {
        const isLast = index === items.length - 1;
        const isRow = direction === 'row';

        return (
          <View
            key={index}
            style={[
              equalWidth && styles.equalChild,
              !isLast && {
                marginRight: isRow ? gap : 0,
                marginBottom: isRow ? 0 : gap,
              },
              childStyle,
            ]}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
  equalChild: {
    flex: 1,
  },
});
