import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

const MOCK_ARTICLES = [
  { id: 'da-lat-5-trai-nghiem', title: '5 Trải nghiệm không thể bỏ lỡ ở Đà Lạt', featuredImage: 'https://images.unsplash.com/photo-1549388604-817d15aa0110?q=80&w=1600&auto=format&fit=crop', content: '<p>1) Săn mây ...</p>' },
  { id: 'phu-quoc-an-gi', title: 'Ăn gì ở Phú Quốc trong 3 ngày?', featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop', content: '<p>Bún quậy, gỏi cá trích ...</p>' }
];

const ArticleDetail: React.FC = () => {
  const { id } = useParams();
  const article = MOCK_ARTICLES.find(a => a.id === id) || MOCK_ARTICLES[0];
  const related = MOCK_ARTICLES.filter(a => a.id !== article.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb />
        <article className="bg-white rounded-xl shadow overflow-hidden">
          <img src={article.featuredImage} alt={article.title} className="w-full h-64 object-cover" />
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
            <div className="prose" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </article>

        <section className="mt-6">
          <h3 className="font-semibold mb-3">Bài viết liên quan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map(r => (
              <Link key={r.id} to={`/news/article/${r.id}`} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
                <img src={r.featuredImage} alt={r.title} className="w-full h-32 object-cover" />
                <div className="p-3 font-medium">{r.title}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;


