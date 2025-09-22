// ===== FLIGHTS ROUTES - CSDL PHÂN TÁN =====
const express = require('express');
const router = express.Router();
const { dbRouter } = require('../server');

// ===== GET ALL FLIGHTS (Phân tán) =====
router.get('/', async (req, res) => {
  try {
    const { search, status, date_from, date_to, page = 1, limit = 10 } = req.query;
    
    // Lấy tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    let allFlights = [];
    
    // Query từ tất cả các site
    for (const db of allDatabases) {
      try {
        let query = `
          SELECT f.*, 
                 COUNT(b.id) as booking_count,
                 f.total_seats - COUNT(b.id) as available_seats
          FROM flights f
          LEFT JOIN bookings b ON f.id = b.flight_id AND b.status != 'cancelled'
          WHERE 1=1
        `;
        
        const params = [];
        
        // Apply filters
        if (search) {
          query += ` AND (f.flight_code LIKE ? OR f.airline LIKE ? OR f.departure_city LIKE ? OR f.arrival_city LIKE ?)`;
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (status) {
          query += ` AND f.status = ?`;
          params.push(status);
        }
        
        if (date_from) {
          query += ` AND f.flight_date >= ?`;
          params.push(date_from);
        }
        
        if (date_to) {
          query += ` AND f.flight_date <= ?`;
          params.push(date_to);
        }
        
        query += ` GROUP BY f.id ORDER BY f.created_at DESC`;
        
        const [flights] = await db.execute(query, params);
        allFlights = allFlights.concat(flights);
      } catch (error) {
        console.error(`Error querying flights from database:`, error);
      }
    }
    
    // Sort all flights by creation date
    allFlights.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFlights = allFlights.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedFlights,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: allFlights.length,
        total_pages: Math.ceil(allFlights.length / limit)
      }
    });
  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy danh sách chuyến bay',
      error: error.message 
    });
  }
});

// ===== GET FLIGHT BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let flight = null;
    
    // Tìm trong tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [flights] = await db.execute(
          'SELECT * FROM flights WHERE id = ?',
          [id]
        );
        
        if (flights.length > 0) {
          flight = flights[0];
          break;
        }
      } catch (error) {
        console.error(`Error querying flight ${id} from database:`, error);
      }
    }
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến bay'
      });
    }
    
    res.json({
      success: true,
      data: flight
    });
  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin chuyến bay',
      error: error.message 
    });
  }
});

// ===== CREATE FLIGHT =====
router.post('/', async (req, res) => {
  try {
    const {
      flight_code,
      airline,
      departure_airport,
      arrival_airport,
      departure_city,
      arrival_city,
      flight_date,
      departure_time,
      arrival_time,
      price,
      total_seats,
      status = 'available'
    } = req.body;
    
    // Validation
    if (!flight_code || !airline || !departure_airport || !arrival_airport) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Xác định database dựa trên sân bay đi
    const db = dbRouter.getDatabaseByAirport(departure_airport);
    
    // Kiểm tra mã chuyến bay đã tồn tại chưa
    const [existingFlights] = await db.execute(
      'SELECT id FROM flights WHERE flight_code = ?',
      [flight_code]
    );
    
    if (existingFlights.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã chuyến bay đã tồn tại'
      });
    }
    
    // Tạo chuyến bay mới
    const [result] = await db.execute(`
      INSERT INTO flights (
        flight_code, airline, departure_airport, arrival_airport,
        departure_city, arrival_city, flight_date, departure_time,
        arrival_time, price, total_seats, available_seats, status, region
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      flight_code, airline, departure_airport, arrival_airport,
      departure_city, arrival_city, flight_date, departure_time,
      arrival_time, price, total_seats, total_seats, status, 
      dbRouter.regionMapping[departure_airport] || 'unknown'
    ]);
    
    // Lấy thông tin chuyến bay vừa tạo
    const [newFlight] = await db.execute(
      'SELECT * FROM flights WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Tạo chuyến bay thành công',
      data: newFlight[0]
    });
  } catch (error) {
    console.error('Create flight error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tạo chuyến bay',
      error: error.message 
    });
  }
});

// ===== UPDATE FLIGHT =====
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Tìm chuyến bay trong tất cả databases
    let flight = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [flights] = await db.execute(
          'SELECT * FROM flights WHERE id = ?',
          [id]
        );
        
        if (flights.length > 0) {
          flight = flights[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding flight ${id} in database:`, error);
      }
    }
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến bay'
      });
    }
    
    // Cập nhật chuyến bay
    const allowedFields = [
      'airline', 'departure_airport', 'arrival_airport',
      'departure_city', 'arrival_city', 'flight_date',
      'departure_time', 'arrival_time', 'price',
      'total_seats', 'status'
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
      `UPDATE flights SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    // Lấy thông tin chuyến bay đã cập nhật
    const [updatedFlight] = await targetDb.execute(
      'SELECT * FROM flights WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Cập nhật chuyến bay thành công',
      data: updatedFlight[0]
    });
  } catch (error) {
    console.error('Update flight error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật chuyến bay',
      error: error.message 
    });
  }
});

// ===== DELETE FLIGHT =====
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm chuyến bay trong tất cả databases
    let flight = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [flights] = await db.execute(
          'SELECT * FROM flights WHERE id = ?',
          [id]
        );
        
        if (flights.length > 0) {
          flight = flights[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding flight ${id} in database:`, error);
      }
    }
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến bay'
      });
    }
    
    // Kiểm tra có đặt vé nào không
    const [bookings] = await targetDb.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE flight_id = ? AND status != "cancelled"',
      [id]
    );
    
    if (bookings[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chuyến bay đã có đặt vé'
      });
    }
    
    // Xóa chuyến bay
    await targetDb.execute('DELETE FROM flights WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Xóa chuyến bay thành công'
    });
  } catch (error) {
    console.error('Delete flight error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa chuyến bay',
      error: error.message 
    });
  }
});

