export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(data.password)) {
    errors.password = 'Include uppercase, lowercase, and a number';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function hasErrors(errors: RegisterFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): Pick<RegisterFormErrors, 'password' | 'confirmPassword'> {
  return validateRegisterForm({
    firstName: 'ok',
    lastName: 'ok',
    email: 'a@b.co',
    password,
    confirmPassword,
  });
}
