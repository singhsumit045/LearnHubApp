import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { validateLogin } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { getAuthErrorMessage } from '../../utils/authError';
import { useAppTheme } from '../../context/ThemeContext';
import AuthHeader from '../../components/AuthHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ route, navigation }: Props) => {
  const { login } = useAuth();
  const { palette: c } = useAppTheme();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: 'email' | 'password', value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined, general: undefined }));
  };

  const handleLogin = async () => {
    const validation = validateLogin(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      setLoading(true);
      await login(form.email.trim(), form.password);
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 401) {
        const message = error.response?.data?.message;
        const needsVerification =
          typeof message === 'string' && message.toLowerCase().includes('verify your email');
        setErrors({
          general: needsVerification ? message : 'Email ya password galat hai.',
        });
        return;
      }

      setErrors({ general: getAuthErrorMessage(error, 'Login failed. Please try again.') });
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
        {!!route.params?.successMessage && (
          <Text style={styles.success}>{route.params.successMessage}</Text>
        )}
        <Text style={[styles.title, { color: c.text }]}>Welcome Back 👋</Text>
        <Text style={[styles.sub, { color: c.muted }]}>Sign in to continue your learning journey.</Text>

        <Text style={[styles.label, { color: c.text }]}>Email Address</Text>
        <TextInput
          style={inputStyle}
          placeholder="Enter your email"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={form.email}
          onChangeText={(v) => handleChange('email', v)}
        />
        {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <Text style={[styles.label, { color: c.text }]}>Password</Text>
        <View>
          <TextInput
            style={[inputStyle, { paddingRight: 70 }]}
            placeholder="Enter your password"
            placeholderTextColor={c.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={form.password}
            onChangeText={(v) => handleChange('password', v)}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShowPassword((s) => !s)}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}

        {!!errors.general && <Text style={[styles.error, { marginTop: 12 }]}>{errors.general}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={{ color: c.text }}>Account nahi hai? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { marginTop: 4, marginBottom: 24, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15 },
  eye: { position: 'absolute', right: 14, top: 0, height: 48, justifyContent: 'center' },
  error: { color: '#d32f2f', fontSize: 12, marginTop: 4 },
  success: { color: '#2e7d32', fontSize: 14, marginBottom: 16 },
  registerLink: { alignItems: 'center', marginTop: 18, padding: 8 },
  button: {
    marginTop: 22, height: 48, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default LoginScreen;
