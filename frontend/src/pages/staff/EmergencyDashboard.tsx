import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';

interface Passenger {
  id: string;
  name: string;
  seat: string;
  status: 'CHECKED_IN' | 'BOARDED' | 'MISSING' | 'NO_SHOW';
  boardingPassNumber: string;
  baggage: {
    count: number;
    weight: number;
    status: 'LOADED' | 'TO_OFFLOAD' | 'OFFLOADED';
  };
}

interface BaggageInfo {
  loaded: number;
  toOffload: number;
  offloaded: number;
  totalWeight: number;
}

const EmergencyDashboard: React.FC = () => {
  const { staffUser } = useStaffAuth();
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [baggage, setBaggage] = useState<BaggageInfo>({
    loaded: 0,
    toOffload: 0,
    offloaded: 0,
    totalWeight: 0
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    // Mock data for testing
    const mockFlight = {
      id: '1',
      flightCode: 'VN123',
      gate: 'A12',
      departureTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      status: 'GATE_CLOSING',
      passengers: {
        total: 150,
        checkedIn: 140,
        boarded: 120,
        missing: 10
      },
      baggage: {
        loaded: 120,
        toOffload: 10
      }
    };
    
    setSelectedFlight(mockFlight);
    
    const mockPassengers: Passenger[] = [
      {
        id: '1',
        name: 'Nguyễn Văn A',
        seat: '12A',
        status: 'BOARDED',
        boardingPassNumber: 'BP001',
        baggage: { count: 2, weight: 25, status: 'LOADED' }
      },
      {
        id: '2',
        name: 'Trần Thị B',
        seat: '8C',
        status: 'MISSING',
        boardingPassNumber: 'BP002',
        baggage: { count: 1, weight: 15, status: 'TO_OFFLOAD' }
      },
      {
        id: '3',
        name: 'Lê Văn C',
        seat: '15B',
        status: 'CHECKED_IN',
        boardingPassNumber: 'BP003',
        baggage: { count: 1, weight: 20, status: 'LOADED' }
      }
    ];
    setPassengers(mockPassengers);

    const baggageInfo: BaggageInfo = {
      loaded: 120,
      toOffload: 10,
      offloaded: 0,
      totalWeight: 2500
    };
    setBaggage(baggageInfo);

    // Start countdown
    startCountdown();
  }, []);

  const startCountdown = () => {
    const interval = setInterval(() => {
      const now = new Date();
      const departureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const remaining = Math.floor((departureTime.getTime() - now.getTime()) / 1000 / 60);
      
      setTimeRemaining(remaining);
      setIsCritical(remaining <= 10);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleMakeFinalCall = async () => {
    console.log('Making final call for flight:', selectedFlight?.flightCode);
    alert('Đã gửi thông báo cuối cùng!');
  };

  const handleCloseGate = async () => {
    console.log('Closing gate for flight:', selectedFlight?.flightCode);
    alert('Đã đóng cổng!');
  };

  const handleOffloadMissing = async () => {
    console.log('Offloading missing passengers for flight:', selectedFlight?.flightCode);
    alert('Đã offload hành khách vắng mặt!');
  };

  const handleUpdateATC = async () => {
    console.log('Updating ATC for flight:', selectedFlight?.flightCode);
    alert('Đã báo cáo ATC!');
  };

  const markAsNoShow = async (passengerId: string) => {
    console.log('Marking passenger as no-show:', passengerId);
    alert('Đã đánh dấu hành khách là no-show!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOARDED': return 'bg-green-100 text-green-800';
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-800';
      case 'MISSING': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'BOARDED': return 'Đã lên máy bay';
      case 'CHECKED_IN': return 'Đã check-in';
      case 'MISSING': return 'Vắng mặt';
      case 'NO_SHOW': return 'Không xuất hiện';
      default: return status;
    }
  };

  if (!selectedFlight) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Đang tải dữ liệu...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Khẩn Cấp</h1>
        <p className="text-gray-600">Chuyến bay: {selectedFlight.flightCode} - Cổng: {selectedFlight.gate}</p>
        <p className="text-sm text-gray-500">Nhân viên: {staffUser?.full_name || 'Unknown'}</p>
      </div>

      {/* Countdown Timer */}
      <div className={`mb-6 p-6 rounded-xl ${isCritical ? 'bg-red-100 border-red-300' : 'bg-blue-100 border-blue-300'} border-2`}>
        <div className="text-center">
          <h2 className={`text-4xl font-bold ${isCritical ? 'text-red-600' : 'text-blue-600'}`}>
            CÒN LẠI: {formatTime(timeRemaining)}
          </h2>
          {isCritical && (
            <div className="mt-2 text-red-600 font-semibold animate-pulse">
              ⚠️ KHẨN CẤP
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleMakeFinalCall}
          disabled={timeRemaining <= 0}
          className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          📢 THÔNG BÁO CUỐI CÙNG
        </button>
        
        <button
          onClick={handleCloseGate}
          disabled={timeRemaining <= -5}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          🚪 ĐÓNG CỔNG
        </button>
        
        <button
          onClick={handleOffloadMissing}
          disabled={timeRemaining > -10}
          className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          📦 OFFLOAD HÀNH KHÁCH VẮNG MẶT
        </button>
        
        <button
          onClick={handleUpdateATC}
          disabled={timeRemaining <= -15}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          🛩️ BÁO CÁO ATC
        </button>
      </div>

      {/* Flight Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành khách</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số</span>
              <span className="font-semibold">{selectedFlight.passengers.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã check-in</span>
              <span className="font-semibold text-blue-600">{selectedFlight.passengers.checkedIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã lên máy bay</span>
              <span className="font-semibold text-green-600">{selectedFlight.passengers.boarded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vắng mặt</span>
              <span className="font-semibold text-red-600">{selectedFlight.passengers.missing}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành lý</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Đã tải</span>
              <span className="font-semibold text-green-600">{baggage.loaded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cần offload</span>
              <span className="font-semibold text-orange-600">{baggage.toOffload}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã offload</span>
              <span className="font-semibold text-gray-600">{baggage.offloaded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng trọng lượng</span>
              <span className="font-semibold">{baggage.totalWeight} kg</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Chuyến bay</span>
              <span className="font-semibold text-blue-600">{selectedFlight.flightCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cổng</span>
              <span className="font-semibold">{selectedFlight.gate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái</span>
              <span className="font-semibold text-orange-600">{selectedFlight.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khởi hành</span>
              <span className="font-semibold text-sm">{selectedFlight.departureTime.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách Hành khách</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành khách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành lý
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {passengers.map((passenger) => (
                <tr key={passenger.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{passenger.name}</div>
                    <div className="text-sm text-gray-500">{passenger.boardingPassNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {passenger.seat}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(passenger.status)}`}>
                      {getStatusText(passenger.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{passenger.baggage.count} kiện</div>
                    <div className="text-sm text-gray-500">{passenger.baggage.weight} kg</div>
                    <div className="text-sm text-gray-500">{passenger.baggage.status}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {passenger.status === 'MISSING' && (
                      <button
                        onClick={() => markAsNoShow(passenger.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Đánh dấu No-show
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;

