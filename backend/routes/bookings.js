// ===== BOOKINGS ROUTES - CSDL PHÂN TÁN =====
const express = require('express');
const router = express.Router();
const { dbRouter } = require('../server');

// ===== GET ALL BOOKINGS (Phân tán) =====
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      status, 
      payment_status, 
      date_from, 
      date_to, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Lấy tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    let allBookings = [];
    
    // Query từ tất cả các site
    for (const db of allDatabases) {
      try {
        let query = `
          SELECT b.*, 
                 f.flight_code,
                 f.airline,
                 f.departure_airport,
                 f.arrival_airport,
                 f.departure_city,
                 f.arrival_city,
                 f.flight_date,
                 f.departure_time,
                 f.arrival_time
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          WHERE 1=1
        `;
        
        const params = [];
        
        // Apply filters
        if (search) {
          query += ` AND (b.booking_code LIKE ? OR b.customer_name LIKE ? OR b.customer_email LIKE ? OR f.flight_code LIKE ?)`;
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (status) {
          query += ` AND b.status = ?`;
          params.push(status);
        }
        
        if (payment_status) {
          query += ` AND b.payment_status = ?`;
          params.push(payment_status);
        }
        
        if (date_from) {
          query += ` AND DATE(b.created_at) >= ?`;
          params.push(date_from);
        }
        
        if (date_to) {
          query += ` AND DATE(b.created_at) <= ?`;
          params.push(date_to);
        }
        
        query += ` ORDER BY b.created_at DESC`;
        
        const [bookings] = await db.execute(query, params);
        allBookings = allBookings.concat(bookings);
      } catch (error) {
        console.error(`Error querying bookings from database:`, error);
      }
    }
    
    // Sort all bookings by creation date
    allBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = allBookings.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: allBookings.length,
        total_pages: Math.ceil(allBookings.length / limit)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy danh sách đặt vé',
      error: error.message 
    });
  }
});

// ===== GET BOOKING BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;
    
    // Tìm trong tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [bookings] = await db.execute(`
          SELECT b.*, 
                 f.flight_code,
                 f.airline,
                 f.departure_airport,
                 f.arrival_airport,
                 f.departure_city,
                 f.arrival_city,
                 f.flight_date,
                 f.departure_time,
                 f.arrival_time
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          WHERE b.id = ?
        `, [id]);
        
        if (bookings.length > 0) {
          booking = bookings[0];
          break;
        }
      } catch (error) {
        console.error(`Error querying booking ${id} from database:`, error);
      }
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt vé'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin đặt vé',
      error: error.message 
    });
  }
});

// ===== CREATE BOOKING =====
router.post('/', async (req, res) => {
  try {
    const {
      flight_id,
      customer_name,
      customer_email,
      customer_phone,
      seat_number,
      total_amount
    } = req.body;
    
    // Validation
    if (!flight_id || !customer_name || !customer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Tìm chuyến bay trong tất cả databases
    let flight = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [flights] = await db.execute(
          'SELECT * FROM flights WHERE id = ? AND status = "available"',
          [flight_id]
        );
        
        if (flights.length > 0) {
          flight = flights[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding flight ${flight_id} in database:`, error);
      }
    }
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến bay hoặc chuyến bay không khả dụng'
      });
    }
    
    // Kiểm tra ghế còn trống
    const [bookings] = await targetDb.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE flight_id = ? AND status != "cancelled"',
      [flight_id]
    );
    
    if (bookings[0].count >= flight.total_seats) {
      return res.status(400).json({
        success: false,
        message: 'Chuyến bay đã hết ghế'
      });
    }
    
    // Tạo mã đặt vé
    const booking_code = `VN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Tìm hoặc tạo khách hàng
    let customer_id;
    const [existingCustomers] = await targetDb.execute(
      'SELECT id FROM customers WHERE email = ?',
      [customer_email]
    );
    
    if (existingCustomers.length > 0) {
      customer_id = existingCustomers[0].id;
    } else {
      const [customerResult] = await targetDb.execute(`
        INSERT INTO customers (name, email, phone, region)
        VALUES (?, ?, ?, ?)
      `, [customer_name, customer_email, customer_phone, flight.region]);
      
      customer_id = customerResult.insertId;
    }
    
    // Tạo đặt vé
    const [result] = await targetDb.execute(`
      INSERT INTO bookings (
        booking_code, flight_id, customer_id, customer_name,
        customer_email, customer_phone, seat_number, total_amount,
        status, payment_status, region
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      booking_code, flight_id, customer_id, customer_name,
      customer_email, customer_phone, seat_number, total_amount,
      'pending', 'pending', flight.region
    ]);
    
    // Cập nhật số ghế trống
    await targetDb.execute(
      'UPDATE flights SET available_seats = available_seats - 1 WHERE id = ?',
      [flight_id]
    );
    
    // Lấy thông tin đặt vé vừa tạo
    const [newBooking] = await targetDb.execute(`
      SELECT b.*, 
             f.flight_code,
             f.airline,
             f.departure_airport,
             f.arrival_airport,
             f.departure_city,
             f.arrival_city,
             f.flight_date,
             f.departure_time,
             f.arrival_time
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      WHERE b.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: newBooking[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi đặt vé',
      error: error.message 
    });
  }
});

// ===== UPDATE BOOKING =====
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Tìm đặt vé trong tất cả databases
    let booking = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [bookings] = await db.execute(
          'SELECT * FROM bookings WHERE id = ?',
          [id]
        );
        
        if (bookings.length > 0) {
          booking = bookings[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding booking ${id} in database:`, error);
      }
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt vé'
      });
    }
    
    // Cập nhật đặt vé
    const allowedFields = [
      'customer_name', 'customer_email', 'customer_phone',
      'seat_number', 'status', 'payment_status'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }
    
    updateValues.push(id);
    
    await targetDb.execute(
      `UPDATE bookings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    // Lấy thông tin đặt vé đã cập nhật
    const [updatedBooking] = await targetDb.execute(`
      SELECT b.*, 
             f.flight_code,
             f.airline,
             f.departure_airport,
             f.arrival_airport,
             f.departure_city,
             f.arrival_city,
             f.flight_date,
             f.departure_time,
             f.arrival_time
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      WHERE b.id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Cập nhật đặt vé thành công',
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật đặt vé',
      error: error.message 
    });
  }
});

