import React, { useState, useEffect } from 'react';

interface Booking {
  id: string;
  bookingCode: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  nationalId?: string;
  flightCode: string;
  route: string;
  departureTime: string;
  seat: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  totalAmount: number;
  bookingDate: string;
  paymentMethod: string;
}

const BookingsAdmin: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: '',
    flight: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    const t = setInterval(fetchBookings, 8000);
    return () => clearInterval(t);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu đặt chỗ');
      }

      const data = await response.json();
      const list = Array.isArray(data?.bookings) ? data.bookings : Array.isArray(data) ? data : [];
      // Transform API data to match our interface
      const transformedBookings: Booking[] = list.map((booking: any) => ({
        id: booking.id,
        bookingCode: booking.booking_code,
        passengerName: booking.customer_name || booking.passenger_name || '—',
        passengerEmail: booking.customer_email || booking.passenger_email || '—',
        passengerPhone: booking.customer_phone || booking.passenger_phone || '—',
        nationalId: booking.national_id || booking.customer_national_id || '—',
        flightCode: booking.flight_code,
        route: `${booking.departure_city} → ${booking.arrival_city}`,
        departureTime: booking.departure_time,
        seat: booking.seat_number || '—',
        status: booking.status || 'confirmed',
        totalAmount: booking.total_amount || 0,
        bookingDate: (booking.booking_date || booking.created_at || '').toString().slice(0, 10),
        paymentMethod: booking.payment_method || booking.payment_status || '—'
      }));
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to mock data if API fails
      const mockBookings: Booking[] = [
        {
          id: '1',
          bookingCode: 'HANOI1758748288769',
          passengerName: 'Nguyễn Văn A',
          passengerEmail: 'nguyenvana@email.com',
          passengerPhone: '0123456789',
          flightCode: 'VN123',
          route: 'Hà Nội → TP.HCM',
          departureTime: '08:00',
          seat: '12A',
          status: 'confirmed',
          totalAmount: 2500000,
          bookingDate: '2024-01-15',
          paymentMethod: 'Credit Card'
        }
      ];
      setBookings(mockBookings);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = !filters.status || booking.status === filters.status;
    const matchesSearch = !filters.search || 
      booking.bookingCode.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.flightCode.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate = !filters.date || booking.bookingDate === filters.date;
    const matchesFlight = !filters.flight || booking.flightCode === filters.flight;
    
    return matchesStatus && matchesSearch && matchesDate && matchesFlight;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Đặt chỗ</h1>
        <p className="text-gray-600">Quản lý và theo dõi tất cả đặt chỗ</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã đặt chỗ, tên khách hàng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="completed">Hoàn thành</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày đặt</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chuyến bay</label>
            <input
              type="text"
              placeholder="Mã chuyến bay"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.flight}
              onChange={(e) => setFilters({...filters, flight: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đặt chỗ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chuyến bay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.bookingCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.passengerName}</div>
                    <div className="text-sm text-gray-500">{booking.passengerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.flightCode}</div>
                    <div className="text-sm text-gray-500">{booking.route}</div>
                    <div className="text-sm text-gray-500">{booking.departureTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.bookingDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Xem
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Hủy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy đặt chỗ nào</div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Chi tiết đặt chỗ</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã đặt chỗ</label>
                  <p className="text-sm text-gray-900">{selectedBooking.bookingCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên khách hàng</label>
                  <p className="text-sm text-gray-900">{selectedBooking.passengerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedBooking.passengerEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <p className="text-sm text-gray-900">{selectedBooking.passengerPhone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CCCD/CMND</label>
                  <p className="text-sm text-gray-900">{selectedBooking.nationalId || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghế</label>
                  <p className="text-sm text-gray-900">{selectedBooking.seat}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chuyến bay</label>
                  <p className="text-sm text-gray-900">{selectedBooking.flightCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tuyến đường</label>
                  <p className="text-sm text-gray-900">{selectedBooking.route}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                  <p className="text-sm text-gray-900">{selectedBooking.paymentMethod}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAdmin;


