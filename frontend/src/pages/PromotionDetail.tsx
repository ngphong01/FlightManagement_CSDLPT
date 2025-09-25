import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

const MOCK_PROMOS = [
  { id: 'vietjet-0d', title: 'Vietjet mở bán vé 0đ', bannerImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1600&auto=format&fit=crop', excerpt: 'Ưu đãi 0đ cho chặng nội địa', content: '<p>Áp dụng từ 01/09 đến 30/09. Số lượng có hạn.</p>', preFill: { arrival: 'DAD' } },
  { id: 'bamboo-30', title: 'Bamboo giảm 30%', bannerImage: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1600&auto=format&fit=crop', excerpt: 'Mùa thu rực rỡ', content: '<p>Giảm giá 30% cho các chặng nội địa, đặt ngay!</p>', preFill: { arrival: 'HAN' } }
];

const PromotionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const promo = MOCK_PROMOS.find(p => p.id === id) || MOCK_PROMOS[0];
  const [showConditions, setShowConditions] = React.useState(false);

  const handleBook = () => {
    const params = new URLSearchParams();
    if (promo.preFill?.arrival) params.set('arrival', promo.preFill.arrival);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    params.set('date', tomorrow.toISOString().slice(0,10));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumb />
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <img src={promo.bannerImage} alt={promo.title} className="w-full h-60 object-cover" />
          <div className="p-6 space-y-3">
            <h1 className="text-2xl font-bold">{promo.title}</h1>
            <div className="prose" dangerouslySetInnerHTML={{ __html: promo.content }} />
            <div className="flex gap-3 pt-2">
              <button onClick={handleBook} className="rounded bg-indigo-600 text-white px-4 py-2">Đặt ngay</button>
              <button onClick={() => setShowConditions(true)} className="rounded border px-4 py-2">Xem điều kiện</button>
            </div>
          </div>
        </div>

        {showConditions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold">Điều kiện áp dụng</h2>
              <ul className="mt-3 list-disc pl-6 text-sm text-gray-700">
                <li>Số lượng vé ưu đãi có hạn.</li>
                <li>Không áp dụng cho giai đoạn cao điểm.</li>
                <li>Vé khuyến mãi không hoàn/hủy.</li>
              </ul>
              <div className="text-right mt-4"><button className="rounded bg-indigo-600 text-white px-4 py-2" onClick={() => setShowConditions(false)}>Đóng</button></div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PromotionDetail;


