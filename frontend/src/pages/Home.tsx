import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../lib/api';

type TripType = 'roundtrip' | 'oneway' | 'multicity';

interface Airport {
  code: string;
  name: string;
  city: string;
}

type CabinClass = 'economy' | 'premium' | 'business';

type Passengers = { adults: number; children: number; infants: number };

const PassengerSelector: React.FC<{
  passengers: Passengers;
  cabin: CabinClass;
  onPassengersChange: (p: Passengers) => void;
  onCabinChange: (c: CabinClass) => void;
  onClose: () => void;
}> = ({ passengers, cabin, onPassengersChange, onCabinChange, onClose }) => {
  const handlePassengerChange = React.useCallback((type: keyof Passengers, delta: number) => {
    onPassengersChange({
      ...passengers,
      [type]: Math.max(0, passengers[type] + delta)
    });
  }, [passengers, onPassengersChange]);

  const handleKeyPress = (e: React.KeyboardEvent, type: keyof Passengers, delta: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePassengerChange(type, delta);
    }
  };

  return (
    <div className="absolute z-10 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow p-3">
      <div className="space-y-2">
        {[
          { key: 'adults', label: 'Người lớn (16+)' },
          { key: 'children', label: 'Trẻ em (2-15)' },
          { key: 'infants', label: 'Em bé (<2)' }
        ].map((row: any) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{row.label}</span>
            <div className="flex items-center gap-2">
              <button type="button" className="px-2 py-1 rounded bg-gray-100" aria-label="Giảm"
                onClick={() => handlePassengerChange(row.key, -1)}
                onKeyDown={(e) => handleKeyPress(e as any, row.key, -1)} tabIndex={0}>-</button>
              <span className="w-6 text-center">{(passengers as any)[row.key]}</span>
              <button type="button" className="px-2 py-1 rounded bg-gray-100" aria-label="Tăng"
                onClick={() => handlePassengerChange(row.key, +1)}
                onKeyDown={(e) => handleKeyPress(e as any, row.key, +1)} tabIndex={0}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center gap-2 text-sm">
          {[
            { key: 'economy', label: 'Phổ thông' },
            { key: 'premium', label: 'Phổ thông Tiện nghi' },
            { key: 'business', label: 'Thương gia' }
          ].map((c: any) => (
            <button key={c.key} type="button" className={`px-3 py-1 rounded ${cabin === c.key ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`} onClick={() => onCabinChange(c.key)}> {c.label} </button>
          ))}
        </div>
      </div>
      <div className="mt-3 text-right">
        <button type="button" className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={onClose}>Xong</button>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [tripType, setTripType] = React.useState<TripType>('roundtrip');
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
    // Build ISO without timezone to avoid UTC shift
    const mmStr = String(mm).padStart(2, '0');
    const ddStr = String(dd).padStart(2, '0');
    return `${yyyy}-${mmStr}-${ddStr}`;
  };

  const today = React.useMemo(() => new Date(), []);
  const [departDateDMY, setDepartDateDMY] = React.useState<string>(() => formatDateToDMY(today));
  const [returnDateDMY, setReturnDateDMY] = React.useState<string>('');
  const [passengers, setPassengers] = React.useState({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = React.useState<'economy' | 'premium' | 'business'>('economy');
  const [airports, setAirports] = React.useState<Airport[]>([]);
  const [showPax, setShowPax] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    api.airports().then(setAirports).catch(() => {});
  }, []);

  const totalPassengers = React.useMemo(() => passengers.adults + passengers.children + passengers.infants, [passengers]);
  const paxLabel = `${totalPassengers} Hành khách, ${
    cabin === 'economy' ? 'Phổ thông' : cabin === 'premium' ? 'Phổ thông Tiện nghi' : 'Thương gia'
  }`;

  const handleSearch = React.useCallback(async () => {
    if (!from || !to) {
      alert('Vui lòng chọn điểm đi và điểm đến');
      return;
    }
    // Validate date
    const iso = parseDMYToISO(departDateDMY);
    if (!iso) {
      alert('Ngày đi không hợp lệ (dd/mm/yyyy)');
      return;
    }
    const retIso = returnDateDMY ? parseDMYToISO(returnDateDMY) : '';
    if (tripType === 'roundtrip' && !retIso) {
      alert('Vui lòng chọn ngày về (dd/mm/yyyy)');
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        departure: from,
        arrival: to,
        date: iso,
        tripType,
        adults: String(passengers.adults),
        children: String(passengers.children),
        infants: String(passengers.infants),
        cabin
      });
      if (retIso) params.set('returnDate', retIso);
      navigate(`/search?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, departDateDMY, returnDateDMY, tripType, passengers, cabin, navigate]);

  const quickChooseDestination = (destCode: string) => {
    setTo(destCode);
    if (from && destCode) handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* 1) Hero with main search */}
        <section className="relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542326237-94b1c5a538d1?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center" aria-hidden="true"></div>
          <div className="absolute inset-0 bg-indigo-900/50" aria-hidden="true"></div>
          <div className="relative max-w-6xl mx-auto px-4 py-12 text-white">
            <h1 className="text-3xl md:text-5xl font-bold">Biến Dự Định Thành Hành Trình</h1>
            <p className="mt-3 text-white/90">Ưu đãi đặc biệt cho các chuyến bay nội địa - Tiết kiệm lên đến 40%</p>

            <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl p-4 text-gray-800 shadow-lg">
              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-md text-sm ${tripType === 'roundtrip' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  aria-label="Chọn chuyến bay khứ hồi"
                  onClick={() => setTripType('roundtrip')}
                >Khứ hồi</button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-md text-sm ${tripType === 'oneway' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  aria-label="Chọn chuyến bay một chiều"
                  onClick={() => setTripType('oneway')}
                >Một chiều</button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-md text-sm ${tripType === 'multicity' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                  aria-label="Chọn chuyến bay nhiều chặng"
                  onClick={() => setTripType('multicity')}
                >Nhiều chặng</button>
              </div>

              {/* Form row */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Điểm đi</label>
                  <input
                    aria-label="Điểm đi"
                    list="airport-list"
                    placeholder="VD: HAN"
                    value={from}
                    onChange={(e) => setFrom(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Điểm đến</label>
                  <input
                    aria-label="Điểm đến"
                    list="airport-list"
                    placeholder="VD: SGN"
                    value={to}
                    onChange={(e) => setTo(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </div>
                <datalist id="airport-list">
                  {airports.map(a => (
                    <option key={a.code} value={a.code}>{`${a.city} (${a.code}) - ${a.name}`}</option>
                  ))}
                </datalist>

                <div>
                  <label className="text-xs text-gray-600">Ngày đi</label>
                  <input
                    aria-label="Ngày đi (dd/mm/yyyy)"
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={departDateDMY}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDepartDateDMY(v);
                      // keep DMY; convert to ISO only when searching
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </div>
                {tripType === 'roundtrip' && (
                  <div>
                    <label className="text-xs text-gray-600">Ngày về</label>
                    <input
                      aria-label="Ngày về (dd/mm/yyyy)"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={returnDateDMY}
                      onChange={(e) => {
                        const v = e.target.value;
                        setReturnDateDMY(v);
                        // keep DMY; convert to ISO only when searching
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>
                )}
              </div>

              {/* Pax & Class */}
              <div className="mt-3 flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    aria-haspopup="dialog"
                    aria-expanded={showPax}
                    onClick={() => setShowPax(!showPax)}
                  >{paxLabel}</button>
                  {showPax && (
                    <PassengerSelector
                      passengers={passengers}
                      cabin={cabin}
                      onPassengersChange={setPassengers}
                      onCabinChange={setCabin}
                      onClose={() => setShowPax(false)}
                    />
                  )}
                </div>
                <button
                  type="button"
                  className={`ml-auto rounded-lg text-white px-6 py-3 font-semibold ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  aria-label="Tìm chuyến bay"
                  onClick={handleSearch}
                  disabled={isLoading}
                >{isLoading ? 'Đang tìm...' : 'TÌM CHUYẾN BAY'}</button>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Promotions */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-3">Ưu đãi Đặc biệt</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[
              { id: 'vietjet-0d', title: 'Vietjet - Tưng bừng ưu đãi từ 0Đ', desc: 'Áp dụng nội địa. Đặt vé ngay!', img: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop' },
              { id: 'bamboo-30', title: 'Bamboo Airways - Mùa thu rực rỡ', desc: 'Giảm đến 30%', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop' },
              { id: 'vna-online', title: 'Vietnam Airlines - Bay xanh an toàn', desc: 'Ưu đãi online', img: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=1200&auto=format&fit=crop' }
            ].map((p) => (
              <a key={p.id} href={`/news/promotion/${p.id}`} className="group min-w-[280px] sm:min-w-[360px] bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-36 bg-cover bg-center group-hover:scale-105 transition-transform" style={{ backgroundImage: `url(${p.img})` }} aria-hidden="true"></div>
                <div className="p-3">
                  <div className="font-semibold group-hover:text-indigo-600 transition-colors">{p.title}</div>
                  <div className="text-sm text-gray-600">{p.desc}</div>
                  <span className="inline-block mt-2 text-sm rounded bg-indigo-600 text-white px-3 py-1">Xem chi tiết</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 3) Popular Destinations */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-xl font-semibold mb-4">Điểm đến Được Yêu Thích Nhất</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'DAD', name: 'Đà Nẵng', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1200&auto=format&fit=crop' },
              { code: 'PQC', name: 'Phú Quốc', img: 'https://images.unsplash.com/photo-1527285576433-4c88b0f07540?q=80&w=1200&auto=format&fit=crop' },
              { code: 'CXR', name: 'Nha Trang', img: 'https://images.unsplash.com/photo-1544551763-7ef03864b020?q=80&w=1200&auto=format&fit=crop' },
              { code: 'DLI', name: 'Đà Lạt', img: 'https://images.unsplash.com/photo-1544085311-11a028465b03?q=80&w=1200&auto=format&fit=crop' },
              { code: 'BKK', name: 'Bangkok', img: 'https://images.unsplash.com/photo-1518544801976-3e18869a7e70?q=80&w=1200&auto=format&fit=crop' },
              { code: 'SIN', name: 'Singapore', img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1200&auto=format&fit=crop' }
            ].map((d) => (
              <button key={d.code} type="button" className="text-left group relative rounded-xl overflow-hidden shadow bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={() => quickChooseDestination(d.code)} aria-label={`Chọn ${d.name}`}>
                <div className="h-40 bg-cover bg-center group-hover:scale-105 transition-transform" style={{ backgroundImage: `url(${d.img})` }} aria-hidden="true"></div>
                <div className="p-3">
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-gray-600">Từ 550.000 VND</div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
              </button>
            ))}
          </div>
        </section>

        {/* 4) Why choose us */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-xl font-semibold mb-4">Tại sao nên đặt vé với chúng tôi?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔒', title: 'Bảo mật & An toàn', desc: 'Giao dịch được mã hóa SSL. Thông tin của bạn luôn được bảo vệ.' },
              { icon: '💸', title: 'Giá tốt nhất', desc: 'So sánh giá từ nhiều hãng hàng không. Không phí ẩn.' },
              { icon: '📞', title: 'Hỗ trợ 24/7', desc: 'Đội ngũ chuyên nghiệp sẵn sàng hỗ trợ bạn.' },
              { icon: '📱', title: 'Trải nghiệm dễ dàng', desc: 'Đặt vé chỉ trong 3 bước đơn giản, tối ưu đa thiết bị.' }
            ].map((w, i) => (
              <div key={i} className="rounded-xl bg-white shadow p-4">
                <div className="text-2xl">{w.icon}</div>
                <div className="mt-2 font-semibold">{w.title}</div>
                <div className="text-sm text-gray-600">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5) Booking steps */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-xl font-semibold mb-4">Chỉ 3 Bước Đơn Giản Để Có Vé Máy Bay</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: 1, icon: '🔍', title: 'Tìm kiếm', desc: 'Chọn hành trình và ngày bay bạn mong muốn.' },
              { num: 2, icon: '📅', title: 'Chọn & Đặt chỗ', desc: 'So sánh các chuyến bay, nhập thông tin hành khách.' },
              { num: 3, icon: '💳', title: 'Thanh toán', desc: 'Xác nhận đặt chỗ an toàn và nhận vé ngay.' }
            ].map((s) => (
              <div key={s.num} className="rounded-xl bg-white shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">{s.num}</div>
                  <div className="text-2xl">{s.icon}</div>
                </div>
                <div className="mt-2 font-semibold">{s.title}</div>
                <div className="text-sm text-gray-600">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 6) Blog/News */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Cẩm nang Du lịch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'da-lat-5-trai-nghiem', title: '5 Trải nghiệm không thể bỏ lỡ ở Đà Lạt', img: 'https://images.unsplash.com/photo-1549388604-817d15aa0110?q=80&w=1200&auto=format&fit=crop' },
              { id: 'phu-quoc-an-gi', title: 'Ăn gì ở Phú Quốc trong 3 ngày?', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop' },
              { id: 'bi-kip-san-ve-re', title: 'Bí kíp săn vé rẻ mùa du lịch', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1200&auto=format&fit=crop' }
            ].map((b) => (
              <a key={b.id} href={`/news/article/${b.id}`} className="group rounded-xl bg-white shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-cover bg-center group-hover:scale-105 transition-transform" style={{ backgroundImage: `url(${b.img})` }} aria-hidden="true"></div>
                <div className="p-3">
                  <div className="font-semibold group-hover:text-indigo-600 transition-colors">{b.title}</div>
                  <span className="inline-block mt-2 text-sm rounded bg-gray-100 px-3 py-1">Đọc thêm</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;

