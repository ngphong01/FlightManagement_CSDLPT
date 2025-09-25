import React from 'react';
import { api } from '../../lib/api';
import { useStaffShortcuts } from '../../hooks/useStaffShortcuts';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const GateDashboard: React.FC = () => {
  const [status, setStatus] = React.useState<'not_started'|'boarding'|'final_call'|'closed'>('not_started');
  const [site, setSite] = React.useState<'hanoi'|'danang'|'saigon'>('hanoi');
  const [flightId, setFlightId] = React.useState<number>(1);
  const [manifest, setManifest] = React.useState<{ flight: any; passengers: any[]; stats: any } | null>(null);
  const [scan, setScan] = React.useState('');
  const [lastBoardedId, setLastBoardedId] = React.useState<number | null>(null);
  const scanRef = React.useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);
  const offline = useOfflineQueue({
    gate_board: async (payload) => { await api.gateBoard(payload.site, payload.bookingId); }
  });
  const exportManifest = () => {
    if (!manifest) return;
    const f = manifest.flight;
    const rows = (manifest.passengers||[]).map(p=>`<tr><td>${p.customer_name}</td><td>${p.seat_number||''}</td><td>${p.check_in_status||''}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Final Manifest</title>
      <style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:6px;text-align:left} .head{margin-bottom:10px}</style>
      </head><body>
      <div class='head'><h2>Final Manifest</h2>
      <div>Flight: ${f.flight_code} • ${f.departure_city} → ${f.arrival_city}</div>
      <div>Date/Time: ${f.flight_date} ${f.departure_time}</div>
      <div>Total: ${manifest.stats.total} • Checked-in: ${manifest.stats.checked_in} • Boarded: ${manifest.stats.boarded}</div></div>
      <table><thead><tr><th>Name</th><th>Seat</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.print();</script>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.open(); win.document.write(html); win.document.close(); }
  };

  const loadManifest = async () => {
    try { const m = await api.gateManifest(site, flightId); setManifest(m as any); } catch{}
  };

  React.useEffect(()=>{ loadManifest(); }, [site, flightId]);

  // Poll manifest during boarding
  React.useEffect(() => {
    if (status !== 'boarding') return;
    const id = setInterval(loadManifest, 3000);
    return () => clearInterval(id);
  }, [status, site, flightId]);

  useStaffShortcuts({
    onFocusScan: () => scanRef.current?.focus(),
    onStartBoarding: () => setStatus('boarding'),
    onPrint: exportManifest
  });

  React.useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">VN123 - HAN→SGN • Cổng A5</div>
            <div>Giờ khởi hành: 08:00 • Trạng thái: {status}</div>
          </div>
          <div className="text-right">
            <div className={`text-xs px-2 py-0.5 rounded inline-block ${offline.isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Mạng: {offline.isOnline?'Online':'Offline'}</div>
            <div className="text-xs mt-1">Queue: <span className="inline-block px-2 py-0.5 rounded bg-gray-100">{offline.queue.length}</span></div>
            <button className="mt-1 border rounded px-2 py-1 text-xs" onClick={()=>offline.processQueue()} disabled={!offline.isOnline}>Đồng bộ ngay</button>
            {offline.logs.length > 0 && (
              <div className="mt-2 text-left bg-gray-50 p-2 rounded">
                <div className="font-semibold text-xs mb-1">Nhật ký đồng bộ</div>
                <ul className="max-h-24 overflow-auto text-xs space-y-1">
                  {offline.logs.slice(-10).reverse().map(l => (
                    <li key={l.id+String(l.time)} className={l.status==='success'?'text-green-700':'text-red-700'}>
                      {new Date(l.time).toLocaleTimeString()} • {l.type} • {l.status}
                    </li>
                  ))}
                </ul>
                <div className="text-right"><button className="underline" onClick={()=>offline.clearLogs()}>Xóa nhật ký</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm flex gap-2">
        <button className={`rounded px-3 py-2 ${status==='boarding'?'bg-green-600 text-white':'border'}`} onClick={()=>setStatus('boarding')}>BẮT ĐẦU LÊN MÁY BAY</button>
        <button className="border rounded px-3 py-2">THÔNG BÁO</button>
        <button className="border rounded px-3 py-2" onClick={()=>setStatus('final_call')}>GỌI CUỐI CÙNG</button>
        <button className="border rounded px-3 py-2" onClick={()=>setStatus('closed')}>ĐÓNG CỬA</button>
      </div>
      <div className="bg-white rounded-xl shadow p-3 text-sm">
        <div className={`text-xs px-2 py-0.5 rounded inline-block mb-2 ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Mạng: {isOnline?'Online':'Offline'}</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded bg-gray-50 p-3">Tổng: {manifest?.stats?.total ?? '-'}</div>
          <div className="rounded bg-green-50 p-3">Check-in: {manifest?.stats?.checked_in ?? '-'}</div>
          <div className="rounded bg-blue-50 p-3">Đã lên: {manifest?.stats?.boarded ?? '-'}</div>
          <div className="rounded bg-yellow-50 p-3">Chưa đến: {(manifest?.stats?.total ?? 0) - (manifest?.stats?.boarded ?? 0)}</div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <select className="border rounded px-3 py-2" value={site} onChange={(e)=>setSite(e.target.value as any)}>
            <option value="hanoi">Hà Nội</option>
            <option value="danang">Đà Nẵng</option>
            <option value="saigon">Sài Gòn</option>
          </select>
          <input className="border rounded px-3 py-2" type="number" placeholder="Flight ID" value={flightId} onChange={(e)=>setFlightId(Number(e.target.value||1))} />
          <button className="border rounded px-3 py-2" onClick={loadManifest}>Tải manifest</button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input ref={scanRef} className="border rounded px-3 py-2 flex-1" placeholder={`Quét/nhập PNR ${offline.isOnline?'':'(offline queue)'}`} value={scan} onChange={(e)=>setScan(e.target.value)} onKeyDown={async (e)=>{
            if (e.key === 'Enter' && scan) {
              const p = manifest?.passengers?.find((x:any)=> x.booking_code === scan.trim());
              if (!p) { alert('PNR không thuộc manifest'); return; }
              try {
                if (offline.isOnline) {
                  await api.gateBoard(site, p.id);
                } else {
                  offline.enqueue({ type: 'gate_board', payload: { site, bookingId: p.id } });
                }
                setLastBoardedId(p.id); await loadManifest(); setScan('');
              } catch(err:any){ alert(err?.message || 'Lỗi quét'); }
            }
          }} />
          <button className="border rounded px-3 py-2" onClick={async ()=>{
            if (!scan) return; const p = manifest?.passengers?.find((x:any)=> x.booking_code === scan.trim());
            if (!p) { alert('PNR không thuộc manifest'); return; }
            try {
              if (offline.isOnline) { await api.gateBoard(site, p.id); }
              else { offline.enqueue({ type: 'gate_board', payload: { site, bookingId: p.id } }); }
              setLastBoardedId(p.id); await loadManifest(); setScan('');
            } catch(err:any){ alert(err?.message || 'Lỗi quét'); }
          }}>Quét</button>
        </div>
        <div className="overflow-auto mt-3">
          <table className="min-w-full">
            <thead><tr className="text-left border-b"><th className="p-2">Tên</th><th className="p-2">Ghế</th><th className="p-2">Trạng thái</th><th className="p-2">Thao tác</th></tr></thead>
            <tbody>
              {manifest?.passengers?.map((p:any)=> (
                <tr key={p.id} className={`border-b ${lastBoardedId===p.id ? 'bg-green-50' : ''}`}>
                  <td className="p-2">{p.customer_name}</td>
                  <td className="p-2">{p.seat_number || '-'}</td>
                  <td className="p-2">{p.check_in_status}</td>
                  <td className="p-2"><button className="underline" onClick={async ()=>{ try { await api.gateBoard(site, p.id); await loadManifest(); } catch(e:any){ alert(e?.message || 'Lỗi quét'); } }}>Quét Boarding Pass</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Offline queue viewer */}
        {!offline.isOnline && (
          <div className="mt-3 bg-yellow-50 rounded p-3">
            <div className="font-semibold mb-1 text-yellow-800">Tác vụ chờ đồng bộ ({offline.queue.length})</div>
            <div className="text-xs text-yellow-800">Sẽ tự gửi khi có mạng.</div>
            <ul className="mt-2 text-sm list-disc ml-5">
              {offline.queue.map(t => (
                <li key={t.id} className="flex items-center justify-between">
                  <span>{t.type} • #{t.payload?.bookingId} • {new Date(t.createdAt).toLocaleTimeString()}</span>
                  <button className="underline" onClick={()=>offline.remove(t.id)}>Hủy</button>
                </li>
              ))}
            </ul>
            {offline.queue.length > 0 && (
              <div className="text-right mt-2"><button className="underline" onClick={()=>offline.clear()}>Xóa tất cả</button></div>
            )}
          </div>
        )}
      </div>
      <div className="text-right">
        <button className="rounded bg-gray-800 text-white px-3 py-2" onClick={exportManifest}>XUẤT BÁO CÁO CUỐI CÙNG</button>
      </div>
    </div>
  );
};

export default GateDashboard;


