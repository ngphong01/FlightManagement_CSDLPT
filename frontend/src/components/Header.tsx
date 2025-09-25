import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const [openBooking, setOpenBooking] = React.useState(false);
  const [openUser, setOpenUser] = React.useState(false);
  const [openLang, setOpenLang] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="Trang chủ">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <i className="fas fa-plane"></i>
          </div>
          <div className="font-semibold">BayNhanh</div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <div className="relative">
            <button
              type="button"
              className="px-3 py-2 rounded hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={openBooking}
              onClick={() => setOpenBooking(!openBooking)}
              onBlur={() => setTimeout(() => setOpenBooking(false), 150)}
            >Đặt Vé ▾</button>
            {openBooking && (
              <div className="absolute mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow">
                <Link to="/booking" className="block px-3 py-2 hover:bg-gray-50" tabIndex={0}>Vé máy bay</Link>
                <Link to="/booking?combo=1" className="block px-3 py-2 hover:bg-gray-50" tabIndex={0}>Vé máy bay + Khách sạn</Link>
              </div>
            )}
          </div>
          <Link to="/my-booking" className="px-3 py-2 rounded hover:bg-gray-100">Kiểm tra Đặt chỗ</Link>
          <Link to="/check-in" className="px-3 py-2 rounded hover:bg-gray-100">Check-in Online</Link>
          <Link to="/support" className="px-3 py-2 rounded hover:bg-gray-100">Hỗ trợ / Trợ giúp</Link>
          <Link to="/news" className="px-3 py-2 rounded hover:bg-gray-100">Tin tức / Khuyến mãi</Link>
        </nav>

        {/* Right - Auth + Language */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={openUser}
              onClick={() => setOpenUser(!openUser)}
              onBlur={() => setTimeout(() => setOpenUser(false), 150)}
            >Đăng nhập</button>
            {openUser && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50">Đăng nhập</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50">Đăng ký</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className="px-3 py-2 rounded hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={openLang}
              onClick={() => setOpenLang(!openLang)}
              onBlur={() => setTimeout(() => setOpenLang(false), 150)}
            >Tiếng Việt ▾</button>
            {openLang && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50">Tiếng Việt</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50">English</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50">中文</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


