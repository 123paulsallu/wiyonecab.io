import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home', to: '/' },
  { key: 'rides', label: 'Rides', icon: 'local-taxi', to: '/ride-now' },
  { key: 'history', label: 'History', icon: 'history', to: '/ride-history' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: '/settings' },
  { key: 'support', label: 'Support', icon: 'support-agent', to: '/support' },
];

export default function BottomTabs({ active }: { active?: string }) {
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
    <View style={styles.container}>
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
                color={isActive ? '#FFB81C' : '#666666'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
              {isActive && <View style={styles.underline} />}
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
    borderTopColor: '#eee',
    backgroundColor: '#fff',
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
    color: '#666',
    marginTop: 2,
  },
  labelActive: {
    color: '#FFB81C',
    fontWeight: '700',
  },
  underline: {
    height: 3,
    backgroundColor: '#FFB81C',
    borderRadius: 2,
    marginTop: 4,
    width: 24,
  },
});
