import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';

type TripType = 'roundtrip' | 'oneway';
type CabinClass = 'economy' | 'premium' | 'business';

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const isCombo = params.get('combo') === '1';

  const [tripType, setTripType] = React.useState<TripType>('roundtrip');
  const [airports, setAirports] = React.useState<Array<{ code: string; name: string; city: string }>>([]);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const formatDateToDMY = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const parseDMYToISO = (s: string): string | null => {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const yyyy = parseInt(m[3], 10);
    const dt = new Date(yyyy, mm - 1, dd);
    if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
    // Build ISO by string to avoid timezone shift
    const mmStr = String(mm).padStart(2, '0');
    const ddStr = String(dd).padStart(2, '0');
    return `${yyyy}-${mmStr}-${ddStr}`;
  };

  const [departDateDMY, setDepartDateDMY] = React.useState('');
  const [returnDateDMY, setReturnDateDMY] = React.useState('');
  const [passengers, setPassengers] = React.useState({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = React.useState<CabinClass>('economy');
  const [showPax, setShowPax] = React.useState(false);

  React.useEffect(() => {
    api.airports().then(setAirports).catch(() => {});
    const today = new Date();
    setDepartDateDMY(formatDateToDMY(today));
  }, []);

  const paxLabel = `${passengers.adults + passengers.children + passengers.infants} Hành khách, ${
    cabin === 'economy' ? 'Phổ thông' : cabin === 'premium' ? 'Phổ thông Tiện nghi' : 'Thương gia'
  }`;

  const handleSearch = () => {
    const departISO = parseDMYToISO(departDateDMY || '');
    const returnISO = returnDateDMY ? parseDMYToISO(returnDateDMY) : '';

    if (!from || !to || !departISO) {
      alert('Vui lòng chọn đầy đủ điểm đi, điểm đến, ngày đi');
      return;
    }
    if (tripType === 'roundtrip' && !returnISO) {
      alert('Vui lòng chọn ngày về');
      return;
    }

    const s = new URLSearchParams({
      departure: from,
      arrival: to,
      date: departISO!,
      tripType,
      adults: String(passengers.adults),
      children: String(passengers.children),
      infants: String(passengers.infants),
      cabin
    });
    if (returnISO) s.set('returnDate', returnISO);
    navigate(`/search?${s.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-indigo-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{isCombo ? 'Combo Vé máy bay + Khách sạn' : 'Đặt vé máy bay'}</h1>
          <p className="mt-2 opacity-90">Tìm và đặt chuyến bay phù hợp nhất với bạn</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button 
              className={`px-4 py-2 rounded-lg ${tripType === 'roundtrip' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
              onClick={() => setTripType('roundtrip')}
            >Khứ hồi</button>
            <button 
              className={`px-4 py-2 rounded-lg ${tripType === 'oneway' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
              onClick={() => setTripType('oneway')}
            >Một chiều</button>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Điểm đi</label>
              <select 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Chọn điểm đi</option>
                {airports.map(a => (
                  <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Điểm đến</label>
              <select 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Chọn điểm đến</option>
                {airports.map(a => (
                  <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ngày đi</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={departDateDMY}
                onChange={(e) => setDepartDateDMY(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {tripType === 'roundtrip' && (
              <div>
                <label className="block text-sm font-medium mb-1">Ngày về</label>
                <input 
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={returnDateDMY}
                  onChange={(e) => setReturnDateDMY(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium mb-1">Hành khách</label>
              <button 
                onClick={() => setShowPax(!showPax)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left"
                aria-haspopup="dialog"
                aria-expanded={showPax}
              >
                {paxLabel}
              </button>
              {showPax && (
                <div className="absolute z-10 mt-1 w-64 bg-white border rounded-lg shadow-lg p-4">
                  <div className="space-y-3 text-sm">
                    {[
                      { key: 'adults', label: 'Người lớn (16+)' },
                      { key: 'children', label: 'Trẻ em (2-15)' },
                      { key: 'infants', label: 'Em bé (<2)' }
                    ].map((row: any) => (
                      <div key={row.key} className="flex justify-between items-center">
                        <span>{row.label}</span>
                        <div className="flex items-center gap-2">
                          <button aria-label="Giảm" className="px-2 py-1 rounded bg-gray-100" onClick={() => setPassengers(p => ({ ...p, [row.key]: Math.max(0, (p as any)[row.key] - 1) }))}>-</button>
                          <span className="w-6 text-center">{(passengers as any)[row.key]}</span>
                          <button aria-label="Tăng" className="px-2 py-1 rounded bg-gray-100" onClick={() => setPassengers(p => ({ ...p, [row.key]: (p as any)[row.key] + 1 }))}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex gap-2">
                      {(['economy','premium','business'] as CabinClass[]).map(c => (
                        <button 
                          key={c}
                          className={`px-2 py-1 text-sm rounded ${cabin === c ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                          onClick={() => setCabin(c)}
                        >
                          {c === 'economy' ? 'Phổ thông' : c === 'premium' ? 'Tiện nghi' : 'Thương gia'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={() => setShowPax(false)}>Xong</button>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1 flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700"
              >
                Tìm chuyến bay
              </button>
            </div>
          </div>
        </div>

        {isCombo && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ưu đãi Combo đặc biệt</h2>
            <div className="text-gray-600">
              <p>Tiết kiệm đến 20% khi đặt vé máy bay + khách sạn cùng lúc!</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Combo Phổ thông</h3>
                  <p>Vé máy bay + Khách sạn 3⭐</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Combo Cao cấp</h3>
                  <p>Vé máy bay + Khách sạn 5⭐</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Booking;


