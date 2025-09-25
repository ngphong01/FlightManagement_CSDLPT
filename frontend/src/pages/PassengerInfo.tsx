import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

const PassengerInfo: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const flight = state?.flight;

  const [passenger, setPassenger] = React.useState({ fullName: '', email: '', phone: '', nationalId: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger.fullName || !passenger.email) return alert('Vui lòng nhập đầy đủ thông tin');
    if (!/^\d{12}$/.test(passenger.nationalId)) return alert('Vui lòng nhập đúng số CCCD 12 số');
    navigate('/payment', { state: { flight, passenger } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold mb-4">Thông Tin Hành Khách</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Họ tên</label>
            <input value={passenger.fullName} onChange={(e) => setPassenger({ ...passenger, fullName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" value={passenger.email} onChange={(e) => setPassenger({ ...passenger, email: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Điện thoại</label>
            <input value={passenger.phone} onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">CCCD (12 số)</label>
            <input aria-label="CCCD" inputMode="numeric" maxLength={12} placeholder="Nhập 12 số" value={passenger.nationalId} onChange={(e) => setPassenger({ ...passenger, nationalId: e.target.value.replace(/[^\d]/g, '') })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            <p className="text-xs text-gray-500 mt-1">Bắt buộc nhập đủ 12 số.</p>
          </div>
          <div className="pt-2">
            <button type="submit" className="rounded bg-indigo-600 text-white px-4 py-2">Tiếp tục thanh toán</button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default PassengerInfo;


