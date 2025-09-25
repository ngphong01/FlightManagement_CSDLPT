# Flight Management Monorepo

This repository contains a React (Vite + TypeScript) frontend and a Node.js (Express) backend, powered by a distributed MySQL setup with 3 shards (Hanoi, Danang, Saigon).

## Quick Start

### 1) Databases (MySQL)

Create 3 databases and import the consolidated schema into each:

```
flight_management_hanoi
flight_management_danang
flight_management_saigon
```

Import SQL (do this for each DB):

```
mysql -u root -p flight_management_hanoi  < db/database_full.sql
mysql -u root -p flight_management_danang < db/database_full.sql
mysql -u root -p flight_management_saigon < db/database_full.sql
```

If your MySQL user is not root, replace with the correct user.

### 2) Backend

```
cd backend
npm install
node server.js
```

Default: PORT=3001. If in use, change or kill the existing process.

### 3) Frontend

```
cd frontend
npm install
npm run dev
```

Vite default port: 5173

## Configuration

- Backend DB connections are configured per site in `backend/config/database.js`.
- Frontend API base is defined in `frontend/src/lib/api.ts`.

## Features

- Public booking, check-in, PNR lookup
- Separate authentication: Customer, Staff, Admin
- Staff dashboard: check-in, gate, emergency
- Admin pages: dashboard, flights, bookings, users, staff
- Guest booking flow (no login), mirrored into operational bookings

## Common Troubleshooting

- Port 3001 in use: use `netstat -ano | findstr :3001` then `taskkill /PID <PID> /F`
- Missing tables: ensure `db/database_full.sql` imported into all 3 databases
- Staff login invalid: ensure staff password hashes are full bcrypt (60 chars)
- Vite not accessible: ensure `frontend/vite.config.ts` has host `0.0.0.0`

## Default Accounts (samples)

- Admin: `admin` / bcrypt hash placeholder in SQL (set your real hash)
- Staff: `NV001` with role `supervisor` (set your real hash)

## License

Internal project

---
# ✈️ Flight Management - Public Folder

Tài liệu hướng dẫn chạy nhanh ứng dụng trong thư mục `public/` (gồm frontend tĩnh, backend Express, và cơ sở dữ liệu MySQL phân tán).
---

## 📂 Cấu trúc thư mục

```
public/
├─ index.html              # Frontend (React UMD + Tailwind CDN)
├─ app.js                  # Ứng dụng React (single file)
├─ styles.css              # CSS tuỳ chỉnh
├─ backend/                # Backend Express API
│  ├─ server.js
│  └─ config/database.js
├─ database-complete.sql   # Schema + sample data
├─ start-backend.bat       # Script khởi chạy backend
├─ start-frontend.bat      # Script mở frontend
└─ README.md               # Tài liệu này
```

---

## 🚀 Hướng dẫn chạy

### 1. Cơ sở dữ liệu (MySQL)

- Tạo 3 database:

  - `flight_management_hanoi`
  - `flight_management_danang`
  - `flight_management_saigon`

- Import schema & dữ liệu mẫu (chạy lặp lại cho cả 3 DB):

  ```bash
  mysql -uroot -p flight_management_hanoi  < public/database-complete.sql
  mysql -uroot -p flight_management_danang < public/database-complete.sql
  mysql -uroot -p flight_management_saigon < public/database-complete.sql
  ```

---

### 2. Backend

```bash
cd public/backend
npm install
node server.js    # Mặc định PORT=3001 (có thể đổi sang 3002)
```

🔧 Nếu gặp lỗi `EADDRINUSE` (cổng bị chiếm):

```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

### 3. Frontend

- Mở `public/index.html` trực tiếp bằng trình duyệt (double-click) hoặc dùng Live Server.
- Kiểm tra `API_BASE_URL` trong `index.html`:

```html
<script>
  window.API_BASE_URL = "http://localhost:3002/api";
</script>
```

👉 Sửa thành `3001` nếu backend chạy cổng 3001.

---

## 🔑 Tài khoản mặc định

- **Username:** `admin`
- **Password:** `admin123`

Nếu báo lỗi thiếu cột `active` trong bảng `users`, thêm thủ công:

```sql
ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER password;
```

---

## 🔗 Endpoint chính

Base URL: `http://localhost:<PORT>/api`

- **Auth:** `POST /auth/login`
- **Flights:** `GET /flights`, `GET /flights/:site/:id`
- **Bookings:** `GET /bookings`, `POST /bookings`, `PUT /bookings/:site/:id/cancel`
- **Statistics:** `GET /api/statistics`

Ví dụ test login:

```bash
curl -v -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🧩 Lỗi thường gặp

- **EADDRINUSE (cổng bị chiếm):** dùng `netstat` + `taskkill` hoặc đổi `PORT`.
- **Thiếu bảng dữ liệu:** chắc chắn đã import `database-complete.sql` cho cả 3 DB.
- **Sai base URL frontend:** cập nhật `window.API_BASE_URL` trong `index.html`.

---

## 🎨 Giao diện

- Frontend: React UMD + Babel Standalone biên dịch JSX trực tiếp trong `index.html`.
- Tailwind CDN: dễ dàng tinh chỉnh UI/UX.

---

## 🧭 Debug nhanh

- Mở **Network Tab** trong trình duyệt để kiểm tra các request `.../api/...`.
- Backend log chi tiết ở console khi chạy `node server.js`.

---

## 📌 Ghi chú

- Trong thư mục `public/frontend/` có scaffold **React + Vite + TypeScript** (đang phát triển).
- Bản production hiện tại sử dụng `public/` với React UMD.
- Nếu muốn chuyển sang Vite, dùng app trong `public/frontend/` và cấu hình `VITE_API_BASE`.

---

© 2025 Flight Management (public/)

---
