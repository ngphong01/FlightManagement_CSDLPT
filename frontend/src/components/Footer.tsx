import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm text-gray-700">
        {/* About */}
        <div>
          <div className="font-semibold mb-3">Về Chúng Tôi</div>
          <p className="text-gray-600">BayNhanh là nền tảng đặt vé máy bay nhanh chóng, an toàn và tiện lợi.</p>
          <div className="mt-3 space-y-1">
            <a href="#" className="block hover:text-indigo-600">Tầm nhìn & Sứ mệnh</a>
            <a href="#" className="block hover:text-indigo-600">Tuyển dụng</a>
            <a href="#" className="block hover:text-indigo-600">Liên hệ / Bản đồ</a>
          </div>
        </div>

        {/* Useful links */}
        <div>
          <div className="font-semibold mb-3">Thông tin Hữu ích</div>
          <div className="space-y-1">
            <a href="#" className="block hover:text-indigo-600">Câu hỏi thường gặp (FAQ)</a>
            <a href="#" className="block hover:text-indigo-600">Điều khoản & Điều kiện sử dụng</a>
            <a href="#" className="block hover:text-indigo-600">Chính sách bảo mật</a>
            <a href="#" className="block hover:text-indigo-600">Chính sách hoàn vé & đổi vé</a>
            <a href="#" className="block hover:text-indigo-600">Chính sách hành lý</a>
            <a href="#" className="block hover:text-indigo-600">Hướng dẫn thanh toán</a>
          </div>
        </div>

        {/* Airlines */}
        <div>
          <div className="font-semibold mb-3">Hãng hàng không</div>
          <div className="flex flex-wrap items-center gap-2">
            {['Vietnam Airlines','Bamboo','Vietjet','Pacific'].map((n) => (
              <div key={n} className="px-2 py-1 rounded border text-xs text-gray-600">{n}</div>
            ))}
          </div>
        </div>

        {/* Connect & Payment */}
        <div>
          <div className="font-semibold mb-3">Kết nối với chúng tôi</div>
          <div className="flex items-center gap-3 text-xl">
            <a href="#" aria-label="Facebook" className="hover:text-indigo-600"><i className="fab fa-facebook"></i></a>
            <a href="#" aria-label="Zalo" className="hover:text-indigo-600"><i className="fas fa-comment"></i></a>
            <a href="#" aria-label="Instagram" className="hover:text-indigo-600"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="YouTube" className="hover:text-indigo-600"><i className="fab fa-youtube"></i></a>
            <a href="#" aria-label="Tiktok" className="hover:text-indigo-600"><i className="fab fa-tiktok"></i></a>
          </div>
          <div className="mt-4 font-semibold mb-2">Chấp nhận thanh toán</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {['Visa','Mastercard','JCB','AMEX','MoMo','ZaloPay','ATM nội địa'].map((p) => (
              <div key={p} className="px-2 py-1 rounded border">{p}</div>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium">Đăng ký nhận ưu đãi</div>
            <div className="mt-2 flex items-center gap-2">
              <input aria-label="Email" placeholder="Email của bạn" className="flex-1 rounded-lg border border-gray-200 px-3 py-2" />
              <button className="rounded-lg bg-indigo-600 text-white px-3 py-2">Đăng ký</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} BayNhanh. Bảo lưu mọi quyền.</div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded border">Đã đăng ký Bộ Công Thương</div>
            <div className="px-2 py-1 rounded border">Bảo mật SSL</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


