import React, { useState, useEffect } from 'react';
import FlightTimelineService, { type FlightStatus, type FlightTimelineEvent } from '../../services/FlightTimelineService';

interface FlightStatusMonitorProps {
  flightId: string;
}

const FlightStatusMonitor: React.FC<FlightStatusMonitorProps> = ({
  flightId
}) => {
  const [flight, setFlight] = useState<FlightStatus | null>(null);
  const [events, setEvents] = useState<FlightTimelineEvent[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const timelineService = FlightTimelineService.getInstance();

  useEffect(() => {
    loadFlightData();
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [flightId]);

  useEffect(() => {
    if (flight) {
      startCountdown();
    }
  }, [flight]);

  const loadFlightData = () => {
    const flightData = timelineService.getFlightStatus(flightId);
    const timelineEvents = timelineService.getTimelineEvents(flightId);
    
    setFlight(flightData || null);
    setEvents(timelineEvents);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      loadFlightData();
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const startCountdown = () => {
    if (!flight) return;

    const interval = setInterval(() => {
      const now = new Date();
      const departureTime = new Date(flight.departureTime);
      const remaining = Math.floor((departureTime.getTime() - now.getTime()) / 1000 / 60);
      
      setTimeRemaining(remaining);
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'CHECK_IN_OPEN': return 'bg-green-100 text-green-800';
      case 'CHECK_IN_CLOSED': return 'bg-yellow-100 text-yellow-800';
      case 'GATE_CLOSING': return 'bg-orange-100 text-orange-800';
      case 'GATE_CLOSED': return 'bg-red-100 text-red-800';
      case 'DEPARTED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'CHECK_IN_OPEN': return 'Mở check-in';
      case 'CHECK_IN_CLOSED': return 'Đóng check-in';
      case 'GATE_CLOSING': return 'Đóng cổng';
      case 'GATE_CLOSED': return 'Cổng đã đóng';
      case 'DEPARTED': return 'Đã khởi hành';
      default: return status;
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'TRIGGERED': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'TRIGGERED': return 'Đã kích hoạt';
      case 'PENDING': return 'Chờ xử lý';
      default: return status;
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'CHECK_IN_CLOSED': return 'Đóng check-in';
      case 'GATE_CLOSING': return 'Đóng cổng';
      case 'FINAL_CALL': return 'Thông báo cuối cùng';
      case 'GATE_CLOSED': return 'Cổng đã đóng';
      case 'DEPARTURE': return 'Khởi hành';
      default: return eventType;
    }
  };

  if (!flight) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu chuyến bay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Flight Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {flight.flightCode}
          </h3>
          <p className="text-gray-600">
            Cổng: {flight.gate} | Khởi hành: {new Date(flight.departureTime).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(flight.status)}`}>
            {getStatusText(flight.status)}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {isMonitoring ? '🟢 Đang theo dõi' : '🔴 Dừng theo dõi'}
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className={`mb-6 p-4 rounded-lg ${timeRemaining <= 10 ? 'bg-red-100 border-red-300' : 'bg-blue-100 border-blue-300'} border-2`}>
        <div className="text-center">
          <h4 className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            CÒN LẠI: {formatTime(timeRemaining)}
          </h4>
          {timeRemaining <= 10 && (
            <div className="mt-2 text-red-600 font-semibold animate-pulse">
              ⚠️ KHẨN CẤP
            </div>
          )}
        </div>
      </div>

      {/* Flight Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{flight.passengers.total}</div>
          <div className="text-sm text-gray-600">Tổng hành khách</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{flight.passengers.checkedIn}</div>
          <div className="text-sm text-gray-600">Đã check-in</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{flight.passengers.boarded}</div>
          <div className="text-sm text-gray-600">Đã lên máy bay</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{flight.passengers.missing}</div>
          <div className="text-sm text-gray-600">Vắng mặt</div>
        </div>
      </div>

      {/* Timeline Events */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline Events</h4>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    {getEventTypeText(event.eventType)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {event.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEventStatusColor(event.status)}`}>
                  {getEventStatusText(event.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {event.timeToDeparture > 0 ? `+${event.timeToDeparture}m` : `${event.timeToDeparture}m`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Baggage Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Thông tin Hành lý</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{flight.baggage.loaded}</div>
            <div className="text-sm text-gray-600">Đã tải</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{flight.baggage.toOffload}</div>
            <div className="text-sm text-gray-600">Cần offload</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightStatusMonitor;
