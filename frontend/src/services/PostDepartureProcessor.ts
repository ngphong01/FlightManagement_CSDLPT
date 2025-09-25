interface NoShowPassenger {
  id: string;
  name: string;
  bookingId: string;
  seat: string;
  baggage: {
    count: number;
    weight: number;
    status: 'OFFLOADED' | 'PENDING';
  };
  penalty: {
    amount: number;
    reason: string;
    applied: boolean;
  };
}

interface PostDepartureReport {
  flightId: string;
  flightCode: string;
  departureTime: Date;
  totalPassengers: number;
  boardedPassengers: number;
  noShowPassengers: number;
  baggageOffloaded: number;
  totalWeight: number;
  timelineEvents: Array<{
    event: string;
    timestamp: Date;
    status: string;
  }>;
  performanceMetrics: {
    closureEfficiency: number;
    passengerHandlingTime: number;
    baggageOffloadTime: number;
  };
  issues: Array<{
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

class PostDepartureProcessor {
  private static instance: PostDepartureProcessor;
  private processingFlights: Set<string> = new Set();

  static getInstance(): PostDepartureProcessor {
    if (!PostDepartureProcessor.instance) {
      PostDepartureProcessor.instance = new PostDepartureProcessor();
    }
    return PostDepartureProcessor.instance;
  }

  // Xử lý hậu khởi hành
  async processPostDeparture(flightId: string): Promise<void> {
    if (this.processingFlights.has(flightId)) {
      console.log(`⚠️ Flight ${flightId} is already being processed`);
      return;
    }

    this.processingFlights.add(flightId);
    console.log(`🔄 Starting post-departure processing for flight ${flightId}`);

    try {
      // 1. Xử lý no-show passengers
      await this.processNoShowPassengers(flightId);
      
      // 2. Tính toán refund/rebooking
      await this.handleNoShowRefunds(flightId);
      
      // 3. Cập nhật loyalty points
      await this.updateLoyaltyPoints(flightId);
      
      // 4. Generate reports
      const report = await this.generatePostFlightReport(flightId);
      
      // 5. Cleanup temporary data
      await this.cleanupFlightData(flightId);
      
      // 6. Gửi báo cáo
      await this.distributeReport(report);
      
      console.log(`✅ Post-departure processing completed for flight ${flightId}`);
      
    } catch (error) {
      console.error(`❌ Error in post-departure processing for flight ${flightId}:`, error);
    } finally {
      this.processingFlights.delete(flightId);
    }
  }

  // Xử lý hành khách no-show
  private async processNoShowPassengers(flightId: string): Promise<void> {
    const noShowPassengers = await this.getNoShowPassengers(flightId);
    console.log(`👥 Processing ${noShowPassengers.length} no-show passengers`);
    
    for (const passenger of noShowPassengers) {
      try {
        // Áp dụng no-show policy
        const penalty = await this.applyNoShowPenalty(passenger.bookingId);
        passenger.penalty = penalty;
        
        // Cập nhật trạng thái booking
        await this.updateBookingStatus(passenger.bookingId, 'NO_SHOW');
        
        // Gửi thông báo cho hành khách
        await this.sendNoShowNotification(passenger, penalty);
        
        // Cập nhật loyalty points (trừ điểm)
        await this.deductLoyaltyPoints(passenger.id, penalty.amount);
        
        console.log(`✅ Processed no-show passenger: ${passenger.name}`);
        
      } catch (error) {
        console.error(`❌ Error processing no-show passenger ${passenger.name}:`, error);
      }
    }
  }

  // Xử lý hoàn tiền cho no-show
  private async handleNoShowRefunds(flightId: string): Promise<void> {
    const noShowBookings = await this.getNoShowBookings(flightId);
    console.log(`💰 Processing refunds for ${noShowBookings.length} no-show bookings`);
    
    for (const booking of noShowBookings) {
      try {
        // Tính toán refund amount
        const refundAmount = await this.calculateRefundAmount(booking.id);
        
        // Tạo refund request
        await this.createRefundRequest(booking.id, refundAmount);
        
        // Cập nhật payment status
        await this.updatePaymentStatus(booking.id, 'REFUND_PENDING');
        
        console.log(`✅ Created refund request for booking ${booking.id}: ${refundAmount} VND`);
        
      } catch (error) {
        console.error(`❌ Error processing refund for booking ${booking.id}:`, error);
      }
    }
  }

  // Cập nhật loyalty points
  private async updateLoyaltyPoints(flightId: string): Promise<void> {
    const passengers = await this.getFlightPassengers(flightId);
    console.log(`⭐ Updating loyalty points for ${passengers.length} passengers`);
    
    for (const passenger of passengers) {
      try {
        if (passenger.status === 'BOARDED') {
          // Thêm điểm cho hành khách đã lên máy bay
          await this.addLoyaltyPoints(passenger.id, 100);
        } else if (passenger.status === 'NO_SHOW') {
          // Trừ điểm cho hành khách no-show
          await this.deductLoyaltyPoints(passenger.id, 50);
        }
        
        console.log(`✅ Updated loyalty points for passenger ${passenger.name}`);
        
      } catch (error) {
        console.error(`❌ Error updating loyalty points for passenger ${passenger.name}:`, error);
      }
    }
  }

  // Tạo báo cáo hậu khởi hành
  private async generatePostFlightReport(flightId: string): Promise<PostDepartureReport> {
    const flight = await this.getFlightDetails(flightId);
    const timelineEvents = await this.getTimelineEvents(flightId);
    const performanceMetrics = await this.calculatePerformanceMetrics(flightId);
    const issues = await this.identifyIssues(flightId);
    
    const report: PostDepartureReport = {
      flightId,
      flightCode: flight.flightCode,
      departureTime: flight.departureTime,
      totalPassengers: flight.totalPassengers,
      boardedPassengers: flight.boardedPassengers,
      noShowPassengers: flight.noShowPassengers,
      baggageOffloaded: flight.baggageOffloaded,
      totalWeight: flight.totalWeight,
      timelineEvents,
      performanceMetrics,
      issues
    };
    
    // Lưu báo cáo
    await this.saveReport(report);
    
    console.log(`📊 Generated post-flight report for flight ${flightId}`);
    return report;
  }

  // Dọn dẹp dữ liệu tạm thời
  private async cleanupFlightData(flightId: string): Promise<void> {
    try {
      // Xóa dữ liệu tạm thời
      await this.deleteTemporaryData(flightId);
      
      // Cập nhật trạng thái chuyến bay
      await this.updateFlightStatus(flightId, 'DEPARTED');
      
      // Lưu trữ dữ liệu lịch sử
      await this.archiveFlightData(flightId);
      
      console.log(`🧹 Cleaned up temporary data for flight ${flightId}`);
      
    } catch (error) {
      console.error(`❌ Error cleaning up flight data for ${flightId}:`, error);
    }
  }

  // Các phương thức hỗ trợ
  private async getNoShowPassengers(_flightId: string): Promise<NoShowPassenger[]> {
    // API call để lấy danh sách hành khách no-show
    return [];
  }

  private async getNoShowBookings(_flightId: string): Promise<any[]> {
    // API call để lấy danh sách booking no-show
    return [];
  }

  private async getFlightPassengers(_flightId: string): Promise<any[]> {
    // API call để lấy danh sách hành khách
    return [];
  }

  private async getFlightDetails(_flightId: string): Promise<any> {
    // API call để lấy chi tiết chuyến bay
    return {};
  }

  private async getTimelineEvents(_flightId: string): Promise<any[]> {
    // API call để lấy timeline events
    return [];
  }

  private async calculatePerformanceMetrics(_flightId: string): Promise<any> {
    // Tính toán các chỉ số hiệu suất
    return {
      closureEfficiency: 95,
      passengerHandlingTime: 15,
      baggageOffloadTime: 8
    };
  }

  private async identifyIssues(_flightId: string): Promise<any[]> {
    // Xác định các vấn đề
    return [];
  }

  private async applyNoShowPenalty(_bookingId: string): Promise<any> {
    // Áp dụng phạt no-show
    return {
      amount: 500000,
      reason: 'No-show penalty',
      applied: true
    };
  }

  private async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    // Cập nhật trạng thái booking
    console.log(`📝 Updated booking ${bookingId} status to ${status}`);
  }

  private async sendNoShowNotification(_passenger: NoShowPassenger, _penalty: any): Promise<void> {
    // Gửi thông báo no-show
    console.log('📧 Sent no-show notification');
  }

  private async deductLoyaltyPoints(_passengerId: string, _amount: number): Promise<void> {
    // Trừ điểm loyalty
    console.log('⭐ Deducted loyalty points');
  }

  private async addLoyaltyPoints(_passengerId: string, _amount: number): Promise<void> {
    // Thêm điểm loyalty
    console.log('⭐ Added loyalty points');
  }

  private async calculateRefundAmount(_bookingId: string): Promise<number> {
    // Tính toán số tiền hoàn
    return 1000000;
  }

  private async createRefundRequest(_bookingId: string, _amount: number): Promise<void> {
    // Tạo yêu cầu hoàn tiền
    console.log('💰 Created refund request');
  }

  private async updatePaymentStatus(_bookingId: string, _status: string): Promise<void> {
    // Cập nhật trạng thái thanh toán
    console.log('💳 Updated payment status');
  }

  private async saveReport(report: PostDepartureReport): Promise<void> {
    // Lưu báo cáo
    console.log(`📊 Saved post-flight report for flight ${report.flightId}`);
  }

  private async distributeReport(report: PostDepartureReport): Promise<void> {
    // Phân phối báo cáo
    console.log(`📤 Distributed report for flight ${report.flightId}`);
  }

  private async deleteTemporaryData(flightId: string): Promise<void> {
    // Xóa dữ liệu tạm thời
    console.log(`🗑️ Deleted temporary data for flight ${flightId}`);
  }

  private async updateFlightStatus(flightId: string, status: string): Promise<void> {
    // Cập nhật trạng thái chuyến bay
    console.log(`✈️ Updated flight ${flightId} status to ${status}`);
  }

  private async archiveFlightData(flightId: string): Promise<void> {
    // Lưu trữ dữ liệu lịch sử
    console.log(`📦 Archived flight data for flight ${flightId}`);
  }
}

export default PostDepartureProcessor;
export type { NoShowPassenger, PostDepartureReport };
