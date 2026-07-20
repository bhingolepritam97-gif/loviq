import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoints } from './useBreakpoints';
import { CONTAINER_MAX_WIDTHS, CONTAINER_H_PADDING } from './breakpoints';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ResponsiveScreenProps {
  children: React.ReactNode;
  /**
   * When true the content is wrapped in a ScrollView.
   * @default false
   */
  scrollable?: boolean;
  /**
   * When true wraps the entire screen in KeyboardAvoidingView.
   * @default false
   */
  keyboardAvoiding?: boolean;
  /**
   * Background color of the outermost view.
   * @default 'transparent'
   */
  backgroundColor?: string;
  /**
   * Override the max-width cap derived from the current breakpoint.
   */
  maxWidth?: number;
  /**
   * Override horizontal padding.
   */
  horizontalPadding?: number;
  /**
   * Additional style on the outer (full-bleed) container.
   */
  outerStyle?: StyleProp<ViewStyle>;
  /**
   * Additional style on the inner (max-width constrained) container.
   */
  innerStyle?: StyleProp<ViewStyle>;
  /**
   * Props forwarded to the ScrollView when scrollable=true.
   */
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
  /**
   * Disable top safe-area padding.
   * @default false
   */
  disableTopSafeArea?: boolean;
  /**
   * Disable bottom safe-area padding.
   * @default false
   */
  disableBottomSafeArea?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResponsiveScreen
 *
 * The top-level wrapper for any full screen. Combines:
 *   • KeyboardAvoidingView (optional)
 *   • Safe-area insets (top & bottom, individually disableable)
 *   • Breakpoint-driven max-width + horizontal padding
 *   • Optional ScrollView with proper contentContainerStyle
 *   • Web horizontal centering
 *
 * Use this as the outermost element of a screen component instead of
 * combining <KeyboardAvoidingView>, <SafeAreaView>, <ScrollView>, and
 * <View maxWidth={...}> manually.
 *
 * @example — Simple non-scrollable screen
 * export default function MyScreen() {
 *   return (
 *     <ResponsiveScreen backgroundColor="#14051A">
 *       <Text>Hello</Text>
 *     </ResponsiveScreen>
 *   );
 * }
 *
 * @example — Scrollable + keyboard-avoiding form screen
 * export default function FormScreen() {
 *   return (
 *     <ResponsiveScreen scrollable keyboardAvoiding backgroundColor="#14051A">
 *       <TextInput />
 *       <Button />
 *     </ResponsiveScreen>
 *   );
 * }
 */
export const ResponsiveScreen: React.FC<ResponsiveScreenProps> = ({
  children,
  scrollable = false,
  keyboardAvoiding = false,
  backgroundColor = 'transparent',
  maxWidth,
  horizontalPadding,
  outerStyle,
  innerStyle,
  scrollViewProps,
  disableTopSafeArea = false,
  disableBottomSafeArea = false,
}) => {
  const { breakpoint, isPhone } = useBreakpoints();
  const insets = useSafeAreaInsets();

  const resolvedMaxWidth    = maxWidth          ?? CONTAINER_MAX_WIDTHS[breakpoint];
  const resolvedHPadding    = horizontalPadding ?? CONTAINER_H_PADDING[breakpoint];

  const safeAreaStyle: ViewStyle = {
    paddingTop:    disableTopSafeArea    ? 0 : insets.top,
    paddingBottom: disableBottomSafeArea ? 0 : insets.bottom,
  };

  // ── Inner content view (max-width constrained) ────────────────────────────
  const innerContent = (
    <View
      style={[
        styles.inner,
        !isPhone && { maxWidth: resolvedMaxWidth, alignSelf: 'center' },
        { paddingHorizontal: resolvedHPadding },
        safeAreaStyle,
        innerStyle,
      ]}
    >
      {children}
    </View>
  );

  // ── Outer (full-bleed) wrapper ────────────────────────────────────────────
  const outer = scrollable ? (
    <ScrollView
      style={[styles.scrollOuter, { backgroundColor }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {innerContent}
    </ScrollView>
  ) : (
    <View style={[styles.outer, { backgroundColor }, outerStyle]}>
      {innerContent}
    </View>
  );

  // ── KeyboardAvoidingView wrapper ──────────────────────────────────────────
  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {outer}
      </KeyboardAvoidingView>
    );
  }

  return outer;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  outer: {
    flex: 1,
    width: '100%',
  },
  scrollOuter: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
