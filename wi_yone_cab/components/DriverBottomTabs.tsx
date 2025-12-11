import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';

const DRIVER_TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'drives', label: 'Drives', icon: 'directions-car' },
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'support', label: 'Support', icon: 'support-agent' },
];

interface DriverBottomTabsProps {
  active: string;
  onTabChange: (tab: string) => void;
}

export default function DriverBottomTabs({ active, onTabChange }: DriverBottomTabsProps) {
  const { colors } = useTheme();
  const [scaleAnims] = React.useState(DRIVER_TABS.map(() => new Animated.Value(1)));

  const handlePress = (tabKey: string, index: number) => {
    // Animate the tab
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnims[index], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onTabChange(tabKey);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {DRIVER_TABS.map((tab, index) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabWrapper}
            onPress={() => handlePress(tab.key, index)}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.tab, { transform: [{ scale: scaleAnims[index] }] }]}>
              <MaterialIcons
                name={tab.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.subtext}
              />
              <Text style={[styles.label, { color: isActive ? colors.primary : colors.subtext }, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={[styles.underline, { backgroundColor: colors.primary }]} />}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  labelActive: {
    fontWeight: '700',
  },
  underline: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    width: 24,
  },
});
