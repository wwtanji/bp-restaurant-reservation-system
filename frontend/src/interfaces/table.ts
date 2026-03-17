export interface Table {
  id: number;
  restaurant_id: number;
  table_number: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TableFormData {
  table_number: number;
  capacity: number;
}
