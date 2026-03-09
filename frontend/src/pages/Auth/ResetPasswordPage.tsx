import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import NavbarComponent from '../../components/section/NavbarComponent';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (password.length > 80) {
      newErrors.password = 'Password must be less than 80 characters';
    }
    if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrors({ form: 'Invalid reset link. Token is missing.' });
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8000/api/authentication/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, new_password: password }),
        mode: 'cors',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setErrors({ form: error.message || 'Failed to reset password. The link may be invalid or expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <NavbarComponent />
        <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray dark:bg-dark-bg p-6">
          <div className="w-full max-w-md bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border rounded-ot-card shadow-lg p-8 sm:p-10 text-center">
            <div className="mb-6 flex justify-center">
              <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Invalid Reset Link</h2>
            <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
              The password reset link is invalid or missing. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 px-8 rounded-ot-btn transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavbarComponent />
      <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray dark:bg-dark-bg p-6">
        <div className="w-full max-w-md bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border rounded-ot-card shadow-lg p-8 sm:p-10">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text">Reset Password</h2>
                <p className="mt-2 text-sm text-ot-pale-sky dark:text-dark-text-secondary">Enter your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="New Password"
                    className={`w-full px-4 py-3 border rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary dark:focus:ring-dark-primary text-sm text-ot-charade dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary dark:bg-dark-surface ${
                      errors.password ? 'border-red-500' : 'border-ot-iron dark:border-dark-border'
                    }`}
                    required
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Confirm New Password"
                    className={`w-full px-4 py-3 border rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary dark:focus:ring-dark-primary text-sm text-ot-charade dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary dark:bg-dark-surface ${
                      errors.confirmPassword ? 'border-red-500' : 'border-ot-iron dark:border-dark-border'
                    }`}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                {errors.form && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 px-4 py-3 rounded-ot-btn text-sm">
                    {errors.form}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 rounded-ot-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <p className="text-center text-sm text-ot-pale-sky dark:text-dark-text-secondary mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-ot-primary dark:text-dark-primary font-bold hover:underline">
                  Log In
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Password Reset Successful!</h2>
              <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <p className="text-xs text-ot-manatee dark:text-dark-text-secondary">Redirecting to login page...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
