import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);
  const map: Record<string, string> = {
    booking: 'Đặt Vé',
    search: 'Tìm Kiếm',
    flight: 'Chi Tiết Chuyến Bay',
    passenger: 'Thông Tin Hành Khách',
    payment: 'Thanh Toán',
    confirmation: 'Xác Nhận',
    'my-booking': 'Quản Lý Đặt Chỗ',
    'check-in': 'Check-in Online',
    news: 'Tin Tức',
    support: 'Hỗ Trợ',
    auth: 'Tài khoản',
    login: 'Đăng nhập',
    register: 'Đăng ký'
  };

  return (
    <nav className="text-sm text-gray-600 mb-4">
      <Link to="/" className="hover:text-indigo-600">Trang Chủ</Link>
      {pathnames.map((segment, idx) => {
        const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathnames.length - 1;
        return (
          <span key={to}>
            <span className="mx-2">/</span>
            {isLast ? (
              <span className="text-gray-900">{map[segment] || segment}</span>
            ) : (
              <Link to={to} className="hover:text-indigo-600">{map[segment] || segment}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;


