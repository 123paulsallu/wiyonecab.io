import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { customSignUp } from "../lib/customAuth";

export default function SignUpScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Basic, 2: Personal, 3: Driver (if selected), 4: Review
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStepSuccess, setShowStepSuccess] = useState(false);
  const [stepSuccessMessage, setStepSuccessMessage] = useState("");
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  
  // Form data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("rider"); // "rider" or "driver"
  const [idType, setIdType] = useState("nin");
  const [idNumber, setIdNumber] = useState("");
  const [nationalIdFile, setNationalIdFile] = useState<any>(null);
  const [driverLicenseFile, setDriverLicenseFile] = useState<any>(null);

  const pickFile = async (fileType: 'nationalId' | 'driverLicense') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        if (fileType === 'nationalId') {
          setNationalIdFile(file);
        } else if (fileType === 'driverLicense') {
          setDriverLicenseFile(file);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick file: ' + (error?.message ?? String(error)));
    }
  };

  const handleSignUp = async () => {
    // client-side final validation
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    if (!fullName) newErrors.full_name = "Full name is required";
    if (!phone) newErrors.phone = "Phone number is required";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (role === "driver" && !idNumber) newErrors.id_number = "ID number is required for drivers";
    if (role === "driver" && !nationalIdFile) newErrors.id_document = "National ID upload is required for drivers";
    if (role === "driver" && !driverLicenseFile) newErrors.driver_license = "Driver license upload is required for drivers";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Supabase signup flow
    // Generate a synthetic email from username for Supabase auth
    // (Supabase requires email field, but we'll sign in with username/phone)
    const syntheticEmail = `${username}@wiyonecab.local`;

    setLoading(true);
    try {
      // Call custom sign up (no Supabase Auth, uses custom users table)
      const signupResult = await customSignUp(
        username,
        password,
        fullName,
        phone,
        role as 'rider' | 'driver',
        undefined, // nationalIdUrl - can be added later if needed
        undefined  // driverLicenseUrl - can be added later if needed
      );

      if (!signupResult.success) {
        Alert.alert('Registration Error', signupResult.error || 'Sign up failed');
        setLoading(false);
        return;
      }

      if (!signupResult.userId) {
        Alert.alert('Registration Error', 'Failed to create user account');
        setLoading(false);
        return;
      }

      // Show success and navigate to correct dashboard
      if (role === 'driver') {
        setSignupMessage('Driver account created! Pending approval...');
      } else {
        setSignupMessage('Rider account created successfully!');
      }
      setShowSignupSuccess(true);
      setErrors({});

      setTimeout(() => {
        setShowSignupSuccess(false);
        if (role === 'driver') {
          router.push('/(driver)');
        } else {
          router.push('/(rider)');
        }
      }, 2000);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete registration: ' + (error?.message ?? String(error)));
      console.error('Signup error', error);
      setLoading(false);
    }
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep < step) {
      setStep(nextStep);
      return;
    }

    // Validate current step before moving to next and collect errors
    const stepErrors: Record<string, string> = {};
    if (step === 1) {
      if (!username) stepErrors.username = 'Username is required';
      if (!password) stepErrors.password = 'Password is required';
      if (!confirmPassword) stepErrors.confirmPassword = 'Please confirm your password';
      if (password && confirmPassword && password !== confirmPassword) stepErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 2) {
      if (!fullName) stepErrors.full_name = 'Full name is required';
      if (!phone) stepErrors.phone = 'Phone number is required';
    }

    if (step === 3 && role === "driver") {
      if (!idType) stepErrors.id_type = 'ID type is required';
      if (!idNumber) stepErrors.id_number = 'ID number is required';
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    // clear errors and show a brief success modal for this step
    setErrors({});
    setStepSuccessMessage(`Step ${step} completed`);
    setShowStepSuccess(true);
    setTimeout(() => {
      setShowStepSuccess(false);
      setStep(nextStep);
    }, 1200);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>Step {step} of {role === "driver" ? 4 : 3}</Text>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Create Your Account</Text>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#B0B0B0"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <View style={styles.underline} />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <View style={styles.underline} />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#B0B0B0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <View style={styles.underline} />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#B0B0B0"
                value={fullName}
                onChangeText={setFullName}
              />
              <View style={styles.underline} />
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#B0B0B0"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.underline} />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <Text style={styles.roleLabel}>Account Type</Text>
            <View style={styles.roleButtonsContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === "rider" && styles.roleButtonActive]}
                onPress={() => setRole("rider")}
              >
                <Text style={[styles.roleButtonText, role === "rider" && styles.roleButtonTextActive]}>
                  Rider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === "driver" && styles.roleButtonActive]}
                onPress={() => setRole("driver")}
              >
                <Text style={[styles.roleButtonText, role === "driver" && styles.roleButtonTextActive]}>
                  Driver
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Driver Info (only if driver) */}
        {step === 3 && role === "driver" && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Driver Information</Text>

            <Text style={styles.idTypeLabel}>ID Type</Text>
            <View style={styles.idTypeContainer}>
              <TouchableOpacity
                style={[styles.idTypeButton, idType === "nin" && styles.idTypeButtonActive]}
                onPress={() => setIdType("nin")}
              >
                <Text style={[styles.idTypeButtonText, idType === "nin" && styles.idTypeButtonTextActive]}>
                  NIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.idTypeButton, idType === "passport" && styles.idTypeButtonActive]}
                onPress={() => setIdType("passport")}
              >
                <Text style={[styles.idTypeButtonText, idType === "passport" && styles.idTypeButtonTextActive]}>
                  Passport
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={`${idType.toUpperCase()} Number`}
                placeholderTextColor="#B0B0B0"
                value={idNumber}
                onChangeText={setIdNumber}
              />
              <View style={styles.underline} />
              {errors.id_number && <Text style={styles.errorText}>{errors.id_number}</Text>}
              {errors.id_type && <Text style={styles.errorText}>{errors.id_type}</Text>}
            </View>

            <Text style={styles.fileUploadLabel}>National ID Document</Text>
            <TouchableOpacity
              style={styles.filePickButton}
              onPress={() => pickFile('nationalId')}
            >
              <Text style={styles.filePickButtonText}>
                {nationalIdFile ? `✓ ${nationalIdFile.name}` : '+ Upload National ID (PDF/Image)'}
              </Text>
            </TouchableOpacity>
            {errors.id_document && <Text style={styles.errorText}>{errors.id_document}</Text>}

            <Text style={styles.fileUploadLabel}>Driver License</Text>
            <TouchableOpacity
              style={styles.filePickButton}
              onPress={() => pickFile('driverLicense')}
            >
              <Text style={styles.filePickButtonText}>
                {driverLicenseFile ? `✓ ${driverLicenseFile.name}` : '+ Upload Driver License (PDF/Image)'}
              </Text>
            </TouchableOpacity>
            {errors.driver_license && <Text style={styles.errorText}>{errors.driver_license}</Text>}
          </View>
        )}

        {/* Step 4: Review (Driver Only) or submit for Rider */}
        {step === (role === "driver" ? 4 : 3) && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Information</Text>

            <View style={styles.reviewBox}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Username:</Text>
                <Text style={styles.reviewValue}>{username}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Full Name:</Text>
                <Text style={styles.reviewValue}>{fullName}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Phone:</Text>
                <Text style={styles.reviewValue}>{phone}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Account Type:</Text>
                <Text style={styles.reviewValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
              </View>
              {role === "driver" && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>ID Type:</Text>
                  <Text style={styles.reviewValue}>{idType.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleStepChange(step - 1)}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < (role === "driver" ? 4 : 3) ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleStepChange(step + 1)}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step Success Modal */}
      <Modal
        visible={showStepSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStepSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✓</Text>
            <Text style={styles.modalText}>{stepSuccessMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Signup Success Modal */}
      <Modal
        visible={showSignupSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignupSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✓</Text>
            <Text style={styles.modalText}>{signupMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSignupSuccess(false);
                router.replace("/(auth)/login");
              }}
            >
              <Text style={styles.modalButtonText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 20,
    justifyContent: "center",
  },

  /* Progress */
  progressContainer: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFB81C",
  },
  stepText: {
    fontSize: 15,
    color: "#888888",
    marginBottom: 24,
    textAlign: "center",
  },

  /* Form Section */
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 24,
  },

  /* Input */
  inputWrapper: {
    marginBottom: 24,
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

  /* Role Selection */
  roleLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  roleButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#FFB81C",
    backgroundColor: "#FFF9E6",
  },
  roleButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#888888",
  },
  roleButtonTextActive: {
    color: "#FFB81C",
  },

  /* ID Type Selection */
  idTypeLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  idTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  idTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    alignItems: "center",
  },
  idTypeButtonActive: {
    borderColor: "#FFB81C",
    backgroundColor: "#FFF9E6",
  },
  idTypeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888888",
  },
  idTypeButtonTextActive: {
    color: "#FFB81C",
  },

  /* Note */
  noteText: {
    fontSize: 15,
    color: "#888888",
    fontStyle: "italic",
    lineHeight: 18,
  },

  /* Review Box */
  reviewBox: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  reviewLabel: {
    fontSize: 15,
    color: "#888888",
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },

  /* Buttons */
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#FFB81C",
    borderRadius: 0,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFB81C",
    fontSize: 18,
    fontWeight: "700",
  },
  button: {
    flex: 1,
    backgroundColor: "#FFB81C",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 0,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#888888",
    fontSize: 16,
  },
  signInLink: {
    color: "#FFB81C",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Error Text */
  errorText: {
    fontSize: 12,
    color: "#D32F2F",
    marginTop: 4,
    fontWeight: "500",
  },

  /* File Upload */
  fileUploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
    marginTop: 16,
  },
  filePickButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#FFB81C",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  filePickButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFB81C",
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 48,
    color: "#FFB81C",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: "#FFB81C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 0,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
