import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavbarComponent from '../../components/section/NavbarComponent';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_email: '',
    user_password: '',
    role: 0, // Default role for regular users
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, loading } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.first_name.length > 15) {
      newErrors.first_name = 'First name must be less than 15 characters';
    }
    if (formData.last_name.length > 15) {
      newErrors.last_name = 'Last name must be less than 15 characters';
    }
    if (formData.user_password.length < 8) {
      newErrors.user_password = 'Password must be at least 8 characters long';
    }
    if (formData.user_password.length > 80) {
      newErrors.user_password = 'Password must be less than 80 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await register(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
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
            
            <div>
              <input
                name="user_password"
                type="password"
                value={formData.user_password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.user_password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.user_password && (
                <p className="mt-1 text-xs text-red-500">{errors.user_password}</p>
              )}
            </div>

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