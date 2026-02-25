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
    <div>
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-gray-800">Sign In</h2>
            <p className="mt-2 text-gray-500">Welcome back! Please log in to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="user_email"
              type="email"
              value={formData.user_email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
            <input
              name="user_password"
              type="password"
              value={formData.user_password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 mt-4">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 