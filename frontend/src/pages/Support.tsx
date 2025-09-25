import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Support: React.FC = () => {
    const [activeCategory, setActiveCategory] = React.useState('booking');
    const [openItems, setOpenItems] = React.useState<number[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
  
    const faqCategories = {
      booking: [
        {
          id: 1,
          question: 'Làm thế nào để đổi vé máy bay?',
          answer: 'Bạn có thể đổi vé trực tuyến bằng cách truy cập mục "Quản lý đặt chỗ"...'
        },
        {
          id: 2, 
          question: 'Thời hạn hủy vé là bao lâu?',
          answer: 'Tùy thuộc vào hạng vé bạn đã mua...'
        }
      ],
      baggage: [
        {
          id: 3,
          question: 'Hành lý xách tay được mang những gì?',
          answer: 'Hành lý xách tay tối đa 7kg cho hạng phổ thông...'
        }
      ],
      payment: [
        {
          id: 4,
          question: 'Các hình thức thanh toán được chấp nhận?',
          answer: 'Chúng tôi chấp nhận thẻ tín dụng, chuyển khoản ngân hàng...'
        }
      ]
    };
  
    const toggleItem = (id: number) => {
      setOpenItems(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    };
  
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Trung tâm Hỗ trợ</h1>
            <p className="text-lg text-gray-600">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
          </div>
  
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="font-semibold mb-2">Gọi điện thoại</h3>
              <p className="text-gray-600 text-sm mb-3">Hỗ trợ 24/7</p>
              <div className="text-indigo-600 font-semibold">1900-0000</div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold mb-2">Chat trực tuyến</h3>
              <p className="text-gray-600 text-sm mb-3">Phản hồi nhanh</p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Bắt đầu chat</button>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="font-semibold mb-2">Email hỗ trợ</h3>
              <p className="text-gray-600 text-sm mb-3">Phản hồi trong 24h</p>
              <div className="text-indigo-600 font-semibold">support@baynhanh.vn</div>
            </div>
          </div>
  
          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold mb-4">Câu hỏi thường gặp</h2>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 mb-4"
              />
              
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(faqCategories).map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-lg ${
                      activeCategory === category
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category === 'booking' && 'Đặt vé & Hủy vé'}
                    {category === 'baggage' && 'Hành lý'}
                    {category === 'payment' && 'Thanh toán'}
                  </button>
                ))}
              </div>
            </div>
  
            {/* FAQ Items */}
            <div className="p-6">
              {faqCategories[activeCategory as keyof typeof faqCategories]?.map(item => (
                <div key={item.id} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left py-4 font-medium flex justify-between items-center"
                  >
                    {item.question}
                    <span>{openItems.includes(item.id) ? '−' : '+'}</span>
                  </button>
                  {openItems.includes(item.id) && (
                    <div className="pb-4 text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
  
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Gửi yêu cầu hỗ trợ</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ tên</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Vấn đề cần hỗ trợ</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
                  <option>Chọn loại vấn đề</option>
                  <option>Đặt vé & Thanh toán</option>
                  <option>Hủy vé & Hoàn tiền</option>
                  <option>Hành lý</option>
                  <option>Check-in</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

export default Support;


