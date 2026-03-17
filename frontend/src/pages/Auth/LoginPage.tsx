import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    user_email: '',
    user_password: '',
  });

  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray dark:bg-dark-bg p-6">
      <div className="w-full max-w-md bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border rounded-ot-card shadow-lg p-8 sm:p-10">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-2xl font-extrabold text-ot-primary dark:text-dark-primary tracking-tight"
          >
            Reservelt
          </Link>
          <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mt-4">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-ot-pale-sky dark:text-dark-text-secondary">
            Welcome back! Please log in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="user_email"
            type="email"
            autoComplete="email"
            value={formData.user_email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary dark:focus:ring-dark-primary text-sm text-ot-charade dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary dark:bg-dark-surface"
            required
          />
          <input
            name="user_password"
            type="password"
            autoComplete="current-password"
            value={formData.user_password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary dark:focus:ring-dark-primary text-sm text-ot-charade dark:text-dark-text placeholder-ot-manatee dark:placeholder-dark-text-secondary dark:bg-dark-surface"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 rounded-ot-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-sm text-ot-pale-sky dark:text-dark-text-secondary mt-4">
          <Link
            to="/forgot-password"
            className="text-ot-primary dark:text-dark-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-sm text-ot-pale-sky dark:text-dark-text-secondary mt-4">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-ot-primary dark:text-dark-primary font-bold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
