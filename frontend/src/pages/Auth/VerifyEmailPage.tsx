import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import NavbarComponent from '../../components/section/NavbarComponent';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Token is missing.');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/authentication/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token }),
          mode: 'cors',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to verify email');
        }

        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now log in.');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div>
      <NavbarComponent />
      <div className="min-h-screen flex items-center justify-center bg-ot-athens-gray dark:bg-dark-bg p-6">
        <div className="w-full max-w-md bg-white dark:bg-dark-paper border border-ot-iron dark:border-dark-border rounded-ot-card shadow-lg p-8 sm:p-10 text-center">
          {status === 'verifying' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ot-primary" />
              </div>
              <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Verifying Email</h2>
              <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6 flex justify-center">
                <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Email Verified!</h2>
              <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">{message}</p>
              <p className="text-xs text-ot-manatee dark:text-dark-text-secondary">Redirecting to login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6 flex justify-center">
                <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-ot-charade dark:text-dark-text mb-4">Verification Failed</h2>
              <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-ot-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark text-white font-bold py-3 px-8 rounded-ot-btn transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
