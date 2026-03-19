import { useState } from 'react';
import { apiFetch, ApiError } from '../utils/api';
import { CheckoutSessionResponse } from '../interfaces/payment';

interface UsePaymentResult {
  initiatePayment: (reservationId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function usePayment(): UsePaymentResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (reservationId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await apiFetch<CheckoutSessionResponse>('/payments/create-session', {
        method: 'POST',
        body: JSON.stringify({ reservation_id: reservationId }),
      });

      window.location.href = session.checkout_url;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Failed to initiate payment';
      setError(message);
      setIsLoading(false);
    }
  };

  return { initiatePayment, isLoading, error };
}
