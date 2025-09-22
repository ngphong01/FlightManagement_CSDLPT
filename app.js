// ===== MAIN REACT APPLICATION =====
const { useState, useEffect, useCallback } = React;

// ===== API SERVICE =====
class APIService {
  constructor() {
    // Prefer global override if provided in index.html
    const overrideBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : null;
    // Default to backend running on 3002 (current setup); fallback 3001 for older envs
    this.baseURL = overrideBase || 'http://localhost:3002/api';
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const token = (data && (data.token || (data.data && data.data.token))) || null;
    if (!token) {
      throw new Error((data && data.message) || 'Không nhận được token từ máy chủ');
    }
    this.token = token;
    localStorage.setItem('authToken', token);
    return data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Flights
  async getFlights(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      return await this.request(`/flights${queryString ? `?${queryString}` : ''}`);
    } catch (e) {
      console.warn('Flights API failed, returning mock data:', e.message);
      return {
        success: true,
        flights: [],
        total: 0,
      };
    }
  }

  async createFlight(flightData) {
    return this.request('/flights', {
      method: 'POST',
      body: JSON.stringify(flightData),
    });
  }

  async updateFlight(id, flightData) {
    return this.request(`/flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flightData),
    });
  }

  async deleteFlight(id) {
    return this.request(`/flights/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings
  async getBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      return await this.request(`/bookings${queryString ? `?${queryString}` : ''}`);
    } catch (e) {
      console.warn('Bookings API failed, returning mock data:', e.message);
      return {
        success: true,
        bookings: [],
        total: 0,
      };
    }
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  // Statistics
  async getStats() {
    try {
      return await this.request('/stats');
    } catch (e) {
      console.warn('Stats API failed, returning mock data:', e.message);
      return {
        success: true,
        statistics: {
          totalFlights: 0,
          totalBookings: 0,
          totalRevenue: 0,
          availableFlights: 0,
          totalRevenueFormatted: '0 ₫',
          siteStats: {
            hanoi: { flights: 0, availableFlights: 0, bookings: 0, revenue: 0, revenueFormatted: '0 ₫' },
            danang: { flights: 0, availableFlights: 0, bookings: 0, revenue: 0, revenueFormatted: '0 ₫' },
            saigon: { flights: 0, availableFlights: 0, bookings: 0, revenue: 0, revenueFormatted: '0 ₫' },
          },
        },
      };
    }
  }
}

// ===== CONTEXT =====
const AppContext = React.createContext();

// ===== HOOKS =====
const useAPI = () => {
  const [api] = useState(() => new APIService());
  return api;
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// ===== COMPONENTS =====

// Toast Component
const Toast = ({ toast, onRemove }) => {
  const getIconClass = (type) => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-info-circle';
    }
  };

  return (
    <div className="toast">
      <div className={`toast-icon ${toast.type}`}>
        <i className={getIconClass(toast.type)}></i>
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button 
        className="modal-close" 
        onClick={() => onRemove(toast.id)}
        style={{ marginLeft: 'auto' }}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map(toast => (
      <Toast key={toast.id} toast={toast} onRemove={onRemove} />
    ))}
  </div>
);

// Loading Component
const Loading = ({ message = 'Đang tải...' }) => (
  <div className="loading">
    <div className="spinner"></div>
    <span className="ms-3">{message}</span>
  </div>
);

// Sidebar Component
const Sidebar = ({ isOpen, onClose, currentPage, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'flights', label: 'Quản lý chuyến bay', icon: 'fas fa-plane' },
    { id: 'bookings', label: 'Quản lý đặt vé', icon: 'fas fa-ticket-alt' },
    { id: 'customers', label: 'Khách hàng', icon: 'fas fa-users' },
    { id: 'payments', label: 'Thanh toán', icon: 'fas fa-credit-card' },
    { id: 'reports', label: 'Báo cáo', icon: 'fas fa-chart-bar' },
    { id: 'settings', label: 'Cài đặt', icon: 'fas fa-cog' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="#" className="sidebar-brand">
            <i className="fas fa-plane"></i>
            Vinpearl Airlines
          </a>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <div key={item.id} className="nav-item">
              <a
                href="#"
                className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                  onClose();
                }}
              >
                <i className={`nav-icon ${item.icon}`}></i>
                {item.label}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

