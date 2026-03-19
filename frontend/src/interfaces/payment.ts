export interface PaymentBrief {
  id: number;
  status: string;
  amount: number;
  currency: string;
}

export interface PaymentOut {
  id: number;
  reservation_id: number;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}
