import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  totalFlights: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  todayFlights: number;
  todayBookings: number;
  pendingCheckins: number;
  completedFlights: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'flight' | 'user' | 'system';
  description: string;
  timestamp: string;
  user: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalFlights: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    todayFlights: 0,
    todayBookings: 0,
    pendingCheckins: 0,
    completedFlights: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch flights data
      const flightsResponse = await fetch('http://localhost:3001/api/flights', { headers });
      const flightsJson = await flightsResponse.json();
      const flightsData = Array.isArray(flightsJson?.flights) ? flightsJson.flights : Array.isArray(flightsJson) ? flightsJson : [];
      
      // Fetch bookings data
      const bookingsResponse = await fetch('http://localhost:3001/api/bookings', { headers });
      const bookingsJson = await bookingsResponse.json();
      const bookingsData = Array.isArray(bookingsJson?.bookings) ? bookingsJson.bookings : Array.isArray(bookingsJson) ? bookingsJson : [];
      
      // Fetch users data
      const usersResponse = await fetch('http://localhost:3001/api/users', { headers });
      const usersData = await usersResponse.json();
      
      // Calculate today's data
      const today = new Date().toISOString().split('T')[0];
      const todayFlights = flightsData.filter((flight: any) => 
        (flight.flight_date || flight.departure_date || '').toString().slice(0,10) === today
      ).length;
      
      const todayBookings = bookingsData.filter((booking: any) => 
        ((booking.created_at || booking.booking_date) || '').toString().slice(0,10) === today
      ).length;
      
      // Calculate total revenue
      const totalRevenue = bookingsData.reduce((sum: number, booking: any) => 
        sum + (booking.total_amount || 0), 0
      );

      // Pending check-ins: bookings of today without checked_in
      const pendingCheckins = bookingsData.filter((b: any) => {
        const flightDate = (b.flight_date || '').toString().slice(0,10);
        const status = (b.check_in_status || '').toString();
        return flightDate === today && status !== 'checked_in' && status !== 'boarding' && (b.status || '') !== 'cancelled';
      }).length;

      // Completed flights today
      const completedFlights = flightsData.filter((f: any) => 
        ((f.flight_date || '').toString().slice(0,10) === today) && (f.status === 'departed' || f.status === 'arrived')
      ).length;
      
      setStats({
        totalFlights: flightsData.length || 0,
        totalBookings: bookingsData.length || 0,
        totalRevenue: totalRevenue,
        activeUsers: Array.isArray(usersData) ? usersData.length : 0,
        todayFlights,
        todayBookings,
        pendingCheckins,
        completedFlights
      });

      setRecentActivity([
        {
          id: '1',
          type: 'booking',
          description: 'Đặt chỗ mới cho chuyến bay VN123',
          timestamp: '2 phút trước',
          user: 'Nguyễn Văn A'
        },
        {
          id: '2',
          type: 'flight',
          description: 'Chuyến bay VN456 đã cất cánh',
          timestamp: '15 phút trước',
          user: 'Hệ thống'
        },
        {
          id: '3',
          type: 'user',
          description: 'Người dùng mới đăng ký',
          timestamp: '1 giờ trước',
          user: 'Trần Thị B'
        },
        {
          id: '4',
          type: 'system',
          description: 'Cập nhật cấu hình hệ thống',
          timestamp: '2 giờ trước',
          user: 'Admin'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📋';
      case 'flight': return '✈️';
      case 'user': return '👤';
      case 'system': return '⚙️';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Chào mừng trở lại, {user?.username || 'Admin'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng chuyến bay</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFlights.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">✈️</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+12% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đặt chỗ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+8% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+15% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+5% so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hôm nay</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chuyến bay</span>
              <span className="font-semibold">{stats.todayFlights}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đặt chỗ mới</span>
              <span className="font-semibold">{stats.todayBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Check-in chờ xử lý</span>
              <span className="font-semibold text-orange-600">{stats.pendingCheckins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chuyến bay hoàn thành</span>
              <span className="font-semibold text-green-600">{stats.completedFlights}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">✈️</span>
              <span className="text-sm font-medium">Thêm chuyến bay</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">👥</span>
              <span className="text-sm font-medium">Quản lý nhân viên</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">📊</span>
              <span className="text-sm font-medium">Xem báo cáo</span>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">⚙️</span>
              <span className="text-sm font-medium">Cài đặt hệ thống</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
