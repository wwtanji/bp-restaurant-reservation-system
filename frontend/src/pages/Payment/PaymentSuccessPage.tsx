import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { PaymentOut } from '../../interfaces/payment';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const { data: payment, isLoading } = useFetch<PaymentOut>(
    sessionId ? `/payments/by-session/${sessionId}` : null,
  );

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-paper rounded-ot-card shadow-lg border border-ot-iron dark:border-dark-border p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-8 h-8 text-green-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-extrabold text-ot-charade dark:text-dark-text mb-1">
          Payment successful!
        </h2>
        <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
          Your reservation has been confirmed. See you there!
        </p>

        {isLoading && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-ot-primary" />
          </div>
        )}

        {payment && (
          <div className="bg-ot-athens-gray dark:bg-dark-surface rounded-ot-card p-4 text-left space-y-2.5 mb-6 border border-ot-iron dark:border-dark-border">
            <div className="flex justify-between text-sm">
              <span className="text-ot-pale-sky dark:text-dark-text-secondary">Amount</span>
              <span className="font-bold text-ot-charade dark:text-dark-text">
                {(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ot-pale-sky dark:text-dark-text-secondary">Status</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Paid
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link
            to="/my-reservations"
            className="w-full py-3 text-sm font-bold text-white bg-ot-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors text-center"
          >
            View my reservations
          </Link>
          <Link
            to="/"
            className="w-full py-3 text-sm font-medium text-ot-charade dark:text-dark-text border border-ot-iron dark:border-dark-border rounded-ot-btn hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
