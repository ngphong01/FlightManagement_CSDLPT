import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../lib/api';

const GuestBookingLookup: React.FC = () => {
  const [search] = useSearchParams();
  const [bookingCode, setBookingCode] = useState<string>((search.get('bookingCode') || '').toUpperCase());
  const [email, setEmail] = useState<string>(search.get('email') || '');
  const [site, setSite] = useState<'hanoi'|'danang'|'saigon'|''>((search.get('site') as any) || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!bookingCode || !email) {
      alert('Vui lòng nhập PNR và email');
      return;
    }
    try {
      setLoading(true);
      const data = await api.lookupGuestBooking(bookingCode, email, site || undefined);
      setResult(data.booking);
    } catch (err: any) {
      setResult(null);
      alert(err?.message || 'Không tìm thấy đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Tra cứu đặt chỗ (Khách)</h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Mã đặt chỗ (PNR)</label>
              <input className="w-full border rounded px-3 py-2" value={bookingCode} onChange={(e) => setBookingCode(e.target.value.toUpperCase())} placeholder="VD: ABC123" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Site (tùy chọn)</label>
              <select className="w-full border rounded px-3 py-2" value={site} onChange={(e) => setSite(e.target.value as any)}>
                <option value="">—</option>
                <option value="hanoi">Hanoi</option>
                <option value="danang">Danang</option>
                <option value="saigon">Saigon</option>
              </select>
            </div>
          </div>
          <div className="text-right">
            <button onClick={handleLookup} className={`px-5 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={loading}>
              {loading ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Kết quả</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-600">PNR:</span> <span className="font-medium">{result.booking_code}</span></div>
              <div><span className="text-gray-600">Email:</span> <span className="font-medium">{result.customer_email}</span></div>
              <div><span className="text-gray-600">Chuyến bay:</span> <span className="font-medium">{result.flight_code}</span></div>
              <div><span className="text-gray-600">Tuyến:</span> <span className="font-medium">{result.departure_city} → {result.arrival_city}</span></div>
              <div><span className="text-gray-600">Ngày/Giờ:</span> <span className="font-medium">{result.flight_date} {result.departure_time}</span></div>
              <div><span className="text-gray-600">Trạng thái:</span> <span className="font-medium">{result.status}</span></div>
              <div><span className="text-gray-600">Số khách:</span> <span className="font-medium">{Array.isArray(result.passengers) ? result.passengers.length : '-'}</span></div>
              <div><span className="text-gray-600">Khu vực:</span> <span className="font-medium">{result.site}</span></div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GuestBookingLookup;


