import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-paper rounded-ot-card shadow-lg border border-ot-iron dark:border-dark-border p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-8 h-8 text-amber-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-extrabold text-ot-charade dark:text-dark-text mb-1">
          Payment cancelled
        </h2>
        <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary mb-6">
          Your reservation is still pending. You can complete the payment at any time from your
          reservations.
        </p>

        <div className="flex flex-col gap-2">
          {reservationId && (
            <Link
              to="/my-reservations"
              className="w-full py-3 text-sm font-bold text-white bg-ot-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors text-center"
            >
              View my reservations
            </Link>
          )}
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

export default PaymentCancelPage;
