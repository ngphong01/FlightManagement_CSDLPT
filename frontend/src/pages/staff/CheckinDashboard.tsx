import React from 'react';
import { api } from '../../lib/api';
import { useStaffShortcuts } from '../../hooks/useStaffShortcuts';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const CheckinDashboard: React.FC = () => {
  const [flight, setFlight] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState<any | null>(null);
  const [site, setSite] = React.useState<'hanoi'|'danang'|'saigon'>('hanoi');
  const [assignSeat, setAssignSeat] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [printing, setPrinting] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const offline = useOfflineQueue({
    checkin_assign: async (payload) => { await api.checkinAssignSeat(payload.site, payload.bookingId, payload.seatNumber); },
    checkin_complete: async (payload) => { await api.checkinComplete(payload.site, payload.bookingId); }
  });

  const handleLookup = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const booking = await api.bookingLookup(query);
      setResult(booking);
      setSite((booking as any).site);
    } catch (e:any) { alert(e?.message || 'Không tìm thấy'); } finally { setLoading(false); }
  };

  const handleAssignSeat = async () => {
    if (!result?.id || !assignSeat) return;
    try {
      if (offline.isOnline) {
        await api.checkinAssignSeat(site, result.id, assignSeat.toUpperCase());
      } else {
        offline.enqueue({ type: 'checkin_assign', payload: { site, bookingId: result.id, seatNumber: assignSeat.toUpperCase() } });
      }
      alert('Đã gán ghế'); setResult({ ...result, seat_number: assignSeat.toUpperCase() });
    } catch(e:any){ alert(e?.message || 'Lỗi gán ghế'); }
  };

  const handleComplete = async () => {
    if (!result?.id) return;
    try {
      if (offline.isOnline) {
        await api.checkinComplete(site, result.id);
      } else {
        offline.enqueue({ type: 'checkin_complete', payload: { site, bookingId: result.id } });
      }
      alert('Check-in hoàn tất');
    } catch(e:any){ alert(e?.message || 'Lỗi hoàn tất'); }
  };

  const handlePrintBP = async () => {
    if (!result?.id) return;
    setPrinting(true);
    try {
      const data = await api.getBoardingPass(site, result.id);
      const bp = data.boardingPass;
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Boarding Pass</title>
        <style>
          body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;}
          .card{width:380px;border:1px solid #ddd;border-radius:12px;padding:16px;margin:16px auto}
          .row{display:flex;justify-content:space-between;margin:6px 0}
          .title{font-weight:700;margin-bottom:8px}
          .barcode{font-size:18px;letter-spacing:3px;margin-top:10px}
        </style></head><body>
        <div class='card'>
          <div class='title'>BOARDING PASS</div>
          <div class='row'><span>PNR</span><span>${bp.bookingCode}</span></div>
          <div class='row'><span>Hành khách</span><span>${bp.name}</span></div>
          <div class='row'><span>Chuyến</span><span>${bp.flight}</span></div>
          <div class='row'><span>Hành trình</span><span>${bp.route}</span></div>
          <div class='row'><span>Thời gian</span><span>${bp.time}</span></div>
          <div class='row'><span>Ghế</span><span>${bp.seat}</span></div>
          <div class='barcode'>${bp.barcode}</div>
        </div>
        <script>window.print();</script>
      </body></html>`;
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        alert('Trình duyệt chặn cửa sổ in');
      }
    } catch (e:any) { alert(e?.message || 'Không in được boarding pass'); }
    finally { setPrinting(false); }
  };

  // Keyboard shortcuts: Ctrl+1 focus tìm PNR, Ctrl+3 in BP, Ctrl+Enter hoàn tất
  useStaffShortcuts({
    onFocusScan: () => searchRef.current?.focus(),
    onPrint: handlePrintBP,
    onComplete: handleComplete
  });

  // no need for separate isOnline; using offline.isOnline

  return (
    <div className="p-4 space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className={`text-xs px-3 py-1 rounded inline-block ${offline.isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Trạng thái mạng: {offline.isOnline ? 'Online' : 'Offline'}</div>
        <div className="text-right text-xs">
          Queue: <span className="inline-block px-2 py-0.5 rounded bg-gray-100">{offline.queue.length}</span>
          <button className="ml-2 border rounded px-2 py-1" onClick={()=>offline.processQueue()} disabled={!offline.isOnline}>Đồng bộ ngay</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="flex items-center justify-between">
          <div>Nhân viên: Nguyễn Văn A • Quầy: 15 • Ca: Sáng</div>
          <div>Sân bay: HAN • Ngày: {new Date().toLocaleDateString('vi-VN')}</div>
        </div>
      </div>
      {/* Shortcuts help */}
      <div className="bg-white rounded-xl shadow p-3 text-xs">
        <div className="font-semibold mb-1">Phím tắt</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div><span className="inline-block bg-gray-100 px-2 py-0.5 rounded">Ctrl+1</span> Focus ô tìm</div>
          <div><span className="inline-block bg-gray-100 px-2 py-0.5 rounded">Ctrl+3</span> In Boarding Pass</div>
          <div><span className="inline-block bg-gray-100 px-2 py-0.5 rounded">Ctrl+Enter</span> Hoàn tất check-in</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="font-semibold mb-2">CHUYẾN BAY ĐANG LÀM VIỆC</div>
        <select className="border rounded px-3 py-2" value={flight} onChange={(e)=>setFlight(e.target.value)}>
          <option value="">-- Chọn chuyến bay --</option>
          <option value="VN124">VN124 - HAN→SGN (08:00-10:00)</option>
          <option value="VN126">VN126 - HAN→DAD (17:00-18:30)</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="font-semibold mb-2">TÌM NHANH HÀNH KHÁCH</div>
        <div className="flex items-center gap-2">
          <button className="border rounded px-3 py-2">Quét Passport</button>
          <button className="border rounded px-3 py-2">Quét Mã Vạch Vé</button>
          <input className="border rounded px-3 py-2 flex-1" placeholder="Nhập PNR hoặc Họ tên" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <button className="bg-indigo-600 text-white rounded px-3 py-2" onClick={handleLookup} disabled={loading}>{loading?'Đang tìm...':'Tìm'}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="font-semibold mb-2">DANH SÁCH HÀNH KHÁCH</div>
        {!result && <div className="text-gray-500">Chưa có kết quả</div>}
        {result && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded p-3">
              <div><b>PNR:</b> {result.booking_code}</div>
              <div><b>Hành khách:</b> {result.customer_name}</div>
              <div><b>Chuyến:</b> {result.flight_code} • {result.departure_city} → {result.arrival_city}</div>
              <div><b>Ngày/Giờ:</b> {result.flight_date} {result.departure_time}</div>
              <div><b>Ghế:</b> {result.seat_number || 'Chưa chọn'}</div>
              <div><b>Site:</b> {(result as any).site}</div>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="block mb-1">Gán ghế</label>
                <input className="border rounded px-3 py-2" placeholder="VD: 12A" value={assignSeat} onChange={(e)=>setAssignSeat(e.target.value)} />
              </div>
              <button className="border rounded px-3 py-2" onClick={handleAssignSeat}>Gán</button>
              <button className="bg-green-600 text-white rounded px-3 py-2" onClick={handleComplete}>Hoàn tất Check-in</button>
              <button className="bg-gray-800 text-white rounded px-3 py-2" onClick={handlePrintBP} disabled={printing}>{printing?'Đang in...':'In Boarding Pass'}</button>
            </div>
          <div className="bg-yellow-50 rounded p-3 text-sm">
            <div className="font-semibold text-yellow-800">Tác vụ chờ đồng bộ ({offline.queue.length})</div>
            <ul className="mt-1 list-disc ml-5">
              {offline.queue.map(t => (
                <li key={t.id} className="flex items-center justify-between">
                  <span>{t.type} {t.payload?.seatNumber ? `• ${t.payload.seatNumber}` : ''}</span>
                  <button className="underline" onClick={()=>offline.remove(t.id)}>Hủy</button>
                </li>
              ))}
            </ul>
            {!offline.isOnline && <div className="text-xs text-yellow-800 mt-1">Sẽ tự gửi khi Online.</div>}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinDashboard;




/* Duplicate block removed
const CheckinDashboard: React.FC = () => {
  const [flight, setFlight] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState<any | null>(null);
  const [site, setSite] = React.useState<'hanoi'|'danang'|'saigon'>('hanoi');
  const [assignSeat, setAssignSeat] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [printing, setPrinting] = React.useState(false);

  const handleLookup = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const booking = await api.bookingLookup(query);
      setResult(booking);
      setSite((booking as any).site);
    } catch (e:any) { alert(e?.message || 'Không tìm thấy'); } finally { setLoading(false); }
  };

  const handleAssignSeat = async () => {
    if (!result?.id || !assignSeat) return;
    try { await api.checkinAssignSeat(site, result.id, assignSeat.toUpperCase()); alert('Đã gán ghế'); setResult({ ...result, seat_number: assignSeat.toUpperCase() }); } catch(e:any){ alert(e?.message || 'Lỗi gán ghế'); }
  };

  const handleComplete = async () => {
    if (!result?.id) return;
    try { const r = await api.checkinComplete(site, result.id); alert('Check-in hoàn tất'); console.log(r); } catch(e:any){ alert(e?.message || 'Lỗi hoàn tất'); }
  };

  const handlePrintBP = async () => {
    if (!result?.id) return;
    setPrinting(true);
    try {
      const data = await api.getBoardingPass(site, result.id);
      const bp = data.boardingPass;
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Boarding Pass</title>
        <style>
          body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;}
          .card{width:380px;border:1px solid #ddd;border-radius:12px;padding:16px;margin:16px auto}
          .row{display:flex;justify-content:space-between;margin:6px 0}
          .title{font-weight:700;margin-bottom:8px}
          .barcode{font-size:18px;letter-spacing:3px;margin-top:10px}
        </style></head><body>
        <div class='card'>
          <div class='title'>BOARDING PASS</div>
          <div class='row'><span>PNR</span><span>${bp.bookingCode}</span></div>
          <div class='row'><span>Hành khách</span><span>${bp.name}</span></div>
          <div class='row'><span>Chuyến</span><span>${bp.flight}</span></div>
          <div class='row'><span>Hành trình</span><span>${bp.route}</span></div>
          <div class='row'><span>Thời gian</span><span>${bp.time}</span></div>
          <div class='row'><span>Ghế</span><span>${bp.seat}</span></div>
          <div class='barcode'>${bp.barcode}</div>
        </div>
        <script>window.print();</script>
      </body></html>`;
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        alert('Trình duyệt chặn cửa sổ in');
      }
    } catch (e:any) { alert(e?.message || 'Không in được boarding pass'); }
    finally { setPrinting(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="flex items-center justify-between">
          <div>Nhân viên: Nguyễn Văn A • Quầy: 15 • Ca: Sáng</div>
          <div>Sân bay: HAN • Ngày: {new Date().toLocaleDateString('vi-VN')}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="font-semibold mb-2">CHUYẾN BAY ĐANG LÀM VIỆC</div>
        <select className="border rounded px-3 py-2" value={flight} onChange={(e)=>setFlight(e.target.value)}>
          <option value="">-- Chọn chuyến bay --</option>
          <option value="VN124">VN124 - HAN→SGN (08:00-10:00)</option>
          <option value="VN126">VN126 - HAN→DAD (17:00-18:30)</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
          <div className="font-semibold mb-2">TÌM NHANH HÀNH KHÁCH</div>
        <div className="flex items-center gap-2">
          <button className="border rounded px-3 py-2">Quét Passport</button>
          <button className="border rounded px-3 py-2">Quét Mã Vạch Vé</button>
          <input ref={searchRef} className="border rounded px-3 py-2 flex-1" placeholder="Nhập PNR hoặc Họ tên" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <button className="bg-indigo-600 text-white rounded px-3 py-2" onClick={handleLookup} disabled={loading}>{loading?'Đang tìm...':'Tìm'}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="font-semibold mb-2">DANH SÁCH HÀNH KHÁCH</div>
        {!result && <div className="text-gray-500">Chưa có kết quả</div>}
        {result && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded p-3">
              <div><b>PNR:</b> {result.booking_code}</div>
              <div><b>Hành khách:</b> {result.customer_name}</div>
              <div><b>Chuyến:</b> {result.flight_code} • {result.departure_city} → {result.arrival_city}</div>
              <div><b>Ngày/Giờ:</b> {result.flight_date} {result.departure_time}</div>
              <div><b>Ghế:</b> {result.seat_number || 'Chưa chọn'}</div>
              <div><b>Site:</b> {(result as any).site}</div>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="block mb-1">Gán ghế</label>
                <input className="border rounded px-3 py-2" placeholder="VD: 12A" value={assignSeat} onChange={(e)=>setAssignSeat(e.target.value)} />
              </div>
              <button className="border rounded px-3 py-2" onClick={handleAssignSeat}>Gán</button>
              <button className="bg-green-600 text-white rounded px-3 py-2" onClick={handleComplete}>Hoàn tất Check-in</button>
              <button className="bg-gray-800 text-white rounded px-3 py-2" onClick={handlePrintBP} disabled={printing}>{printing?'Đang in...':'In Boarding Pass'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinDashboard; */


