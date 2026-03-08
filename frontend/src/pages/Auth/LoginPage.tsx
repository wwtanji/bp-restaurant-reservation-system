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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray p-6">
      <div className="w-full max-w-md bg-white border border-ot-iron rounded-ot-card shadow-lg p-8 sm:p-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-extrabold text-ot-primary tracking-tight">
            Reservelt
          </Link>
          <h2 className="text-2xl font-extrabold text-ot-charade mt-4">Sign In</h2>
          <p className="mt-2 text-sm text-ot-pale-sky">Welcome back! Please log in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="user_email"
            type="email"
            autoComplete="email"
            value={formData.user_email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-3 border border-ot-iron rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary text-sm text-ot-charade placeholder-ot-manatee"
            required
          />
          <input
            name="user_password"
            type="password"
            autoComplete="current-password"
            value={formData.user_password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-3 border border-ot-iron rounded-ot-btn focus:outline-none focus:ring-2 focus:ring-ot-primary text-sm text-ot-charade placeholder-ot-manatee"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ot-primary hover:bg-ot-primary-dark text-white font-bold py-3 rounded-ot-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-sm text-ot-pale-sky mt-4">
          <Link to="/forgot-password" className="text-ot-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-sm text-ot-pale-sky mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-ot-primary font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
