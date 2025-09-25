interface FlightTimelineEvent {
  id: string;
  flightId: string;
  eventType: 'CHECK_IN_CLOSED' | 'GATE_CLOSING' | 'FINAL_CALL' | 'GATE_CLOSED' | 'DEPARTURE';
  timestamp: Date;
  timeToDeparture: number; // minutes
  status: 'PENDING' | 'TRIGGERED' | 'COMPLETED';
  actor?: string;
  details?: any;
}

interface FlightStatus {
  id: string;
  flightCode: string;
  departureTime: Date;
  gate: string;
  status: 'SCHEDULED' | 'CHECK_IN_OPEN' | 'CHECK_IN_CLOSED' | 'GATE_CLOSING' | 'FINAL_CALL' | 'GATE_CLOSED' | 'DEPARTED';
  passengers: {
    total: number;
    checkedIn: number;
    boarded: number;
    missing: number;
  };
  baggage: {
    loaded: number;
    toOffload: number;
  };
}

class FlightTimelineService {
  private static instance: FlightTimelineService;
  private timelineEvents: Map<string, FlightTimelineEvent[]> = new Map();
  private activeFlights: Map<string, FlightStatus> = new Map();
  private intervalId: number | null = null;

  static getInstance(): FlightTimelineService {
    if (!FlightTimelineService.instance) {
      FlightTimelineService.instance = new FlightTimelineService();
    }
    return FlightTimelineService.instance;
  }

