import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const flight = state?.flight;
  const passenger = state?.passenger;
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [processing, setProcessing] = React.useState(false);
  const [bookAsGuest, setBookAsGuest] = React.useState<boolean>(() => !isLoggedIn);

  React.useEffect(() => {
    setBookAsGuest(!isLoggedIn);
  }, [isLoggedIn]);

  const handlePay = async () => {
    if (!flight?.id || !flight?.site) {
      alert('Thiếu thông tin chuyến bay hoặc site. Vui lòng quay lại và chọn lại.');
      return;
    }
    if (!passenger?.fullName || !passenger?.email) {
      alert('Vui lòng nhập họ tên và email.');
      return;
    }
    setProcessing(true);
    try {
      if (!isLoggedIn && bookAsGuest) {
        const guest = await api.createGuestBooking({
          site: flight.site,
          flightId: Number(flight.id),
          passengers: [
            {
              name: passenger.fullName,
              dob: passenger.dob,
              gender: passenger.gender,
              nationalId: passenger.nationalId
            }
          ],
          contactEmail: passenger.email,
          contactPhone: passenger.phone
        });
        navigate(`/guest/lookup?bookingCode=${encodeURIComponent(guest.bookingCode)}&email=${encodeURIComponent(passenger.email)}&site=${flight.site}`);
      } else {
        const created = await api.createBooking({
          flightId: Number(flight.id),
          site: flight.site,
          customerName: passenger.fullName,
          customerEmail: passenger.email,
          customerPhone: passenger.phone,
          seatNumber: undefined,
          nationalId: passenger.nationalId
        });
        const bookingCode = (created as any).bookingCode || (created as any).booking_code;
        if (!bookingCode) {
          alert('Đặt chỗ thành công nhưng không nhận được mã đặt chỗ.');
          return;
        }
        navigate(`/confirmation?booking=${encodeURIComponent(bookingCode)}`);
      }
    } catch (e: any) {
      alert(e?.message || 'Thanh toán/đặt chỗ thất bại');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold">Thanh Toán</h1>
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <div className="font-semibold">Tóm tắt</div>
          <div className="text-sm text-gray-700">
            {flight?.flight_code} · {flight?.departure_city} → {flight?.arrival_city} · {flight?.flight_date} {flight?.departure_time}
          </div>
          <div className="text-sm text-gray-700">Hành khách: {passenger?.fullName}</div>
          {passenger?.email && (
            <div className="text-sm text-gray-700">Email: {passenger.email}</div>
          )}
          {passenger?.phone && (
            <div className="text-sm text-gray-700">SĐT: {passenger.phone}</div>
          )}
          {passenger?.nationalId && (
            <div className="text-sm text-gray-700">CCCD/CMND: {passenger.nationalId}</div>
          )}

          {!isLoggedIn && (
            <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 p-3 text-sm flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Mẹo: Đăng nhập để quản lý vé và tích điểm dễ dàng hơn</div>
                <div className="text-yellow-700/90">Bạn vẫn có thể đặt vé ngay ở chế độ Khách. Tuy nhiên, khi đăng nhập bạn sẽ quản lý lịch sử đặt chỗ, nhận ưu đãi và tích điểm thành viên.</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/auth/login', { state: { redirect: '/payment' } })}
                className="shrink-0 inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-white hover:bg-yellow-700"
              >Đăng nhập</button>
            </div>
          )}
          {!isLoggedIn && (
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" checked={bookAsGuest} onChange={(e) => setBookAsGuest(e.target.checked)} />
                <span>Đặt vé không cần đăng nhập (Guest Booking)</span>
              </label>
            </div>
          )}
          <div className="pt-3">
            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              aria-label="Thanh toán và đặt chỗ"
            >
              {processing ? 'Đang xử lý...' : 'Thanh toán & Đặt chỗ'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;