// ===== SEARCH FLIGHTS =====
router.get('/search/route', async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.query;
    
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin tìm kiếm'
      });
    }
    
    // Tìm chuyến bay từ tất cả databases
    const allDatabases = dbRouter.getAllDatabases();
    let allFlights = [];
    
    for (const db of allDatabases) {
      try {
        const [flights] = await db.execute(`
          SELECT f.*, 
                 COUNT(b.id) as booking_count,
                 f.total_seats - COUNT(b.id) as available_seats
          FROM flights f
          LEFT JOIN bookings b ON f.id = b.flight_id AND b.status != 'cancelled'
          WHERE f.departure_airport = ? 
            AND f.arrival_airport = ? 
            AND f.flight_date = ?
            AND f.status = 'available'
          GROUP BY f.id
          HAVING available_seats >= ?
          ORDER BY f.departure_time
        `, [from, to, date, passengers]);
        
        allFlights = allFlights.concat(flights);
      } catch (error) {
        console.error(`Error searching flights in database:`, error);
      }
    }
    
    // Sắp xếp theo giờ đi
    allFlights.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    
    res.json({
      success: true,
      data: allFlights,
      search_params: { from, to, date, passengers }
    });
  } catch (error) {
    console.error('Search flights error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tìm kiếm chuyến bay',
      error: error.message 
    });
  }
});

// ===== GET FLIGHTS BY REGION =====
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Xác định database theo region
    const db = dbRouter.getDatabaseByRegion(region);
    
    const offset = (page - 1) * limit;
    
    const [flights] = await db.execute(`
      SELECT f.*, 
             COUNT(b.id) as booking_count,
             f.total_seats - COUNT(b.id) as available_seats
      FROM flights f
      LEFT JOIN bookings b ON f.id = b.flight_id AND b.status != 'cancelled'
      WHERE f.region = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [region, parseInt(limit), offset]);
    
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM flights WHERE region = ?',
      [region]
    );
    
    res.json({
      success: true,
      data: flights,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalCount[0].total,
        total_pages: Math.ceil(totalCount[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get flights by region error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy chuyến bay theo khu vực',
      error: error.message 
    });
  }
});

// ===== GET FLIGHT STATISTICS =====
router.get('/stats/overview', async (req, res) => {
  try {
    const allDatabases = dbRouter.getAllDatabases();
    let totalFlights = 0;
    let totalBookings = 0;
    let totalRevenue = 0;
    let regionStats = {};
    
    for (const db of allDatabases) {
      try {
        // Thống kê chuyến bay
        const [flightStats] = await db.execute(`
          SELECT 
            COUNT(*) as total_flights,
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available_flights,
            COUNT(CASE WHEN status = 'booked' THEN 1 END) as booked_flights,
            region
          FROM flights
          GROUP BY region
        `);
        
        // Thống kê đặt vé
        const [bookingStats] = await db.execute(`
          SELECT 
            COUNT(*) as total_bookings,
            SUM(total_amount) as total_revenue,
            region
          FROM bookings
          WHERE status != 'cancelled'
          GROUP BY region
        `);
        
        // Cộng dồn thống kê
        for (const stat of flightStats) {
          const region = stat.region;
          if (!regionStats[region]) {
            regionStats[region] = {
              flights: 0,
              bookings: 0,
              revenue: 0
            };
          }
          regionStats[region].flights = stat.total_flights;
          totalFlights += stat.total_flights;
        }
        
        for (const stat of bookingStats) {
          const region = stat.region;
          if (!regionStats[region]) {
            regionStats[region] = {
              flights: 0,
              bookings: 0,
              revenue: 0
            };
          }
          regionStats[region].bookings = stat.total_bookings;
          regionStats[region].revenue = parseFloat(stat.total_revenue || 0);
          totalBookings += stat.total_bookings;
          totalRevenue += parseFloat(stat.total_revenue || 0);
        }
      } catch (error) {
        console.error(`Error getting stats from database:`, error);
      }
    }
    
    res.json({
      success: true,
      data: {
        total_flights: totalFlights,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        occupancy_rate: totalFlights > 0 ? Math.round((totalBookings / (totalFlights * 50)) * 100) : 0,
        region_stats: regionStats
      }
    });
  } catch (error) {
    console.error('Get flight statistics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê chuyến bay',
      error: error.message 
    });
  }
});

module.exports = router;