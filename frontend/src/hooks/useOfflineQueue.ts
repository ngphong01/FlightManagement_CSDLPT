import React from 'react';

export type OfflineTask = {
  id: string;
  type: string; // e.g., 'gate_board','checkin_assign','checkin_complete'
  payload: any;
  createdAt: number;
};

const STORAGE_KEY = 'staff_offline_queue_v1';

const readQueue = (): OfflineTask[] => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const writeQueue = (q: OfflineTask[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); } catch {}
};

export const useOfflineQueue = (processors: Record<string, (payload: any) => Promise<void> | undefined>) => {
  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);
  const [queue, setQueue] = React.useState<OfflineTask[]>(() => readQueue());
  const [logs, setLogs] = React.useState<Array<{ id: string; type: string; status: 'success'|'fail'; time: number; message?: string }>>([]);

  const enqueue = (task: Omit<OfflineTask, 'id' | 'createdAt'>) => {
    const t: OfflineTask = { ...task, id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: Date.now() } as any;
    const next = [...queue, t];
    setQueue(next); writeQueue(next);
  };

  const remove = (id: string) => {
    const next = queue.filter(q => q.id !== id);
    setQueue(next); writeQueue(next);
  };

  const clear = () => { setQueue([]); writeQueue([]); };

  const processQueue = React.useCallback(async () => {
    if (!navigator.onLine) return;
    let current = readQueue();
    const remain: OfflineTask[] = [];
    for (const t of current) {
      try {
        const fn = processors[t.type as keyof typeof processors] as any;
        if (fn) await fn(t.payload);
        setLogs(prev => [...prev, { id: t.id, type: t.type, status: 'success', time: Date.now() }]);
      } catch {
        remain.push(t); // giữ lại nếu lỗi
        setLogs(prev => [...prev, { id: t.id, type: t.type, status: 'fail', time: Date.now() }]);
      }
    }
    setQueue(remain); writeQueue(remain);
  }, [processors]);

  React.useEffect(() => {
    const on = () => { setIsOnline(true); processQueue(); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [processQueue]);

  // cố gắng xử lý khi mount nếu đang online
  React.useEffect(() => { if (isOnline) processQueue(); }, [isOnline, processQueue]);

  const clearLogs = () => setLogs([]);
  return { isOnline, queue, enqueue, processQueue, remove, clear, logs, clearLogs };
};




