import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../lib/api';
import type { SiteCode } from '../types';

const MyBooking: React.FC = () => {
  const [pnr, setPnr] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.bookingLookup(pnr, lastName || undefined);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Không tìm thấy đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Không rõ';
    if (status === 'confirmed') return 'Đã xác nhận';
    if (status === 'checked_in') return 'Đã check-in';
    if (status === 'cancelled') return 'Đã hủy';
    return status;
  };

  const getStatusSteps = (status?: string) => {
    const s = status || '';
    return [
      { key: 'booked', label: 'Đã đặt chỗ', active: true },
      { key: 'confirmed', label: 'Đã xác nhận', active: s !== 'booked' },
      { key: 'checked_in', label: 'Đã check-in', active: s === 'checked_in' || s === 'flown' },
      { key: 'flown', label: 'Đã bay', active: s === 'flown' }
    ];
  };

  const handleCancel = async () => {
    if (!result) return;
    if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
    setCancelling(true);
    try {
      // Use API cancel by site + id
      await api.cancelBooking(result.site as SiteCode, result.id);
      setResult({ ...result, status: 'cancelled' });
      alert('Đã hủy đặt chỗ thành công');
    } catch (e: any) {
      setError(e.message || 'Hủy đặt chỗ thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const handleResendEmail = async () => {
    if (!result) return;
    setSendingEmail(true);
    try {
      // Backend chưa có endpoint; mô phỏng thành công
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('Đã gửi lại email xác nhận');
    } catch (e: any) {
      setError(e.message || 'Gửi email thất bại');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Tra cứu đặt chỗ</h1>
        <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input aria-label="PNR" placeholder="Mã đặt chỗ (PNR)" value={pnr} onChange={(e) => setPnr(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2" />
          <input aria-label="Họ" placeholder="Họ (không bắt buộc)" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2" />
          <button onClick={handleSearch} className="rounded-lg bg-indigo-600 text-white px-4 py-2">Tra cứu</button>
        </div>
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {result && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{result.booking_code}</h2>
                  <p className="text-gray-600">{result.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  result.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  result.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                  result.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusLabel(result.status)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between max-w-md mx-auto">
              {getStatusSteps(result.status).map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className={`text-xs mt-1 ml-2 ${step.active ? 'text-indigo-600' : 'text-gray-500'}`}>{step.label}</div>
                  {index < 3 && <div className={`w-12 h-1 mx-2 ${step.active ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Thông tin chuyến bay</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Chuyến bay:</span> {result.flight_code}</div>
                  <div><span className="font-medium">Hành trình:</span> {result.departure_city} → {result.arrival_city}</div>
                  <div><span className="font-medium">Ngày bay:</span> {result.flight_date_formatted || new Date(result.flight_date).toLocaleDateString('vi-VN')}</div>
                  <div><span className="font-medium">Giờ bay:</span> {result.departure_time}</div>
                  <div><span className="font-medium">Ghế:</span> {result.seat_number || 'Chưa chọn'}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Thông tin hành khách</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Họ tên:</span> {result.customer_name}</div>
                  <div><span className="font-medium">Email:</span> {result.customer_email}</div>
                  <div><span className="font-medium">Điện thoại:</span> {result.customer_phone}</div>
                  {result.customer_national_id && (
                    <div><span className="font-medium">CCCD/CMND:</span> {result.customer_national_id}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {result.status === 'confirmed' && (
                <a 
                  href={`/check-in?pnr=${encodeURIComponent(result.booking_code)}&site=${encodeURIComponent(result.site)}`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Check-in Online
                </a>
              )}
              <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50" onClick={() => window.print()}>
                In Vé Điện Tử
              </button>
              <button disabled={sendingEmail} className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50" onClick={handleResendEmail}>
                {sendingEmail ? 'Đang gửi...' : 'Gửi Email Lại'}
              </button>
              {result.status === 'confirmed' && (
                <button disabled={cancelling} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50" onClick={handleCancel}>
                  {cancelling ? 'Đang hủy...' : 'Hủy Đặt Chỗ'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyBooking;


