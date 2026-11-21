import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { register } from '../../services/authService';
import { colors } from '../../theme/colors';
import { getAuthErrorMessage } from '../../utils/authError';
import { RegisterForm, validateRegister } from '../../utils/validation';
import { useAppTheme } from '../../context/ThemeContext';
import AuthHeader from '../../components/AuthHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const { palette: c } = useAppTheme();
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: keyof RegisterForm, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined, general: undefined }));
  };

  const handleRegister = async () => {
    const validation = validateRegister(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setLoading(true);
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.role.trim() ? { role: form.role.trim() } : {}),
      });
      navigation.navigate('VerifyEmail', { email: form.email.trim() });
    } catch (error) {
      setErrors({ general: getAuthErrorMessage(error, 'Registration failed. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: c.card, borderColor: c.border, color: c.text },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHeader />
        <Text style={[styles.title, { color: c.text }]}>Create account</Text>
        <Text style={[styles.sub, { color: c.muted }]}>Register to start learning.</Text>

        <Text style={[styles.label, { color: c.text }]}>Name</Text>
        <TextInput
          style={inputStyle}
          placeholder="Enter your name"
          placeholderTextColor={c.muted}
          value={form.name}
          onChangeText={(value) => handleChange('name', value)}
        />
        {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}

        <Text style={[styles.label, { color: c.text }]}>Email Address</Text>
        <TextInput
          style={inputStyle}
          placeholder="Enter your email"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={form.email}
          onChangeText={(value) => handleChange('email', value)}
        />
        {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <Text style={[styles.label, { color: c.text }]}>Password</Text>
        <View>
          <TextInput
            style={[inputStyle, styles.passwordInput]}
            placeholder="At least 8 characters"
            placeholderTextColor={c.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={form.password}
            onChangeText={(value) => handleChange('password', value)}
          />
          <TouchableOpacity style={styles.toggle} onPress={() => setShowPassword((value) => !value)}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <Text style={[styles.label, { color: c.text }]}>Confirm password</Text>
        <View>
          <TextInput
            style={[inputStyle, styles.passwordInput]}
            placeholder="Re-enter your password"
            placeholderTextColor={c.muted}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            value={form.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
          />
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setShowConfirmPassword((value) => !value)}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {!!errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

        <Text style={[styles.label, { color: c.text }]}>Role (optional)</Text>
        <TextInput
          style={inputStyle}
          placeholder="For example: student"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          value={form.role}
          onChangeText={(value) => handleChange('role', value)}
        />

        {!!errors.general && <Text style={[styles.error, styles.generalError]}>{errors.general}</Text>}
        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={{ color: c.text }}>Already registered? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { marginTop: 4, marginBottom: 16, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15 },
  passwordInput: { paddingRight: 70 },
  toggle: { position: 'absolute', right: 14, top: 0, height: 48, justifyContent: 'center' },
  error: { color: '#d32f2f', fontSize: 12, marginTop: 4 },
  generalError: { marginTop: 12 },
  button: {
    marginTop: 22,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 16, padding: 8 },
});

export default RegisterScreen;
