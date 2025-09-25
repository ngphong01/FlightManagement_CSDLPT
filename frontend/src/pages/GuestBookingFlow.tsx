import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../lib/api';

type Passenger = {
  name: string;
  dob?: string;
  gender?: string;
  nationalId?: string;
  seat?: string;
};

const GuestBookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [site, setSite] = useState<'hanoi'|'danang'|'saigon'>(
    (search.get('site') as any) || 'hanoi'
  );
  const [flightId, setFlightId] = useState<number>(() => Number(search.get('flightId') || 0));
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [passengers, setPassengers] = useState<Passenger[]>([{ name: '' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const totalPassengers = useMemo(() => passengers.length, [passengers]);

  const handleCountChange = (n: number) => {
    if (n < 1) n = 1;
    setPassengerCount(n);
    setPassengers((prev) => {
      const next = [...prev];
      if (n > prev.length) {
        while (next.length < n) next.push({ name: '' });
      } else if (n < prev.length) {
        next.length = n;
      }
      return next;
    });
  };

  const handlePassengerField = (idx: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !flightId || !contactEmail) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    if (passengers.some(p => !p.name || !p.name.trim())) {
      alert('Vui lòng nhập tên tất cả hành khách');
      return;
    }
    try {
      setSubmitting(true);
      const result = await api.createGuestBooking({ site, flightId, passengers, contactEmail, contactPhone });
      alert(`Đặt vé thành công! Mã PNR: ${result.bookingCode}`);
      navigate(`/guest/lookup?bookingCode=${result.bookingCode}&email=${encodeURIComponent(contactEmail)}&site=${site}`);
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo đặt vé');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Đặt vé nhanh (không cần đăng nhập)</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Site</label>
              <select className="w-full border rounded px-3 py-2" value={site} onChange={(e) => setSite(e.target.value as any)}>
                <option value="hanoi">Hanoi</option>
                <option value="danang">Danang</option>
                <option value="saigon">Saigon</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Flight ID</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={flightId || ''} onChange={(e) => setFlightId(Number(e.target.value))} placeholder="Nhập ID chuyến bay" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Số hành khách</label>
              <input type="number" min={1} className="w-full border rounded px-3 py-2" value={passengerCount} onChange={(e) => handleCountChange(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email liên hệ</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">SĐT liên hệ</label>
              <input type="tel" className="w-full border rounded px-3 py-2" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            {passengers.map((p, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded p-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Họ tên hành khách #{idx + 1}</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={p.name} onChange={(e) => handlePassengerField(idx, 'name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Ngày sinh (yyyy-mm-dd)</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={p.dob || ''} onChange={(e) => handlePassengerField(idx, 'dob', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Giới tính</label>
                  <select className="w-full border rounded px-3 py-2" value={p.gender || ''} onChange={(e) => handlePassengerField(idx, 'gender', e.target.value)}>
                    <option value="">—</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <button type="submit" className={`px-5 py-2 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={submitting}>
              {submitting ? 'Đang tạo đặt vé...' : `Tạo đặt vé (${totalPassengers} khách)`}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default GuestBookingFlow;


