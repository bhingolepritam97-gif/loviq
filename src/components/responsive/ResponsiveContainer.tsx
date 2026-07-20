import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { useBreakpoints, BREAKPOINTS } from '../../context/ResponsiveContext';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  maxWidth?: number;
  center?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth = BREAKPOINTS.smallTablet, // Default max width centers content on tablets/desktop
  center = true,
  ...props
}) => {
  const { isPhone } = useBreakpoints();

  return (
    <View style={[styles.wrapper, center && styles.centerWrapper]} {...props}>
      <View
        style={[
          styles.inner,
          !isPhone && { maxWidth, width: '100%' },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
  },
  centerWrapper: {
    alignItems: 'center',
    ...(Platform.OS === 'web' && { marginHorizontal: 'auto' }),
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
