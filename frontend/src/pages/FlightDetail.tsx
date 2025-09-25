import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { api } from '../lib/api';
import type { SiteCode } from '../types';

const FlightDetail: React.FC = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const url = new URL(window.location.href);
  const site = (url.searchParams.get('site') as SiteCode) || undefined;
  const [flight, setFlight] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        if (!flightId) return;
        const idNum = Number(flightId);
        const data = await api.flightDetail(site, idNum);
        setFlight(data);
      } catch (e: any) {
        setError(e.message || 'Lỗi tải chi tiết chuyến bay');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [flightId, site]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold mb-4">Chi Tiết Chuyến Bay</h1>
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {flight && (
          <div className="bg-white rounded-xl shadow p-4 space-y-2">
            <div className="font-semibold">{flight.flight_code} · {flight.airline}</div>
            <div className="text-sm text-gray-600">{flight.departure_city} → {flight.arrival_city} · {(flight.flight_date_formatted || flight.flight_date)} {flight.departure_time}</div>
            <div className="text-sm text-gray-600">Ghế trống: {flight.available_seats}</div>
            <div className="flex gap-3 pt-2">
              <button className="rounded bg-indigo-600 text-white px-3 py-2" onClick={() => navigate('/passenger', { state: { flight } })}>Đặt ngay</button>
              <button className="rounded bg-gray-100 px-3 py-2" onClick={() => window.history.back()}>Quay lại</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FlightDetail;