// Header Component
const Header = ({ onToggleSidebar, currentPage, onLogout }) => {
  const getPageTitle = (page) => {
    const titles = {
      dashboard: 'Dashboard',
      flights: 'Quản lý chuyến bay',
      bookings: 'Quản lý đặt vé',
      customers: 'Khách hàng',
      payments: 'Thanh toán',
      reports: 'Báo cáo',
      settings: 'Cài đặt',
    };
    return titles[page] || 'Dashboard';
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="header-title">{getPageTitle(currentPage)}</h1>
      </div>
      <div className="header-right">
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary">Admin</span>
          <button className="btn btn-outline btn-sm" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, change, icon, type = 'primary' }) => (
  <div className={`stat-card ${type}`}>
    <div className="stat-header">
      <div className={`stat-icon ${type}`}>
        <i className={icon}></i>
      </div>
    </div>
    <h3 className="stat-value">{value}</h3>
    <p className="stat-label">{title}</p>
    {change && (
      <div className={`stat-change ${change.type}`}>
        <i className={`fas fa-arrow-${change.type === 'positive' ? 'up' : 'down'}`}></i>
        {change.value}
      </div>
    )}
  </div>
);

// Dashboard Component
const Dashboard = ({ api, addToast }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentFlights, setRecentFlights] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, flightsData] = await Promise.all([
        api.getStats(),
        api.getFlights({ limit: 5, sort: 'created_at', order: 'desc' })
      ]);
      
      setStats(statsData);
      setRecentFlights(flightsData.data || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải dữ liệu dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải dashboard..." />;
  }

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <StatsCard
          title="Tổng chuyến bay"
          value={stats?.totalFlights || 0}
          change={{ type: 'positive', value: '+12%' }}
          icon="fas fa-plane"
          type="primary"
        />
        <StatsCard
          title="Vé đã bán"
          value={stats?.totalBookings || 0}
          change={{ type: 'positive', value: '+8%' }}
          icon="fas fa-ticket-alt"
          type="success"
        />
        <StatsCard
          title="Doanh thu"
          value={`$${stats?.totalRevenue || 0}`}
          change={{ type: 'positive', value: '+15%' }}
          icon="fas fa-dollar-sign"
          type="warning"
        />
        <StatsCard
          title="Tỷ lệ lấp đầy"
          value={`${stats?.occupancyRate || 0}%`}
          change={{ type: 'negative', value: '-2%' }}
          icon="fas fa-chart-pie"
          type="danger"
        />
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Chuyến bay gần đây</h5>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã chuyến</th>
                      <th>Tuyến bay</th>
                      <th>Ngày</th>
                      <th>Giá</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFlights.map(flight => (
                      <tr key={flight.id}>
                        <td>
                          <strong>{flight.flight_code}</strong>
                          <br />
                          <small className="text-secondary">{flight.airline}</small>
                        </td>
                        <td>
                          {flight.departure_airport} → {flight.arrival_airport}
                          <br />
                          <small className="text-secondary">
                            {flight.departure_city} → {flight.arrival_city}
                          </small>
                        </td>
                        <td>
                          {new Date(flight.flight_date).toLocaleDateString('vi-VN')}
                          <br />
                          <small className="text-secondary">
                            {flight.departure_time} - {flight.arrival_time}
                          </small>
                        </td>
                        <td>
                          <strong>${flight.price}</strong>
                        </td>
                        <td>
                          <span className={`badge badge-${flight.status === 'available' ? 'success' : 'warning'}`}>
                            {flight.status === 'available' ? 'Có sẵn' : 'Đã đặt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Thống kê nhanh</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Chuyến bay hôm nay</span>
                <strong>{stats?.todayFlights || 0}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Vé bán hôm nay</span>
                <strong>{stats?.todayBookings || 0}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Doanh thu hôm nay</span>
                <strong>${stats?.todayRevenue || 0}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Khách hàng mới</span>
                <strong>{stats?.newCustomers || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Flight Management Component
const FlightManagement = ({ api, addToast }) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadFlights();
  }, [filters]);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const data = await api.getFlights(filters);
      setFlights(data.data || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải danh sách chuyến bay'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlight = async (flightData) => {
    try {
      await api.createFlight(flightData);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Tạo chuyến bay thành công'
      });
      setShowModal(false);
      loadFlights();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể tạo chuyến bay'
      });
    }
  };

  const handleUpdateFlight = async (id, flightData) => {
    try {
      await api.updateFlight(id, flightData);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Cập nhật chuyến bay thành công'
      });
      setShowModal(false);
      setEditingFlight(null);
      loadFlights();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể cập nhật chuyến bay'
      });
    }
  };

  const handleDeleteFlight = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyến bay này?')) return;

    try {
      await api.deleteFlight(id);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Xóa chuyến bay thành công'
      });
      loadFlights();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể xóa chuyến bay'
      });
    }
  };

  if (loading) {
    return <Loading message="Đang tải danh sách chuyến bay..." />;
  }

  return (
    <div className="fade-in">
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Bộ lọc</h5>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingFlight(null);
                setShowModal(true);
              }}
            >
              <i className="fas fa-plus"></i>
              Thêm chuyến bay
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Tìm kiếm</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mã chuyến, hãng bay..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-control form-select"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">Tất cả</option>
                  <option value="available">Có sẵn</option>
                  <option value="booked">Đã đặt</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Từ ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date_from}
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Đến ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date_to}
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Danh sách chuyến bay ({flights.length})</h5>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã chuyến</th>
                  <th>Hãng bay</th>
                  <th>Tuyến bay</th>
                  <th>Ngày & Giờ</th>
                  <th>Giá</th>
                  <th>Ghế</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {flights.map(flight => (
                  <tr key={flight.id}>
                    <td>
                      <strong>{flight.flight_code}</strong>
                    </td>
                    <td>{flight.airline}</td>
                    <td>
                      {flight.departure_airport} → {flight.arrival_airport}
                      <br />
                      <small className="text-secondary">
                        {flight.departure_city} → {flight.arrival_city}
                      </small>
                    </td>
                    <td>
                      {new Date(flight.flight_date).toLocaleDateString('vi-VN')}
                      <br />
                      <small className="text-secondary">
                        {flight.departure_time} - {flight.arrival_time}
                      </small>
                    </td>
                    <td>
                      <strong>${flight.price}</strong>
                    </td>
                    <td>
                      {flight.available_seats}/{flight.total_seats}
                    </td>
                    <td>
                      <span className={`badge badge-${flight.status === 'available' ? 'success' : 'warning'}`}>
                        {flight.status === 'available' ? 'Có sẵn' : 'Đã đặt'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingFlight(flight);
                            setShowModal(true);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-outline btn-sm text-danger"
                          onClick={() => handleDeleteFlight(flight.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <FlightModal
          flight={editingFlight}
          onClose={() => {
            setShowModal(false);
            setEditingFlight(null);
          }}
          onSave={editingFlight ? handleUpdateFlight : handleCreateFlight}
        />
      )}
    </div>
  );
};

// Flight Modal Component
const FlightModal = ({ flight, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    flight_code: '',
    airline: '',
    departure_airport: '',
    arrival_airport: '',
    departure_city: '',
    arrival_city: '',
    flight_date: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    total_seats: '',
    status: 'available'
  });

  useEffect(() => {
    if (flight) {
      setFormData(flight);
    }
  }, [flight]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(flight?.id, formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h5 className="modal-title">
            {flight ? 'Chỉnh sửa chuyến bay' : 'Thêm chuyến bay mới'}
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Mã chuyến bay *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.flight_code}
                    onChange={(e) => setFormData({...formData, flight_code: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Hãng bay *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.airline}
                    onChange={(e) => setFormData({...formData, airline: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Sân bay đi *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.departure_airport}
                    onChange={(e) => setFormData({...formData, departure_airport: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Sân bay đến *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.arrival_airport}
                    onChange={(e) => setFormData({...formData, arrival_airport: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Thành phố đi *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.departure_city}
                    onChange={(e) => setFormData({...formData, departure_city: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Thành phố đến *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.arrival_city}
                    onChange={(e) => setFormData({...formData, arrival_city: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Ngày bay *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.flight_date}
                    onChange={(e) => setFormData({...formData, flight_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Giờ đi *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Giờ đến *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.arrival_time}
                    onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Giá vé ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Tổng số ghế *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.total_seats}
                    onChange={(e) => setFormData({...formData, total_seats: e.target.value})}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Trạng thái *</label>
                  <select
                    className="form-control form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="available">Có sẵn</option>
                    <option value="booked">Đã đặt</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {flight ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Booking Management Component
const BookingManagement = ({ api, addToast }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(data.data || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải danh sách đặt vé'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt vé này?')) return;

    try {
      await api.cancelBooking(id);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Hủy đặt vé thành công'
      });
      loadBookings();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể hủy đặt vé'
      });
    }
  };

  if (loading) {
    return <Loading message="Đang tải danh sách đặt vé..." />;
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Danh sách đặt vé ({bookings.length})</h5>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đặt vé</th>
                  <th>Khách hàng</th>
                  <th>Chuyến bay</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <strong>#{booking.booking_code}</strong>
                    </td>
                    <td>
                      {booking.customer_name}
                      <br />
                      <small className="text-secondary">{booking.customer_email}</small>
                    </td>
                    <td>
                      {booking.flight_code}
                      <br />
                      <small className="text-secondary">{booking.airline}</small>
                    </td>
                    <td>
                      {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <strong>${booking.total_amount}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : 'warning'}`}>
                        {booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline btn-sm">
                          <i className="fas fa-eye"></i>
                        </button>
                        {booking.status !== 'cancelled' && (
                          <button
                            className="btn btn-outline btn-sm text-danger"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const api = useAPI();
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Verify token with backend
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      await api.login(credentials);
      setIsAuthenticated(true);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Đăng nhập thành công'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Đăng nhập thất bại'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      addToast({
        type: 'info',
        title: 'Thông báo',
        message: 'Đã đăng xuất'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard api={api} addToast={addToast} />;
      case 'flights':
        return <FlightManagement api={api} addToast={addToast} />;
      case 'bookings':
        return <BookingManagement api={api} addToast={addToast} />;
      default:
        return <Dashboard api={api} addToast={addToast} />;
    }
  };

  if (loading) {
    return <Loading message="Đang khởi tạo..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="d-flex align-items-center justify-content-center min-vh-100">
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="card-header text-center">
              <h4 className="card-title mb-0">
                <i className="fas fa-plane text-primary me-2"></i>
                Vinpearl Airlines
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleLogin({
                  username: formData.get('username'),
                  password: formData.get('password')
                });
              }}>
                <div className="form-group">
                  <label className="form-label">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    defaultValue="admin"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    defaultValue="admin123"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Đăng nhập
                </button>
              </form>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ api, addToast }}>
      <div className="app-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            currentPage={currentPage}
            onLogout={handleLogout}
          />
          
          {renderPage()}
        </div>
        
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AppContext.Provider>
  );
};

// Render App
ReactDOM.render(<App />, document.getElementById('root'));
