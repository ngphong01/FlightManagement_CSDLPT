import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

const Confirmation: React.FC = () => {
  const url = new URL(window.location.href);
  const booking = url.searchParams.get('booking');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold">Xác Nhận Đặt Chỗ</h1>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-semibold">Đặt chỗ thành công!</div>
          <div className="text-sm text-gray-600 mt-1">Mã đặt chỗ của bạn: <span className="font-mono font-semibold">{booking}</span></div>
          <div className="mt-4">
            <a href={`/my-booking`} className="rounded bg-indigo-600 text-white px-4 py-2">Quản lý đặt chỗ</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Confirmation;


