export interface Node {
  mac_address: string;
  alias: string;
  latitude: number;
  longitude: number;
  registered_at: string;
  is_registered: boolean;
}

export interface SensorReading {
  id: number;
  node_mac: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  moisture: number;
  temperature: number;
  timestamp: string;
}

export interface Harvest {
  id: number;
  harvest_date: string;
  yield_kg: number;
  price_per_kg: number;
  gross_income: number;
  created_at: string;
  expenses: Expense[];
}

export interface Expense {
  id: number;
  harvest_id: number;
  name: string;
  amount: number;
}
