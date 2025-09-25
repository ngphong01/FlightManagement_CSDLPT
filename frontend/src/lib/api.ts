import type { Flight, Booking, Statistics, SiteCode, User } from '../types';

const API_BASE = 'http://localhost:3001';

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const buildHeaders = (isJson: boolean = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const api = {
  async login(username: string, password: string): Promise<User & { token: string; refreshToken?: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Đăng nhập thất bại');
    const data = await res.json();
    const user: User & { token: string; refreshToken?: string } = {
      ...data.user,
      token: data.token,
      refreshToken: data.refreshToken
    };
    return user;
  },

  async updateFlight(id: number, patch: Partial<{
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
    status: string;
  }>): Promise<Flight> {
    const res = await fetch(`${API_BASE}/api/flights/${id}`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      try { const err = await res.json(); throw new Error(err?.message || err?.error || 'Lỗi cập nhật chuyến bay'); } catch { throw new Error('Lỗi cập nhật chuyến bay'); }
    }
    const data = await res.json();
    return (data.data as Flight);
  },

  async refreshToken(refreshToken: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    if (!res.ok) throw new Error('Làm mới token thất bại');
    const data = await res.json();
    return data.token as string;
  },

  async createFlight(input: {
    flight_code: string;
    airline: string;
    departure_airport: string;
    arrival_airport: string;
    departure_city: string;
    arrival_city: string;
    flight_date: string; // YYYY-MM-DD
    departure_time: string; // HH:mm:ss or HH:mm
    arrival_time: string;
    price: number;
    total_seats: number;
    status?: string;
  }): Promise<Flight> {
    const res = await fetch(`${API_BASE}/api/flights`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err?.message || err?.error || 'Lỗi tạo chuyến bay');
      } catch {
        throw new Error('Lỗi tạo chuyến bay');
      }
    }
    const data = await res.json();
    return (data.data as Flight);
  },

  async statistics(): Promise<Statistics> {
    const res = await fetch(`${API_BASE}/api/statistics`, { headers: buildHeaders(false) });
    if (!res.ok) throw new Error('Lỗi lấy thống kê');
    const data = await res.json();
    return data.statistics as Statistics;
  },

  async airports(): Promise<Array<{ code: string; name: string; city: string }>> {
    const res = await fetch(`${API_BASE}/api/airports`);
    if (!res.ok) throw new Error('Lỗi lấy sân bay');
    const data = await res.json();
    return data.airports;
  },

  async flights(params: { departure?: string; arrival?: string; date?: string; region?: SiteCode | 'all'; status?: string } = {}): Promise<Flight[]> {
    const search = new URLSearchParams();
    if (params.departure) search.set('departure', params.departure);
    if (params.arrival) search.set('arrival', params.arrival);
    if (params.date) search.set('date', params.date);
    if (params.region && params.region !== 'all') search.set('region', params.region);
    if (params.status) search.set('status', params.status);
    const res = await fetch(`${API_BASE}/api/flights${search.toString() ? `?${search.toString()}` : ''}`);
    if (!res.ok) throw new Error('Lỗi lấy danh sách chuyến bay');
    const data = await res.json();
    return (data.flights || []) as Flight[];
  },

  async flightDetail(site: SiteCode | undefined, id: number): Promise<Flight> {
    // Prefer site-specific endpoint when site is known to avoid id collisions across shards
    const url = site ? `${API_BASE}/api/flights/${site}/${id}` : `${API_BASE}/api/flights/id/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Lỗi lấy chi tiết chuyến bay');
    const data = await res.json();
    return (data.flight as Flight);
  },

  async bookings(params: { region?: SiteCode | 'all'; email?: string; bookingCode?: string } = {}): Promise<Booking[]> {
    const search = new URLSearchParams();
    if (params.region) search.set('region', params.region);
    if (params.email) search.set('email', params.email);
    if (params.bookingCode) search.set('bookingCode', params.bookingCode);
    const url = `${API_BASE}/api/bookings${search.toString() ? `?${search.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Lỗi lấy danh sách đặt vé');
    const data = await res.json();
    return data.bookings as Booking[];
  },

  async createBooking(input: { flightId: number; site: SiteCode; customerName: string; customerEmail: string; customerPhone?: string; seatNumber?: string; nationalId?: string }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        flightId: input.flightId,
        site: input.site,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        seatNumber: input.seatNumber,
        nationalId: input.nationalId
      })
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err?.error || err?.message || 'Lỗi tạo đặt vé');
      } catch {
        throw new Error('Lỗi tạo đặt vé');
      }
    }
    const data = await res.json();
    return data.booking as Booking;
  },

  async cancelBooking(site: SiteCode, id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/bookings/${site}/${id}/cancel`, {
      method: 'PUT',
      headers: buildHeaders(false)
    });
    if (!res.ok) throw new Error('Lỗi hủy đặt vé');
  },

  async bookingLookup(pnr: string, lastName?: string): Promise<Booking & { site: SiteCode }>{
    const search = new URLSearchParams();
    search.set('pnr', pnr);
    if (lastName) search.set('lastName', lastName);
    const res = await fetch(`${API_BASE}/api/bookings/lookup?${search.toString()}`);
    if (!res.ok) throw new Error('Không tìm thấy đặt chỗ');
    const data = await res.json();
    return data.booking as Booking & { site: SiteCode };
  },

  async checkinStart(pnr: string, lastName?: string): Promise<{ site: SiteCode; booking: any; seatMap: { totalSeats: number; takenSeats: string[] } }>{
    const res = await fetch(`${API_BASE}/api/checkin/start`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ pnr, lastName })
    });
    if (!res.ok) throw new Error('Không bắt đầu check-in được');
    return res.json();
  },

  async checkinAssignSeat(site: SiteCode, bookingId: number, seatNumber: string): Promise<void>{
    const res = await fetch(`${API_BASE}/api/checkin/assign-seat`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ site, bookingId, seatNumber })
    });
    if (!res.ok) throw new Error('Không gán ghế được');
  },

  async checkinComplete(site: SiteCode, bookingId: number): Promise<{ boardingPass: { barcode: string; bookingCode: string; seat: string } }>{
    const res = await fetch(`${API_BASE}/api/checkin/complete`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ site, bookingId })
    });
    if (!res.ok) throw new Error('Không hoàn tất check-in được');
    return res.json();
  }
  ,

  async getBoardingPass(site: SiteCode, bookingId: number): Promise<{ boardingPass: { bookingCode: string; name: string; seat: string; flight: string; route: string; time: string; barcode: string } }>{
    const res = await fetch(`${API_BASE}/api/boarding-pass/${site}/${bookingId}`);
    if (!res.ok) throw new Error('Không lấy được boarding pass');
    return res.json();
  }
  ,
  async gateBoard(site: SiteCode, bookingId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/gate/board`, {
      method: 'POST', headers: buildHeaders(true), body: JSON.stringify({ site, bookingId })
    });
    if (!res.ok) throw new Error('Không quét được boarding pass');
  },
  async gateManifest(site: SiteCode, flightId: number): Promise<{ flight: any; passengers: any[]; stats: any }>{
    const search = new URLSearchParams({ site, flightId: String(flightId) });
    const res = await fetch(`${API_BASE}/api/gate/manifest?${search.toString()}`);
    if (!res.ok) throw new Error('Không lấy được manifest');
    return res.json();
  }
  ,

  // ===== GUEST BOOKING =====
  async createGuestBooking(input: { site: SiteCode; flightId: number; passengers: Array<{ name: string; dob?: string; gender?: string; nationalId?: string; seat?: string }>; contactEmail: string; contactPhone?: string }): Promise<{ bookingCode: string; totalAmount: number; totalAmountFormatted: string }>{
    const res = await fetch(`${API_BASE}/api/guest/bookings`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      try { const err = await res.json(); throw new Error(err?.error || 'Lỗi tạo đặt vé (khách)'); } catch { throw new Error('Lỗi tạo đặt vé (khách)'); }
    }
    return res.json();
  },

  async lookupGuestBooking(bookingCode: string, email: string, site?: SiteCode): Promise<any>{
    const search = new URLSearchParams({ bookingCode, email });
    if (site) search.set('site', site);
    const res = await fetch(`${API_BASE}/api/guest/bookings/lookup?${search.toString()}`);
    if (!res.ok) throw new Error('Không tìm thấy đặt chỗ');
    return res.json();
  }
};