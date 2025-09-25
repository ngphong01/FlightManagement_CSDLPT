import React from 'react';

type Props = {
  totalSeats: number;
  takenSeats: string[];
  value?: string;
  onChange: (seat: string) => void;
};

const SeatMap: React.FC<Props> = ({ totalSeats, takenSeats, value, onChange }) => {
  const cols = 6; // simple A-F
  const rows = Math.ceil(totalSeats / cols);
  const letters = ['A','B','C','D','E','F'];

  const isTaken = (seat: string) => takenSeats.includes(seat);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, seat: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isTaken(seat)) onChange(seat);
    }
  };

  const seats: Array<{ key: string; label: string; disabled: boolean }>[] = [];
  for (let r = 1; r <= rows; r++) {
    const row: Array<{ key: string; label: string; disabled: boolean }> = [];
    for (let c = 0; c < cols; c++) {
      const seatLabel = `${r}${letters[c]}`;
      if ((r - 1) * cols + (c + 1) > totalSeats) continue;
      row.push({ key: seatLabel, label: seatLabel, disabled: isTaken(seatLabel) });
    }
    seats.push(row);
  }

  return (
    <div className="space-y-2" aria-label="Seat map">
      {seats.map((row, idx) => (
        <div key={idx} className="flex gap-2 justify-center">
          {row.map((s) => (
            <button
              key={s.key}
              type="button"
              className={
                `px-3 py-2 rounded-md border text-sm ` +
                (s.disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed ' : 'bg-white hover:bg-indigo-50 ') +
                (value === s.key ? 'border-indigo-600 ring-2 ring-indigo-200 ' : 'border-gray-200 ')
              }
              aria-label={`Seat ${s.label}${s.disabled ? ' (taken)' : ''}`}
              aria-disabled={s.disabled}
              tabIndex={0}
              onClick={() => { if (!s.disabled) onChange(s.key); }}
              onKeyDown={(e) => handleKeyDown(e, s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SeatMap;


