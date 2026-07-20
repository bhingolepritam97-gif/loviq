import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useBreakpoints } from './useBreakpoints';
import { Breakpoint } from './breakpoints';

// ─── Column count map ────────────────────────────────────────────────────────

/**
 * Default column counts by breakpoint:
 *   phone        → 1
 *   smallTablet  → 2
 *   largeTablet  → 2
 *   desktop      → 3
 *   largeDesktop → 4
 *
 * These defaults are overridable via the `columns` prop.
 */
const DEFAULT_COLUMNS: Record<Breakpoint, number> = {
  phone:        1,
  smallTablet:  2,
  largeTablet:  2,
  desktop:      3,
  largeDesktop: 4,
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ResponsiveGridProps extends ViewProps {
  children: React.ReactNode;
  /**
   * Override columns for a specific breakpoint.
   * Partial — unspecified breakpoints use the defaults above.
   */
  columns?: Partial<Record<Breakpoint, number>>;
  /**
   * Gap between grid cells (applied both horizontally and vertically).
   * @default 12
   */
  gap?: number;
  /**
   * Extra style applied to the outer grid wrapper.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Extra style applied to each individual cell wrapper.
   */
  cellStyle?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResponsiveGrid
 *
 * Renders children in a CSS-style grid that automatically adjusts column
 * count based on the current breakpoint.
 *
 * Works by wrapping each child in a cell View whose width is calculated from
 * the column count and the gap size, exactly the same way CSS grid works.
 *
 * @example
 * <ResponsiveGrid gap={16}>
 *   <ProfileCard />
 *   <ProfileCard />
 *   <ProfileCard />
 * </ResponsiveGrid>
 *
 * @example — override per breakpoint
 * <ResponsiveGrid columns={{ phone: 1, desktop: 4, largeDesktop: 6 }}>
 *   ...
 * </ResponsiveGrid>
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap = 12,
  style,
  cellStyle,
  ...props
}) => {
  const { breakpoint } = useBreakpoints();

  const colCount =
    (columns && columns[breakpoint] != null
      ? columns[breakpoint]!
      : DEFAULT_COLUMNS[breakpoint]);

  // Flatten children so we can wrap each with a sized cell
  const items = React.Children.toArray(children);

  // Cell width as a percentage string accounting for gaps between columns.
  // Formula: (100% - gap * (cols-1)) / cols  →  simplified as a flex approach.
  // We use flex + marginRight + marginBottom because RN doesn't support CSS grid.
  const cellWidthPct = colCount === 1 ? '100%' : `${(100 / colCount).toFixed(4)}%`;

  return (
    <View
      style={[
        styles.grid,
        { gap: undefined }, // we manage spacing manually below
        style,
      ]}
      {...props}
    >
      {items.map((child, index) => {
        const isLastInRow = (index + 1) % colCount === 0;
        const isLastRow = index >= items.length - colCount;

        return (
          <View
            key={index}
            style={[
              {
                width: cellWidthPct as any,
                marginRight: isLastInRow ? 0 : gap,
                marginBottom: isLastRow ? 0 : gap,
              },
              cellStyle,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});

// ─── Utility hook ────────────────────────────────────────────────────────────

/**
 * useGridColumns
 *
 * Returns just the current column count for use in FlatList numColumns,
 * SectionList layouts, or any other component that needs the count directly.
 *
 * @example
 * const cols = useGridColumns();
 * <FlatList numColumns={cols} key={`grid-${cols}`} ... />
 */
export function useGridColumns(
  overrides?: Partial<Record<Breakpoint, number>>,
): number {
  const { breakpoint } = useBreakpoints();
  return overrides?.[breakpoint] ?? DEFAULT_COLUMNS[breakpoint];
}
