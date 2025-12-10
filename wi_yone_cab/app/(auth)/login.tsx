import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { customLogin } from "../lib/customAuth";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Use custom login (no Supabase Auth)
      const loginResult = await customLogin(username, password);

      if (!loginResult.success) {
        setError(loginResult.error || "Login failed");
        Alert.alert("Login Failed", loginResult.error || "Login failed");
        setLoading(false);
        return;
      }

      // Navigate to role-specific dashboard
      setUsername("");
      setPassword("");
      if (loginResult.role === 'driver') {
        router.replace("/(driver)");
      } else {
        router.replace("/(rider)");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to connect to server";
      setError(errorMsg);
      Alert.alert("Error", errorMsg);
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Form Section */}
        <View style={styles.form}>
          {/* Username/Email Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor="#B0B0B0"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.underline} />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#B0B0B0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <View style={styles.underline} />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer - Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  /* Header Section */
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  icon: {
    width: 125,
    height: 125,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: "#888888",
    marginBottom: 0,
  },

  /* Form Section */
  form: {
    width: "100%",
    marginBottom: 32,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 17,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  inputWrapper: {
    marginBottom: 28,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 18,
    color: "#000000",
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  underline: {
    height: 2,
    backgroundColor: "#FFB81C",
    marginTop: 4,
  },

  /* Forgot Password */
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 28,
  },
  forgotText: {
    color: "#FFB81C",
    fontSize: 16,
    fontWeight: "500",
  },

  /* Sign In Button */
  button: {
    backgroundColor: "#FFB81C",
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#888888",
    fontSize: 16,
  },
  signUpLink: {
    color: "#FFB81C",
    fontSize: 16,
    fontWeight: "700",
  },
});
