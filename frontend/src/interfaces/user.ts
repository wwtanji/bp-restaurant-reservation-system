export interface User {
  id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  phone_number: string | null;
  role: number;
  email_verified: boolean;
  registered_at: string;
}
