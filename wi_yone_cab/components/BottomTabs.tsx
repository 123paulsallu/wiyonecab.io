import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home', to: '/' },
  { key: 'rides', label: 'Rides', icon: 'local-taxi', to: '/ride-now' },
  { key: 'history', label: 'History', icon: 'history', to: '/ride-history' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: '/settings' },
  { key: 'support', label: 'Support', icon: 'support-agent', to: '/support' },
];

export default function BottomTabs({ active }: { active?: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [scaleAnims] = React.useState(TABS.map(() => new Animated.Value(1)));

  // Map pathname to tab key
  const pathKey = React.useMemo(() => {
    if (!pathname) return 'home';
    if (pathname.startsWith('/ride-now')) return 'rides';
    if (pathname.startsWith('/ride-history')) return 'history';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/support')) return 'support';
    if (pathname === '/' || pathname === '') return 'home';
    return 'home';
  }, [pathname]);

  const activeKey = active ?? pathKey;

  const handlePress = (tab: typeof TABS[0], index: number) => {
    // Animate the tab
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnims[index], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    router.push(tab.to as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {TABS.map((t, index) => {
        const isActive = activeKey === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabWrapper}
            onPress={() => handlePress(t, index)}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.tab, { transform: [{ scale: scaleAnims[index] }] }]}>
              <MaterialIcons
                name={t.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.subtext}
              />
              <Text style={[styles.label, { color: isActive ? colors.primary : colors.subtext }, isActive && styles.labelActive]}>{t.label}</Text>
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
    paddingVertical: 16,
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
