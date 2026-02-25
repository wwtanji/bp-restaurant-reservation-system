import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, FieldValidationError } from '../../context/AuthContext';

const getPasswordError = (password: string): string | null => {
  if (password.length === 0) return null;
  if (password.length < 8) return 'Password is too short';
  if (password.length > 80) return 'Password is too long';

  const missing: string[] = [];
  if (!/[A-Z]/.test(password)) missing.push('uppercase letter');
  if (!/[a-z]/.test(password)) missing.push('lowercase letter');
  if (!/[0-9]/.test(password)) missing.push('number');

  if (missing.length === 0) return null;

  const article = missing[0] === 'uppercase letter' ? 'an' : 'a';
  if (missing.length === 1) return `Password needs ${article} ${missing[0]}`;
  const last = missing[missing.length - 1];
  const rest = missing.slice(0, -1).join(', ');
  return `Password needs ${article} ${rest} and ${last}`;
};

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_email: '',
    user_password: '',
    role: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { register, loading } = useAuth();

  const pwd = formData.user_password;
  const passwordError = getPasswordError(pwd);
  const isPasswordValid = pwd.length > 0 && passwordError === null;
  const showPasswordError = passwordTouched && !!passwordError;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.first_name.length > 15) {
      newErrors.first_name = 'First name must be less than 15 characters';
    }
    if (formData.last_name.length > 15) {
      newErrors.last_name = 'Last name must be less than 15 characters';
    }

    const pwdErr = pwd.length === 0 ? 'Password is required' : passwordError;
    if (pwdErr) newErrors.user_password = pwdErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    if (validateForm()) {
      try {
        await register(formData);
      } catch (error) {
        if (error instanceof FieldValidationError) {
          const fieldErrors = error.fieldErrors;
          setErrors(prev => ({ ...prev, ...fieldErrors }));
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-gray-800">Sign Up</h2>
            <p className="mt-2 text-gray-500">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                )}
              </div>
              <div>
                <input
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            <input
              name="user_email"
              type="email"
              value={formData.user_email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />

            {/* Password field */}
            <div>
              <div className="relative">
                <input
                  name="user_password"
                  type="password"
                  value={formData.user_password}
                  onChange={handleChange}
                  onFocus={() => setPasswordTouched(true)}
                  placeholder="Password"
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${
                    showPasswordError
                      ? 'border-red-500 focus:ring-red-200'
                      : isPasswordValid
                      ? 'border-gray-300 focus:ring-blue-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />

                {/* Green checkmark when valid */}
                {isPasswordValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Inline error message */}
              {showPasswordError && (
                <div className="flex items-center gap-1.5 mt-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{passwordError}</p>
                </div>
              )}

              {/* Always-visible hint */}
              <p className="text-xs text-gray-400 mt-1.5">
                Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number.
              </p>
            </div>

            {errors._general && (
              <p className="text-sm text-red-500 text-center">{errors._general}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
