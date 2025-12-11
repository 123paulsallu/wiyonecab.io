import { View, Text, Image, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getSession } from "../lib/customAuth";
import { useTheme } from "../lib/themeContext";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const hideSplash = async () => {
      // Check custom auth session and navigate accordingly
      const session = await getSession();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
      if (session && session.role === 'driver') {
        router.replace('/(driver)');
        return;
      }
      if (session && session.role === 'rider') {
        router.replace('/(rider)');
        return;
      }
      // Default: go to login
      router.replace("/(auth)/login");
    };

    hideSplash();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={[styles.brand, { color: colors.primary }]}>WiYone Cab</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Your ride, your choice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  brand: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
  },
});
