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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { verifyEmail } from '../../services/authService';
import { colors } from '../../theme/colors';
import { getAuthErrorMessage } from '../../utils/authError';
import { validateVerificationOtp } from '../../utils/validation';
import { useAppTheme } from '../../context/ThemeContext';
import AuthHeader from '../../components/AuthHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen = ({ navigation, route }: Props) => {
  const { palette: c } = useAppTheme();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const validationError = validateVerificationOtp(otp);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await verifyEmail({ email: route.params.email, otp: otp.trim() });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { successMessage: 'Email verify ho gaya. Ab login karein.' } }],
      });
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, 'Email verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHeader />
        <Text style={[styles.title, { color: c.text }]}>Verify your email</Text>
        <Text style={[styles.sub, { color: c.muted }]}>Enter the 6-digit code sent to {route.params.email}</Text>
        <Text style={[styles.label, { color: c.text }]}>Verification code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          placeholder="6-digit OTP"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          autoCapitalize="none"
          maxLength={6}
          value={otp}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, ''));
            setError('');
          }}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify email</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { marginTop: 6, marginBottom: 20, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 18 },
  error: { color: '#d32f2f', fontSize: 12, marginTop: 6 },
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
});

export default VerifyEmailScreen;
