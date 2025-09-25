import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const News: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const perPage = 6;

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'promotions', label: 'Khuyến mãi' },
    { id: 'travel-tips', label: 'Cẩm nang du lịch' },
    { id: 'airline-news', label: 'Tin hãng hàng không' },
    { id: 'destination', label: 'Điểm đến' }
  ];

  const articles = [
    { id: 1, title: 'Vietjet mở bán vé 0đ cho các chặng nội địa', excerpt: 'Ưu đãi đặc biệt áp dụng từ ngày 01/09 đến 30/09/2025...', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop', category: 'promotions', date: '2025-09-01', readTime: '3 phút', featured: true },
    { id: 2, title: 'Bamboo Airways giảm 30% vé mùa thu', excerpt: 'Khám phá những điểm đến trong nước với mức giá hấp dẫn...', image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop', category: 'promotions', date: '2025-09-10', readTime: '2 phút', featured: false },
    { id: 3, title: '5 mẹo săn vé rẻ cho người mới', excerpt: 'Chọn thời điểm vàng, bật thông báo giá, linh hoạt ngày bay...', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800&auto=format&fit=crop', category: 'travel-tips', date: '2025-09-12', readTime: '4 phút', featured: false },
    { id: 4, title: 'Vietnam Airlines khai trương đường bay mới', excerpt: 'Mở thêm đường bay kết nối các điểm du lịch nổi tiếng...', image: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=800&auto=format&fit=crop', category: 'airline-news', date: '2025-09-14', readTime: '3 phút', featured: true },
    { id: 5, title: 'Phú Quốc mùa đẹp nhất trong năm', excerpt: 'Thời điểm lý tưởng để đến Phú Quốc, ăn gì, chơi gì...', image: 'https://images.unsplash.com/photo-1527285576433-4c88b0f07540?q=80&w=800&auto=format&fit=crop', category: 'destination', date: '2025-08-28', readTime: '5 phút', featured: false },
    { id: 6, title: 'Nha Trang: Hướng dẫn du lịch tự túc', excerpt: 'Lịch trình tham khảo 3 ngày 2 đêm, chi phí dự kiến...', image: 'https://images.unsplash.com/photo-1544551763-7ef03864b020?q=80&w=800&auto=format&fit=crop', category: 'destination', date: '2025-08-20', readTime: '6 phút', featured: false },
    { id: 7, title: 'Check-list trước khi bay', excerpt: 'Giấy tờ, hành lý, đến sân bay trước bao lâu...', image: 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?q=80&w=800&auto=format&fit=crop', category: 'travel-tips', date: '2025-08-10', readTime: '3 phút', featured: false },
  ];

  const filtered = articles.filter(a => {
    const inCategory = selectedCategory === 'all' || a.category === selectedCategory;
    const inSearch = (a.title + a.excerpt).toLowerCase().includes(searchTerm.toLowerCase());
    return inCategory && inSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => { setPage(1); }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tin tức & Khuyến mãi</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Cập nhật những ưu đãi mới nhất và thông tin du lịch hữu ích</p>
        </div>

        {/* Search + Categories */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input type="text" placeholder="Tìm kiếm tin tức..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === c.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {filtered.some(a => a.featured) && (
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
            {filtered.filter(a => a.featured).map(article => (
              <div key={article.id} className="md:flex">
                <div className="md:w-2/3">
                  <img src={article.image} alt={article.title} className="w-full h-64 md:h-full object-cover" />
                </div>
                <div className="md:w-1/3 p-6">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full mb-2">{categories.find(c => c.id === article.category)?.label}</span>
                  <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                  <p className="text-gray-600 mb-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{article.date}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <a href={`/news/promotion/${article.id}`} className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Xem chi tiết</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map(article => (
            <article key={article.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
              <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mb-2">{categories.find(c => c.id === article.category)?.label}</span>
                <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
                <a href={`/news/article/${article.id}`} className="mt-3 w-full inline-block bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 text-center">Đọc tiếp</a>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50">← Trước</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-2 rounded-lg ${page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{i + 1}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50">Tiếp →</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;


