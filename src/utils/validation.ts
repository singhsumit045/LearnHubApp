export const validateLogin = (data: { email: string; password: string }) => {
  const errors: { email?: string; password?: string } = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    errors.email = 'Enter a valid email';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

export const validateRegister = (data: RegisterForm) => {
  const errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    errors.email = 'Enter a valid email';
  }
  if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const validateVerificationOtp = (otp: string) =>
  /^\d{6}$/.test(otp.trim()) ? undefined : 'Enter the 6-digit OTP';