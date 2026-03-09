import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NavbarComponent from '../../components/section/NavbarComponent';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/authentication/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email }),
        mode: 'cors',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send password reset email');
      }

      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavbarComponent />
      <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray dark:bg-dark-bg p-6">
        <div className="w-full max-w-md bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border rounded-ot-card shadow-lg p-8 sm:p-10">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text">Forgot Password?</h2>
                <p className="mt-2 text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary dark:focus:ring-dark-primary text-sm text-ot-charade dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary dark:bg-dark-surface"
                  required
                />

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 px-4 py-3 rounded-ot-btn text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 rounded-ot-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Check Your Email</h2>
              <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
                If an account exists with this email, a password reset link has been sent.
                Please check your inbox and follow the instructions.
              </p>
              <Link
                to="/login"
                className="inline-block bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 px-8 rounded-ot-btn transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
