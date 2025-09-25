import React, { useState, useEffect } from 'react';

interface ReportData {
  period: string;
  totalRevenue: number;
  totalBookings: number;
  totalFlights: number;
  averageBookingValue: number;
  topRoutes: Array<{route: string, bookings: number}>;
  monthlyData: Array<{month: string, revenue: number, bookings: number}>;
}

const ReportsAdmin: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: ReportData = {
        period: selectedPeriod,
        totalRevenue: 2847500000,
        totalBookings: 8934,
        totalFlights: 1247,
        averageBookingValue: 318500,
        topRoutes: [
          { route: 'Hà Nội → TP.HCM', bookings: 2340 },
          { route: 'TP.HCM → Đà Nẵng', bookings: 1890 },
          { route: 'Đà Nẵng → Hà Nội', bookings: 1650 }
        ],
        monthlyData: [
          { month: 'Tháng 1', revenue: 2847500000, bookings: 8934 },
          { month: 'Tháng 12', revenue: 2650000000, bookings: 8234 },
          { month: 'Tháng 11', revenue: 2980000000, bookings: 9456 }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-gray-600">Phân tích dữ liệu và hiệu suất kinh doanh</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            📄 Xuất PDF
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            📊 Xuất Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kỳ báo cáo</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm này</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tùy chọn</label>
            <div className="flex space-x-2">
              <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                🔄 Làm mới
              </button>
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                ⚙️ Cài đặt
              </button>
            </div>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+12% so với kỳ trước</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng đặt chỗ</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalBookings.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+8% so với kỳ trước</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng chuyến bay</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalFlights.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-2xl">✈️</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+5% so với kỳ trước</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Giá trị TB/đặt chỗ</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.averageBookingValue)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+3% so với kỳ trước</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng doanh thu</h3>
              <div className="space-y-3">
                {reportData.monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{data.month}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${(data.revenue / Math.max(...reportData.monthlyData.map(d => d.revenue))) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(data.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tuyến đường phổ biến</h3>
              <div className="space-y-3">
                {reportData.topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{route.route}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{width: `${(route.bookings / Math.max(...reportData.topRoutes.map(r => r.bookings))) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{route.bookings.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsAdmin;

