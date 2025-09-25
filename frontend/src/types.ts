export type SiteCode = 'hanoi' | 'danang' | 'saigon';

export type Flight = {
  id: number;
  flight_code: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_city: string;
  arrival_city: string;
  flight_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  total_seats: number;
  available_seats: number;
  status: string;
  region?: string;
  site?: SiteCode;
  price_formatted?: string;
};

export type Booking = {
  id: number;
  booking_code: string;
  flight_id: number;
  customer_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  seat_number?: string;
  total_amount: number;
  final_amount?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  region?: SiteCode;
  created_at?: string;
  updated_at?: string;
  // joined fields
  flight_code?: string;
  airline?: string;
  departure_city?: string;
  arrival_city?: string;
  flight_date?: string;
  departure_time?: string;
  arrival_time?: string;
  total_amount_formatted?: string;
  site?: SiteCode;
};

export type Statistics = {
  totalFlights: number;
  totalBookings: number;
  totalRevenue: number;
  availableFlights: number;
  siteStats: Record<SiteCode | string, {
    flights: number;
    availableFlights: number;
    bookings: number;
    revenue: number;
    revenueFormatted: string;
  }>;
  totalRevenueFormatted: string;
};

export type User = {
  id: number;
  username: string;
  role: string;
  region: SiteCode | string;
  token?: string;
};


