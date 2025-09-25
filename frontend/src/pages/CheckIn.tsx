import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SeatMap from '../components/SeatMap';
import { api } from '../lib/api';
import type { SiteCode } from '../types';

const CheckIn: React.FC = () => {
  const url = new URL(window.location.href);
  const initialPnr = url.searchParams.get('pnr') || '';
  const initialSite = (url.searchParams.get('site') as SiteCode) || undefined;

  const [pnr, setPnr] = React.useState(initialPnr);
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [site, setSite] = React.useState<SiteCode | null>(initialSite || null);
  const [booking, setBooking] = React.useState<any | null>(null);
  const [seatMap, setSeatMap] = React.useState<{ totalSeats: number; takenSeats: string[] } | null>(null);
  const [seat, setSeat] = React.useState<string>('');
  const [completing, setCompleting] = React.useState(false);
  const pnrRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    if (!pnr.trim()) {
      setError('Vui lòng nhập mã PNR');
      pnrRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    setBooking(null);
    setSeatMap(null);
    try {
      const data = await api.checkinStart(pnr, lastName || undefined);
      setSite(data.site);
      setBooking(data.booking);
      setSeatMap(data.seatMap);
      setSeat(data.booking.seat_number || '');
    } catch (e: any) {
      setError(e.message || 'Không bắt đầu check-in được');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSeat = async (seatNumber: string) => {
    if (!site || !booking) return;
    setSeat(seatNumber);
    try {
      await api.checkinAssignSeat(site, booking.id, seatNumber);
    } catch (e: any) {
      setError(e.message || 'Không gán ghế được');
    }
  };

  const handleComplete = async () => {
    if (!site || !booking) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await api.checkinComplete(site, booking.id);
      alert(`Đã check-in. Boarding Pass: ${res.boardingPass.bookingCode} - Ghế ${res.boardingPass.seat}`);
    } catch (e: any) {
      setError(e.message || 'Không hoàn tất check-in được');
    } finally {
      setCompleting(false);
    }
  };

  React.useEffect(() => {
    if (initialPnr) {
      lastNameRef.current?.focus();
    } else {
      pnrRef.current?.focus();
    }
  }, [initialPnr]);

  React.useEffect(() => {
    return () => {
      setPnr('');
      setLastName('');
      setBooking(null);
      setSeat('');
      setSeatMap(null);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Check-in online</h1>
        <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input ref={pnrRef} aria-label="PNR" placeholder="Mã đặt chỗ (PNR)" value={pnr} onChange={(e) => setPnr(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div className="sm:col-span-1">
            <input ref={lastNameRef} aria-label="Họ" placeholder="Họ (không bắt buộc)" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div className="sm:col-span-3">
            <button onClick={handleStart} className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2">Bắt đầu check-in</button>
          </div>
        </div>
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {booking && seatMap && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">Hành khách:</span> {booking.customer_name}</div>
              <div><span className="font-medium">Chuyến bay:</span> {booking.flight_code}</div>
              <div><span className="font-medium">Ngày bay:</span> {booking.flight_date}</div>
              <div><span className="font-medium">Giờ bay:</span> {booking.departure_time}</div>
              <div className="sm:col-span-2"><span className="font-medium">Hành trình:</span> {booking.departure_city} → {booking.arrival_city}</div>
            </div>
            {booking?.status === 'checked_in' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-green-800">✓ Đã check-in thành công</div>
                <div>Mã đặt chỗ: <strong>{booking.booking_code}</strong></div>
                {booking.seat_number && <div>Ghế: <strong>{booking.seat_number}</strong></div>}
                <button onClick={() => window.print()} className="mt-2 rounded bg-green-600 text-white px-3 py-1">In Boarding Pass</button>
              </div>
            )}
            <div className="pt-2">
              <SeatMap totalSeats={seatMap.totalSeats} takenSeats={seatMap.takenSeats} value={seat} onChange={handleAssignSeat} />
            </div>
            <button disabled={completing} onClick={handleComplete} className="rounded-lg bg-indigo-600 text-white px-4 py-2">
              {completing ? 'Đang hoàn tất...' : 'Hoàn tất check-in'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CheckIn;


