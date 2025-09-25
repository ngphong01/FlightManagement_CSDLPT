import React, { useState, useEffect } from 'react';

interface Flight {
  id: string;
  flightCode: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  aircraft: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  passengers: number;
  capacity: number;
  price: number;
}

const FlightsAdmin: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: ''
  });

  const [newFlight, setNewFlight] = useState({
    flightCode: '',
    departure: '',
    arrival: '',
    departureTime: '',
    arrivalTime: '',
    aircraft: '',
    price: 0
  });

  useEffect(() => {
    fetchFlights();
    const t = setInterval(fetchFlights, 10000);
    return () => clearInterval(t);
  }, []);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/flights', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu chuyến bay');
      }

      const data = await response.json();
      const flightsArr = Array.isArray(data?.flights) ? data.flights : Array.isArray(data) ? data : [];
      // Transform API data to match our interface
      const transformedFlights: Flight[] = flightsArr.map((flight: any) => ({
        id: flight.id,
        flightCode: flight.flight_code,
        departure: flight.departure_city,
        arrival: flight.arrival_city,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        aircraft: flight.aircraft_id || '—',
        status: (flight.status || 'scheduled') as any,
        passengers: Math.floor(Math.random() * 200) + 50, // Mock data for now
        capacity: 200, // Mock data for now
        price: flight.price || 2500000
      }));
      
      setFlights(transformedFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
      // Fallback to mock data if API fails
      const mockFlights: Flight[] = [
        {
          id: '1',
          flightCode: 'VN123',
          departure: 'Hà Nội (HAN)',
          arrival: 'TP.HCM (SGN)',
          departureTime: '08:00',
          arrivalTime: '10:30',
          aircraft: 'Boeing 737-800',
          status: 'scheduled',
          passengers: 120,
          capacity: 180,
          price: 2500000
        }
      ];
      setFlights(mockFlights);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async () => {
    try {
      // API call to add flight
      console.log('Adding flight:', newFlight);
      setShowAddModal(false);
      setNewFlight({
        flightCode: '',
        departure: '',
        arrival: '',
        departureTime: '',
        arrivalTime: '',
        aircraft: '',
        price: 0
      });
      fetchFlights();
    } catch (error) {
      console.error('Error adding flight:', error);
    }
  };

  const handleEditFlight = async () => {
    try {
      // API call to edit flight
      console.log('Editing flight:', selectedFlight);
      setShowEditModal(false);
      setSelectedFlight(null);
      fetchFlights();
    } catch (error) {
      console.error('Error editing flight:', error);
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyến bay này?')) {
      try {
        // API call to delete flight
        console.log('Deleting flight:', flightId);
        fetchFlights();
      } catch (error) {
        console.error('Error deleting flight:', error);
      }
    }
  };

  const handleStatusChange = async (flightId: string, newStatus: string) => {
    try {
      // API call to update status
      console.log('Updating flight status:', flightId, newStatus);
      fetchFlights();
    } catch (error) {
      console.error('Error updating flight status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'departed': return 'bg-green-100 text-green-800';
      case 'arrived': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'boarding': return 'Đang lên máy bay';
      case 'departed': return 'Đã cất cánh';
      case 'arrived': return 'Đã hạ cánh';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredFlights = flights.filter(flight => {
    const matchesStatus = !filters.status || flight.status === filters.status;
    const matchesSearch = !filters.search || 
      flight.flightCode.toLowerCase().includes(filters.search.toLowerCase()) ||
      flight.departure.toLowerCase().includes(filters.search.toLowerCase()) ||
      flight.arrival.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chuyến bay</h1>
          <p className="text-gray-600">Quản lý tất cả chuyến bay trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm chuyến bay
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã chuyến bay, sân bay..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="scheduled">Đã lên lịch</option>
              <option value="boarding">Đang lên máy bay</option>
              <option value="departed">Đã cất cánh</option>
              <option value="arrived">Đã hạ cánh</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Flights Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chuyến bay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuyến đường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Máy bay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành khách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFlights.map((flight) => (
                <tr key={flight.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{flight.flightCode}</div>
                    <div className="text-sm text-gray-500">Giá: {flight.price.toLocaleString('vi-VN')} VND</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.departure}</div>
                    <div className="text-sm text-gray-500">→ {flight.arrival}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.departureTime}</div>
                    <div className="text-sm text-gray-500">→ {flight.arrivalTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flight.aircraft}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.passengers}/{flight.capacity}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${(flight.passengers / flight.capacity) * 100}%`}}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(flight.status)}`}>
                      {getStatusText(flight.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedFlight(flight);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteFlight(flight.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                      <select
                        value={flight.status}
                        onChange={(e) => handleStatusChange(flight.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="scheduled">Đã lên lịch</option>
                        <option value="boarding">Đang lên máy bay</option>
                        <option value="departed">Đã cất cánh</option>
                        <option value="arrived">Đã hạ cánh</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Flight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thêm chuyến bay mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã chuyến bay</label>
                <input
                  type="text"
                  value={newFlight.flightCode}
                  onChange={(e) => setNewFlight({...newFlight, flightCode: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="VN123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đi</label>
                  <input
                    type="text"
                    value={newFlight.departure}
                    onChange={(e) => setNewFlight({...newFlight, departure: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Hà Nội (HAN)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
                  <input
                    type="text"
                    value={newFlight.arrival}
                    onChange={(e) => setNewFlight({...newFlight, arrival: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="TP.HCM (SGN)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đi</label>
                  <input
                    type="time"
                    value={newFlight.departureTime}
                    onChange={(e) => setNewFlight({...newFlight, departureTime: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đến</label>
                  <input
                    type="time"
                    value={newFlight.arrivalTime}
                    onChange={(e) => setNewFlight({...newFlight, arrivalTime: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máy bay</label>
                <input
                  type="text"
                  value={newFlight.aircraft}
                  onChange={(e) => setNewFlight({...newFlight, aircraft: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Boeing 737-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé</label>
                <input
                  type="number"
                  value={newFlight.price}
                  onChange={(e) => setNewFlight({...newFlight, price: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="2500000"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddFlight}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flight Modal */}
      {showEditModal && selectedFlight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Sửa chuyến bay</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã chuyến bay</label>
                <input
                  type="text"
                  value={selectedFlight.flightCode}
                  onChange={(e) => setSelectedFlight({...selectedFlight, flightCode: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đi</label>
                  <input
                    type="text"
                    value={selectedFlight.departure}
                    onChange={(e) => setSelectedFlight({...selectedFlight, departure: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
                  <input
                    type="text"
                    value={selectedFlight.arrival}
                    onChange={(e) => setSelectedFlight({...selectedFlight, arrival: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đi</label>
                  <input
                    type="time"
                    value={selectedFlight.departureTime}
                    onChange={(e) => setSelectedFlight({...selectedFlight, departureTime: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đến</label>
                  <input
                    type="time"
                    value={selectedFlight.arrivalTime}
                    onChange={(e) => setSelectedFlight({...selectedFlight, arrivalTime: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máy bay</label>
                <input
                  type="text"
                  value={selectedFlight.aircraft}
                  onChange={(e) => setSelectedFlight({...selectedFlight, aircraft: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé</label>
                <input
                  type="number"
                  value={selectedFlight.price}
                  onChange={(e) => setSelectedFlight({...selectedFlight, price: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleEditFlight}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightsAdmin;
