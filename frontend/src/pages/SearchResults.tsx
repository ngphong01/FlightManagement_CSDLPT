import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

const SearchResults: React.FC = () => {
  const [flights, setFlights] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(window.location.href);
      const departure = url.searchParams.get('departure') || undefined;
      const arrival = url.searchParams.get('arrival') || undefined;
      let date = url.searchParams.get('date') || undefined;
      const region = (url.searchParams.get('region') as any) || undefined;
      // Default date to today if missing
      if (!date && departure && arrival) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        date = `${yyyy}-${mm}-${dd}`;
        url.searchParams.set('date', date);
        window.history.replaceState({}, '', url.toString());
      }
      const data = await api.flights({ departure, arrival, date, region });
      setFlights(data);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải kết quả');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 10000); // realtime polling mỗi 10s
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Kết quả tìm kiếm</h1>
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && flights.length === 0 && (
          <div className="rounded-xl bg-white shadow p-6 text-center text-gray-600">Không tìm thấy chuyến bay phù hợp.</div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {flights.map((f) => (
            <div key={`${f.site || 'shard'}-${f.id}`} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{f.flight_code} · {f.airline}</div>
                <div className="text-sm text-gray-600">{f.departure_city} → {f.arrival_city} · {(f.flight_date_formatted || f.flight_date)} {f.departure_time}</div>
                <div className="text-sm text-gray-600">Ghế trống: {f.available_seats}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{Number(f.price).toLocaleString('vi-VN')} đ</div>
                <Link className="inline-block mt-2 rounded-lg bg-indigo-600 text-white px-3 py-2" to={`/flight/${f.id}?site=${f.site || 'hanoi'}`}>Đặt ngay</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;