// ===== CANCEL BOOKING =====
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm đặt vé trong tất cả databases
    let booking = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [bookings] = await db.execute(
          'SELECT * FROM bookings WHERE id = ? AND status != "cancelled"',
          [id]
        );
        
        if (bookings.length > 0) {
          booking = bookings[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding booking ${id} in database:`, error);
      }
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt vé hoặc đã bị hủy'
      });
    }
    
    // Hủy đặt vé
    await targetDb.execute(
      'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    // Cập nhật số ghế trống
    await targetDb.execute(
      'UPDATE flights SET available_seats = available_seats + 1 WHERE id = ?',
      [booking.flight_id]
    );
    
    res.json({
      success: true,
      message: 'Hủy đặt vé thành công'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi hủy đặt vé',
      error: error.message 
    });
  }
});

// ===== CONFIRM BOOKING =====
router.patch('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm đặt vé trong tất cả databases
    let booking = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [bookings] = await db.execute(
          'SELECT * FROM bookings WHERE id = ? AND status = "pending"',
          [id]
        );
        
        if (bookings.length > 0) {
          booking = bookings[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding booking ${id} in database:`, error);
      }
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt vé hoặc đã được xác nhận'
      });
    }
    
    // Xác nhận đặt vé
    await targetDb.execute(
      'UPDATE bookings SET status = "confirmed", payment_status = "paid", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Xác nhận đặt vé thành công'
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xác nhận đặt vé',
      error: error.message 
    });
  }
});

// ===== GET BOOKINGS BY CUSTOMER =====
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Tìm đặt vé của khách hàng từ tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    let allBookings = [];
    
    for (const db of allDatabases) {
      try {
        const [bookings] = await db.execute(`
          SELECT b.*, 
                 f.flight_code,
                 f.airline,
                 f.departure_airport,
                 f.arrival_airport,
                 f.departure_city,
                 f.arrival_city,
                 f.flight_date,
                 f.departure_time,
                 f.arrival_time
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          WHERE b.customer_email = ?
          ORDER BY b.created_at DESC
        `, [email]);
        
        allBookings = allBookings.concat(bookings);
      } catch (error) {
        console.error(`Error querying customer bookings from database:`, error);
      }
    }
    
    // Sort all bookings by creation date
    allBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = allBookings.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: allBookings.length,
        total_pages: Math.ceil(allBookings.length / limit)
      }
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy đặt vé của khách hàng',
      error: error.message 
    });
  }
});

// ===== GET BOOKING STATISTICS =====
router.get('/stats/overview', async (req, res) => {
  try {
    const allDatabases = dbRouter.getAllDatabases();
    let totalBookings = 0;
    let totalRevenue = 0;
    let statusStats = {
      pending: 0,
      confirmed: 0,
      cancelled: 0
    };
    let paymentStats = {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0
    };
    let regionStats = {};
    
    for (const db of allDatabases) {
      try {
        // Thống kê theo trạng thái
        const [statusCounts] = await db.execute(`
          SELECT 
            status,
            COUNT(*) as count,
            region
          FROM bookings
          GROUP BY status, region
        `);
        
        // Thống kê theo thanh toán
        const [paymentCounts] = await db.execute(`
          SELECT 
            payment_status,
            COUNT(*) as count,
            region
          FROM bookings
          GROUP BY payment_status, region
        `);
        
        // Thống kê doanh thu
        const [revenueStats] = await db.execute(`
          SELECT 
            SUM(total_amount) as total_revenue,
            COUNT(*) as total_bookings,
            region
          FROM bookings
          WHERE status != 'cancelled'
          GROUP BY region
        `);
        
        // Cộng dồn thống kê
        for (const stat of statusCounts) {
          statusStats[stat.status] += stat.count;
          if (!regionStats[stat.region]) {
            regionStats[stat.region] = { bookings: 0, revenue: 0 };
          }
        }
        
        for (const stat of paymentCounts) {
          paymentStats[stat.payment_status] += stat.count;
        }
        
        for (const stat of revenueStats) {
          totalBookings += stat.total_bookings;
          totalRevenue += parseFloat(stat.total_revenue || 0);
          if (!regionStats[stat.region]) {
            regionStats[stat.region] = { bookings: 0, revenue: 0 };
          }
          regionStats[stat.region].bookings = stat.total_bookings;
          regionStats[stat.region].revenue = parseFloat(stat.total_revenue || 0);
        }
      } catch (error) {
        console.error(`Error getting booking stats from database:`, error);
      }
    }
    
    res.json({
      success: true,
      data: {
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        status_stats: statusStats,
        payment_stats: paymentStats,
        region_stats: regionStats
      }
    });
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê đặt vé',
      error: error.message 
    });
  }
});

module.exports = router;