  // Khởi động monitoring system
  startMonitoring(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.processTimelineEvents();
    }, 30000); // Check every 30 seconds
    
    console.log('🕐 Flight Timeline Monitoring started');
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ Flight Timeline Monitoring stopped');
  }

  // Thêm chuyến bay vào monitoring
  addFlightToMonitoring(flight: FlightStatus): void {
    this.activeFlights.set(flight.id, flight);
    this.scheduleTimelineEvents(flight);
    console.log(`✈️ Added flight ${flight.flightCode} to monitoring`);
  }

  // Lên lịch các sự kiện timeline
  private scheduleTimelineEvents(flight: FlightStatus): void {
    const departureTime = new Date(flight.departureTime);
    const events = [
      { type: 'CHECK_IN_CLOSED', minutes: -60 },
      { type: 'GATE_CLOSING', minutes: -45 },
      { type: 'FINAL_CALL', minutes: -40 },
      { type: 'GATE_CLOSED', minutes: -35 },
      { type: 'DEPARTURE', minutes: 0 }
    ];

    events.forEach(({ type, minutes }) => {
      const eventTime = new Date(departureTime.getTime() + minutes * 60000);
      const event: FlightTimelineEvent = {
        id: `${flight.id}-${type}-${Date.now()}`,
        flightId: flight.id,
        eventType: type as any,
        timestamp: eventTime,
        timeToDeparture: minutes,
        status: 'PENDING'
      };

      if (!this.timelineEvents.has(flight.id)) {
        this.timelineEvents.set(flight.id, []);
      }
      this.timelineEvents.get(flight.id)!.push(event);
    });
  }

  // Xử lý các sự kiện timeline
  private async processTimelineEvents(): Promise<void> {
    const now = new Date();
    
    for (const [, events] of this.timelineEvents) {
      for (const event of events) {
        if (event.status === 'PENDING' && now >= event.timestamp) {
          await this.triggerEvent(event);
        }
      }
    }
  }

  // Kích hoạt sự kiện
  private async triggerEvent(event: FlightTimelineEvent): Promise<void> {
    console.log(`🚨 Triggering event: ${event.eventType} for flight ${event.flightId}`);
    
    try {
      switch (event.eventType) {
        case 'CHECK_IN_CLOSED':
          await this.handleCheckInClosure(event);
          break;
        case 'GATE_CLOSING':
          await this.handleGateClosing(event);
          break;
        case 'FINAL_CALL':
          await this.handleFinalCall(event);
          break;
        case 'GATE_CLOSED':
          await this.handleGateClosure(event);
          break;
        case 'DEPARTURE':
          await this.handleDeparture(event);
          break;
      }
      
      event.status = 'TRIGGERED';
      await this.logEvent(event);
      
    } catch (error) {
      console.error(`❌ Error triggering event ${event.eventType}:`, error);
    }
  }

  // Xử lý đóng check-in
  private async handleCheckInClosure(event: FlightTimelineEvent): Promise<void> {
    const flight = this.activeFlights.get(event.flightId);
    if (!flight) return;

    // Đóng online check-in
    await this.closeOnlineCheckIn(event.flightId);
    
    // Đóng airport check-in
    await this.closeAirportCheckIn(event.flightId);
    
    // Cập nhật trạng thái chuyến bay
    flight.status = 'CHECK_IN_CLOSED';
    this.activeFlights.set(event.flightId, flight);
    
    // Thông báo đến nhân viên
    await this.notifyStaff(event.flightId, 'CHECK_IN_CLOSED', {
      message: `Check-in đã đóng cho chuyến bay ${flight.flightCode}`,
      action: 'Monitor late passengers'
    });
    
    // Thông báo đến hành khách
    await this.notifyPassengers(event.flightId, 'CHECK_IN_CLOSED', {
      message: 'Check-in đã đóng. Vui lòng đến cổng ngay lập tức.',
      urgency: 'HIGH'
    });
  }

  // Xử lý đóng cổng
  private async handleGateClosing(event: FlightTimelineEvent): Promise<void> {
    const flight = this.activeFlights.get(event.flightId);
    if (!flight) return;

    // Cập nhật trạng thái cổng
    await this.updateGateStatus(flight.gate, 'CLOSING');
    
    // Thông báo cuối cùng
    await this.makeFinalAnnouncement(event.flightId);
    
    // Kiểm tra hành khách vắng mặt
    const missingPassengers = await this.getMissingPassengers(event.flightId);
    
    if (missingPassengers.length > 0) {
      await this.handleMissingPassengers(event.flightId, missingPassengers);
    }
    
    flight.status = 'GATE_CLOSING';
    this.activeFlights.set(event.flightId, flight);
  }

  // Xử lý final call
  private async handleFinalCall(event: FlightTimelineEvent): Promise<void> {
    const flight = this.activeFlights.get(event.flightId);
    if (!flight) return;

    // Thông báo cuối cùng
    await this.makeFinalCallAnnouncement(event.flightId);
    
    // Cập nhật trạng thái
    flight.status = 'FINAL_CALL';
    this.activeFlights.set(event.flightId, flight);
    
    // Thông báo khẩn cấp
    await this.notifyStaff(event.flightId, 'FINAL_CALL', {
      message: `FINAL CALL cho chuyến bay ${flight.flightCode}`,
      urgency: 'CRITICAL'
    });
  }

  // Xử lý đóng cổng hoàn toàn
  private async handleGateClosure(event: FlightTimelineEvent): Promise<void> {
    const flight = this.activeFlights.get(event.flightId);
    if (!flight) return;

    // Đóng cổng
    await this.closeGate(flight.gate);
    
    // Offload hành khách vắng mặt
    await this.offloadMissingPassengers(event.flightId);
    
    // Cập nhật trạng thái
    flight.status = 'GATE_CLOSED';
    this.activeFlights.set(event.flightId, flight);
    
    // Thông báo ATC
    await this.notifyATC(event.flightId, 'GATE_CLOSED');
  }

  // Xử lý khởi hành
  private async handleDeparture(event: FlightTimelineEvent): Promise<void> {
    const flight = this.activeFlights.get(event.flightId);
    if (!flight) return;

    // Tạo final manifest
    await this.generateFinalManifest(event.flightId);
    
    // Cập nhật trạng thái
    flight.status = 'DEPARTED';
    this.activeFlights.set(event.flightId, flight);
    
    // Kích hoạt hậu xử lý
    await this.activatePostDepartureProcesses(event.flightId);
  }

  // Các phương thức hỗ trợ
  private async closeOnlineCheckIn(flightId: string): Promise<void> {
    // API call để đóng online check-in
    console.log(`🔒 Closing online check-in for flight ${flightId}`);
  }

  private async closeAirportCheckIn(flightId: string): Promise<void> {
    // API call để đóng airport check-in
    console.log(`🔒 Closing airport check-in for flight ${flightId}`);
  }

  private async updateGateStatus(gate: string, status: string): Promise<void> {
    // API call để cập nhật trạng thái cổng
    console.log(`🚪 Gate ${gate} status: ${status}`);
  }

  private async makeFinalAnnouncement(flightId: string): Promise<void> {
    // API call để thông báo cuối cùng
    console.log(`📢 Making final announcement for flight ${flightId}`);
  }

  private async makeFinalCallAnnouncement(flightId: string): Promise<void> {
    // API call để thông báo final call
    console.log(`📢 Making final call for flight ${flightId}`);
  }

  private async getMissingPassengers(_flightId: string): Promise<any[]> {
    // API call để lấy danh sách hành khách vắng mặt
    return [];
  }

  private async handleMissingPassengers(flightId: string, passengers: any[]): Promise<void> {
    // Xử lý hành khách vắng mặt
    console.log(`👥 Handling ${passengers.length} missing passengers for flight ${flightId}`);
  }

  private async closeGate(gate: string): Promise<void> {
    // API call để đóng cổng
    console.log(`🚪 Closing gate ${gate}`);
  }

  private async offloadMissingPassengers(flightId: string): Promise<void> {
    // API call để offload hành khách vắng mặt
    console.log(`📦 Offloading missing passengers for flight ${flightId}`);
  }

  private async notifyATC(flightId: string, status: string): Promise<void> {
    // API call để thông báo ATC
    console.log(`🛩️ Notifying ATC for flight ${flightId}: ${status}`);
  }

  private async generateFinalManifest(flightId: string): Promise<void> {
    // API call để tạo final manifest
    console.log(`📋 Generating final manifest for flight ${flightId}`);
  }

  private async activatePostDepartureProcesses(flightId: string): Promise<void> {
    // API call để kích hoạt hậu xử lý
    console.log(`🔄 Activating post-departure processes for flight ${flightId}`);
  }

  private async notifyStaff(flightId: string, event: string, _data: any): Promise<void> {
    // API call để thông báo nhân viên
    console.log(`👨‍💼 Notifying staff for flight ${flightId}: ${event}`);
  }

  private async notifyPassengers(flightId: string, event: string, _data: any): Promise<void> {
    // API call để thông báo hành khách
    console.log(`👤 Notifying passengers for flight ${flightId}: ${event}`);
  }

  private async logEvent(event: FlightTimelineEvent): Promise<void> {
    // API call để log sự kiện
    console.log(`📝 Logging event: ${event.eventType} for flight ${event.flightId}`);
  }

  // Lấy trạng thái chuyến bay
  getFlightStatus(flightId: string): FlightStatus | undefined {
    return this.activeFlights.get(flightId);
  }

  // Lấy timeline events
  getTimelineEvents(flightId: string): FlightTimelineEvent[] {
    return this.timelineEvents.get(flightId) || [];
  }

  // Lấy tất cả chuyến bay đang monitoring
  getAllActiveFlights(): FlightStatus[] {
    return Array.from(this.activeFlights.values());
  }
}

export default FlightTimelineService;
export type { FlightTimelineEvent, FlightStatus };
