// ===== FLIGHT MANAGEMENT BACKEND - COMPLETE FIXED VERSION =====
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, testConnections } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'flight_management_secret_key_2025';

// ===== MIDDLEWARE SETUP =====
// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all origins for development
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  // Log request body for POST requests (excluding sensitive data)
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    console.log('Login request body:', {
      username: req.body?.username,
      password: req.body?.password ? '***' : 'missing'
    });
  }
  
  next();
});

// ===== UTILITY FUNCTIONS =====
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount);
};

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnections();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      message: 'Flight Management Backend is running!'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== AUTHENTICATION MIDDLEWARE =====
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ===== DATABASE TEST ENDPOINTS =====
app.get('/api/test-db', async (req, res) => {
  console.log('=== DATABASE CONNECTION TEST ===');
  try {
    const sites = ['hanoi', 'danang', 'saigon'];
    const results = {};

    for (const site of sites) {
      try {
        console.log(`Testing ${site}...`);
        const pool = await getConnection(site);

        // Test basic connection
        const [testQuery] = await pool.execute('SELECT 1 as test');
        
        // Check users table structure first
        const [tableInfo] = await pool.execute('DESCRIBE users');
        const hasActiveColumn = tableInfo.some(col => col.Field === 'active');
        const hasIsActiveColumn = tableInfo.some(col => col.Field === 'is_active');
        
        console.log(`${site} - Table structure:`, {
          hasActiveColumn,
          hasIsActiveColumn,
          columns: tableInfo.map(col => col.Field)
        });
        
        // Check users table with correct column
        const activeColumn = hasActiveColumn ? 'active' : 'is_active';
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        
        // Get sample users with correct column
        const [sampleUsers] = await pool.execute(
          `SELECT id, username, role, region, ${activeColumn} as active, created_at FROM users LIMIT 5`
        );

        results[site] = {
          status: 'connected',
          userCount: userCount[0].count,
          tableStructure: {
            hasActiveColumn,
            hasIsActiveColumn,
            activeColumn
          },
          sampleUsers: sampleUsers.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            region: u.region,
            active: u.active,
            created_at: u.created_at
          }))
        };

        console.log(`✅ ${site}: ${userCount[0].count} users found, using column: ${activeColumn}`);

      } catch (error) {
        console.error(`❌ ${site} error:`, error.message);
        results[site] = {
          status: 'error',
          message: error.message
        };
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database test failed',
      details: error.message
    });
  }
});

// Create test users
app.post('/api/create-test-users', async (req, res) => {
  console.log('=== CREATING TEST USERS ===');
  try {
    const sites = ['hanoi', 'danang', 'saigon'];
    const results = {};
    
    // Create different test users
    const testUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'testuser', password: 'test123', role: 'user' },
      { username: 'manager', password: 'manager123', role: 'manager' }
    ];

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        results[site] = { users: [], errors: [] };

        // Check table structure to determine correct column name
        const [tableInfo] = await pool.execute('DESCRIBE users');
        const hasActiveColumn = tableInfo.some(col => col.Field === 'active');
        const activeColumn = hasActiveColumn ? 'active' : 'is_active';

        console.log(`${site} - Using column: ${activeColumn}`);

        for (const userData of testUsers) {
          try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Delete existing user first
            await pool.execute('DELETE FROM users WHERE username = ?', [userData.username]);
            
            // Create new user with correct column name
            const [result] = await pool.execute(
              `INSERT INTO users (username, password, role, region, ${activeColumn}, created_at, updated_at) 
               VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
              [userData.username, hashedPassword, userData.role, site]
            );

            results[site].users.push({
              username: userData.username,
              role: userData.role,
              id: result.insertId
            });

            console.log(`✅ Created ${userData.username} in ${site}`);

          } catch (userError) {
            console.error(`❌ Failed to create ${userData.username} in ${site}:`, userError.message);
            results[site].errors.push({
              username: userData.username,
              error: userError.message
            });
          }
        }

      } catch (siteError) {
        console.error(`❌ Site ${site} error:`, siteError.message);
        results[site] = {
          status: 'error',
          message: siteError.message
        };
      }
    }

    res.json({
      success: true,
      message: 'Test users creation completed',
      testCredentials: testUsers.map(u => ({
        username: u.username,
        password: u.password,
        role: u.role
      })),
      results
    });

  } catch (error) {
    console.error('Create test users failed:', error);
    res.status(500).json({
      error: 'Failed to create test users',
      details: error.message
    });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====
app.post('/api/auth/login', async (req, res) => {
  console.log('=== LOGIN REQUEST STARTED ===');
  
  try {
    const { username, password } = req.body;
    
    console.log('Request details:', {
      hasUsername: !!username,
      hasPassword: !!password,
      username: username,
      contentType: req.headers['content-type']
    });

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        error: 'Username and password are required',
        received: {
          username: !!username,
          password: !!password
        }
      });
    }

    console.log(`🔍 Attempting login for: ${username}`);

    const sites = ['hanoi', 'danang', 'saigon'];
    let loginAttempts = [];
    let connectionErrors = [];

    for (const site of sites) {
      console.log(`\n--- Checking site: ${site} ---`);
      
      try {
        const pool = await getConnection(site);
        console.log(`✅ Connected to ${site} database`);

        // Check table structure to determine correct column name (or fallback)
        const [tableInfo] = await pool.execute('DESCRIBE users');
        const hasActive = tableInfo.some(col => col.Field === 'active');
        const hasIsActive = tableInfo.some(col => col.Field === 'is_active');
        let users;
        if (hasActive) {
          console.log(`${site} - Using column: active`);
          const [rows] = await pool.execute(
            'SELECT id, username, password, role, region, active FROM users WHERE username = ?',
            [username]
          );
          users = rows;
        } else if (hasIsActive) {
          console.log(`${site} - Using column: is_active`);
          const [rows] = await pool.execute(
            'SELECT id, username, password, role, region, is_active as active FROM users WHERE username = ?',
            [username]
          );
          users = rows;
        } else {
          console.log(`${site} - No active flag column found. Defaulting active=1`);
          const [rows] = await pool.execute(
            'SELECT id, username, password, role, region FROM users WHERE username = ?',
            [username]
          );
          users = rows.map(u => ({ ...u, active: 1 }));
        }

        console.log(`Found ${users.length} users with username "${username}" in ${site}`);

        if (users.length > 0) {
          const user = users[0];
          
          console.log(`User details in ${site}:`, {
            id: user.id,
            username: user.username,
            role: user.role,
            region: user.region,
            active: user.active
          });

          loginAttempts.push({
            site,
            userFound: true,
            userActive: user.active === 1,
            userId: user.id
          });

          // Check if user is active
          if (user.active !== 1) {
            console.log(`⚠️ User is inactive in ${site}`);
            continue;
          }

          // Verify password
          console.log(`🔐 Verifying password for ${username} in ${site}...`);
          
          const isValidPassword = await bcrypt.compare(password, user.password);
          console.log(`Password verification result: ${isValidPassword}`);

          if (isValidPassword) {
            // Create JWT token
            const tokenPayload = {
              id: user.id,
              username: user.username,
              role: user.role,
              region: user.region || site
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

            console.log(`✅ LOGIN SUCCESSFUL for ${username} from ${site}`);
            console.log('=== LOGIN REQUEST COMPLETED ===\n');

            return res.json({
              success: true,
              message: 'Login successful',
              user: {
                id: user.id,
                username: user.username,
                role: user.role,
                region: user.region || site
              },
              token
            });
          } else {
            console.log(`❌ Invalid password for ${username} in ${site}`);
          }
        } else {
          console.log(`👤 No user found with username "${username}" in ${site}`);
          loginAttempts.push({
            site,
            userFound: false
          });
        }

      } catch (dbError) {
        console.error(`💥 Database error for ${site}:`, dbError.message);
        connectionErrors.push({
          site,
          error: dbError.message
        });
      }
    }

    // Login failed
    console.log('❌ LOGIN FAILED');
    console.log('Login attempts summary:', loginAttempts);
    console.log('Connection errors:', connectionErrors);
    console.log('=== LOGIN REQUEST COMPLETED ===\n');

    // Check if all connections failed
    if (connectionErrors.length === sites.length) {
      return res.status(500).json({
        error: 'Database connection failed',
        details: connectionErrors
      });
    }

    // Invalid credentials
    return res.status(401).json({
      error: 'Invalid username or password',
      debug: process.env.NODE_ENV === 'development' ? {
        loginAttempts,
        connectionErrors
      } : undefined
    });

  } catch (error) {
    console.error('💥 FATAL LOGIN ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== LOGIN REQUEST COMPLETED WITH ERROR ===\n');
    
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// ===== FLIGHT ENDPOINTS =====
app.get('/api/flights', async (req, res) => {
  try {
    const { departure, arrival, date, region } = req.query;
    const sites = region && region !== 'all' ? [region] : ['hanoi', 'danang', 'saigon'];
    let allFlights = [];

    console.log(`Fetching flights from sites: ${sites.join(', ')}`);

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        let query = 'SELECT * FROM flights WHERE status = "available"';
        const params = [];

        if (departure) {
          query += ' AND departure_airport = ?';
          params.push(departure);
        }
        if (arrival) {
          query += ' AND arrival_airport = ?';
          params.push(arrival);
        }
        if (date) {
          query += ' AND flight_date = ?';
          params.push(date);
        }

        query += ' ORDER BY flight_date, departure_time';

        const [flights] = await pool.execute(query, params);
        
        const processedFlights = flights.map(flight => ({
          ...flight,
          site,
          price_formatted: formatCurrency(flight.price)
        }));

        allFlights = allFlights.concat(processedFlights);
        console.log(`Found ${flights.length} flights in ${site}`);

      } catch (error) {
        console.error(`Error fetching flights from ${site}:`, error.message);
      }
    }

    res.json({
      success: true,
      flights: allFlights,
      total: allFlights.length
    });

  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({
      error: 'Failed to fetch flights',
      details: error.message
    });
  }
});

app.get('/api/flights/:site/:id', async (req, res) => {
  try {
    const { site, id } = req.params;
    
    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }

    const pool = await getConnection(site);
    const [flights] = await pool.execute('SELECT * FROM flights WHERE id = ?', [id]);

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const flight = {
      ...flights[0],
      site,
      price_formatted: formatCurrency(flights[0].price)
    };

    res.json({
      success: true,
      flight
    });

  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({
      error: 'Failed to fetch flight',
      details: error.message
    });
  }
});

// ===== BOOKING ENDPOINTS =====
app.post('/api/bookings', async (req, res) => {
  try {
    const { flightId, site, customerName, customerEmail, customerPhone, seatNumber } = req.body;

    // Validate required fields
    if (!flightId || !site || !customerName || !customerEmail) {
      return res.status(400).json({
        error: 'Flight ID, site, customer name, and email are required'
      });
    }

    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }

    const pool = await getConnection(site);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check flight availability
      const [flights] = await connection.execute(
        'SELECT * FROM flights WHERE id = ? AND available_seats > 0 FOR UPDATE',
        [flightId]
      );

      if (flights.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          error: 'Flight not found or no available seats'
        });
      }

      const flight = flights[0];

      // Handle customer
      let customerId;
      const [existingCustomers] = await connection.execute(
        'SELECT id FROM customers WHERE email = ?',
        [customerEmail]
      );

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        await connection.execute(
          'UPDATE customers SET name = ?, phone = ? WHERE id = ?',
          [customerName, customerPhone, customerId]
        );
      } else {
        const [customerResult] = await connection.execute(
          'INSERT INTO customers (name, email, phone, region) VALUES (?, ?, ?, ?)',
          [customerName, customerEmail, customerPhone, site]
        );
        customerId = customerResult.insertId;
      }

      // Create booking
      const bookingCode = `${site.toUpperCase()}${Date.now()}`;
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings 
         (booking_code, flight_id, customer_id, customer_name, customer_email, customer_phone, 
          seat_number, total_amount, final_amount, status, payment_status, region) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
        [bookingCode, flightId, customerId, customerName, customerEmail, customerPhone, 
         seatNumber, flight.price, flight.price, site]
      );

      // Update flight availability
      await connection.execute(
        'UPDATE flights SET available_seats = available_seats - 1 WHERE id = ?',
        [flightId]
      );

      await connection.commit();
      connection.release();

      console.log(`✅ Booking created: ${bookingCode} for flight ${flight.flight_code}`);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: {
          id: bookingResult.insertId,
          bookingCode,
          flightCode: flight.flight_code,
          customerName,
          totalAmount: flight.price,
          totalAmountFormatted: formatCurrency(flight.price),
          status: 'confirmed',
          seatNumber,
          flightDate: flight.flight_date,
          departureTime: flight.departure_time,
          departureCity: flight.departure_city,
          arrivalCity: flight.arrival_city
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      details: error.message
    });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { region, email, bookingCode } = req.query;
    const sites = region && region !== 'all' ? [region] : ['hanoi', 'danang', 'saigon'];
    let allBookings = [];

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        let query = `
          SELECT b.*, f.flight_code, f.airline, f.departure_city, f.arrival_city, 
                 f.flight_date, f.departure_time, f.arrival_time 
          FROM bookings b 
          JOIN flights f ON b.flight_id = f.id 
          WHERE 1=1
        `;
        const params = [];

        if (email) {
          query += ' AND b.customer_email = ?';
          params.push(email);
        }
        if (bookingCode) {
          query += ' AND b.booking_code = ?';
          params.push(bookingCode);
        }

        query += ' ORDER BY b.created_at DESC';

        const [bookings] = await pool.execute(query, params);
        
        const processedBookings = bookings.map(booking => ({
          ...booking,
          site,
          total_amount_formatted: formatCurrency(booking.total_amount)
        }));

        allBookings = allBookings.concat(processedBookings);

      } catch (error) {
        console.error(`Error fetching bookings from ${site}:`, error.message);
      }
    }

    res.json({
      success: true,
      bookings: allBookings,
      total: allBookings.length
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

app.put('/api/bookings/:site/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { site, id } = req.params;

    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }

    const pool = await getConnection(site);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [bookings] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [id]
      );

      if (bookings.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookings[0];

      if (booking.status === 'cancelled') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Booking already cancelled' });
      }

      // Cancel booking
      await connection.execute(
        'UPDATE bookings SET status = "cancelled", payment_status = "refunded" WHERE id = ?',
        [id]
      );

      // Restore flight seat
      await connection.execute(
        'UPDATE flights SET available_seats = available_seats + 1 WHERE id = ?',
        [booking.flight_id]
      );

      await connection.commit();
      connection.release();

      console.log(`✅ Booking cancelled: ${booking.booking_code}`);

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      details: error.message
    });
  }
});

// ===== STATISTICS ENDPOINT =====
app.get('/api/statistics', async (req, res) => {
  try {
    const sites = ['hanoi', 'danang', 'saigon'];
    const stats = {
      totalFlights: 0,
      totalBookings: 0,
      totalRevenue: 0,
      availableFlights: 0,
      siteStats: {}
    };

    for (const site of sites) {
      try {
        const pool = await getConnection(site);

        const [flightStats] = await pool.execute(`
          SELECT COUNT(*) as total_flights, 
                 SUM(CASE WHEN status = 'available' AND available_seats > 0 THEN 1 ELSE 0 END) as available_flights 
          FROM flights
        `);

        const [bookingStats] = await pool.execute(`
          SELECT COUNT(*) as total_bookings, 
                 COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as revenue 
          FROM bookings
        `);

        const siteFlights = flightStats[0].total_flights;
        const siteAvailable = flightStats[0].available_flights;
        const siteBookings = bookingStats[0].total_bookings;
        const siteRevenue = parseFloat(bookingStats[0].revenue);

        stats.totalFlights += siteFlights;
        stats.availableFlights += siteAvailable;
        stats.totalBookings += siteBookings;
        stats.totalRevenue += siteRevenue;

        stats.siteStats[site] = {
          flights: siteFlights,
          availableFlights: siteAvailable,
          bookings: siteBookings,
          revenue: siteRevenue,
          revenueFormatted: formatCurrency(siteRevenue)
        };

      } catch (error) {
        console.error(`Error getting stats from ${site}:`, error.message);
        stats.siteStats[site] = {
          flights: 0,
          availableFlights: 0,
          bookings: 0,
          revenue: 0,
          revenueFormatted: formatCurrency(0)
        };
      }
    }

    stats.totalRevenueFormatted = formatCurrency(stats.totalRevenue);

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

// ===== AIRPORTS ENDPOINT =====
app.get('/api/airports', (req, res) => {
  const airports = [
    { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội' },
    { code: 'SGN', name: 'Tân Sơn Nhất', city: 'TP.HCM' },
    { code: 'DAD', name: 'Đà Nẵng', city: 'Đà Nẵng' },
    { code: 'CXR', name: 'Cam Ranh', city: 'Nha Trang' },
    { code: 'PQC', name: 'Phú Quốc', city: 'Phú Quốc' },
    { code: 'HPH', name: 'Cát Bi', city: 'Hải Phòng' },
    { code: 'HUI', name: 'Phú Bài', city: 'Huế' },
    { code: 'UIH', name: 'Phù Cát', city: 'Quy Nhon' },
    { code: 'VCA', name: 'Cần Thơ', city: 'Cần Thơ' },
    { code: 'DLI', name: 'Liên Khương', city: 'Đà Lạt' }
  ];

  res.json({
    success: true,
    airports
  });
});

// ===== ERROR HANDLERS =====
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// ===== ADMIN PASSWORD SYNC FUNCTION =====
async function syncAdminPasswords() {
  console.log('\n🔄 Starting admin password synchronization...');
  
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const sites = ['hanoi', 'danang', 'saigon'];
    
    const adminUsers = [
      { username: 'admin', role: 'admin' },
      { username: 'admin_hanoi', role: 'admin' },
      { username: 'admin_danang', role: 'admin' },
      { username: 'admin_saigon', role: 'admin' }
    ];

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        
        // Check table structure to determine correct column name
        const [tableInfo] = await pool.execute('DESCRIBE users');
        const hasActiveColumn = tableInfo.some(col => col.Field === 'active');
        const activeColumn = hasActiveColumn ? 'active' : 'is_active';
        
        console.log(`${site} - Using column: ${activeColumn}`);
        
        for (const adminUser of adminUsers) {
          try {
            // Check if user exists
            const [existing] = await pool.execute(
              'SELECT id FROM users WHERE username = ?',
              [adminUser.username]
            );

            if (existing.length > 0) {
              // Update existing user with correct column name
              await pool.execute(
                `UPDATE users SET password = ?, ${activeColumn} = 1, role = ? WHERE username = ?`,
                [adminHash, adminUser.role, adminUser.username]
              );
              console.log(`✅ Updated ${adminUser.username} in ${site}`);
            } else {
              // Create new user with correct column name
        await pool.execute(
                `INSERT INTO users (username, password, role, region, ${activeColumn}, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
                [adminUser.username, adminHash, adminUser.role, site]
              );
              console.log(`✅ Created ${adminUser.username} in ${site}`);
            }
          } catch (userError) {
            console.error(`❌ Error with ${adminUser.username} in ${site}:`, userError.message);
          }
        }

      } catch (siteError) {
        console.error(`❌ Site ${site} error:`, siteError.message);
      }
    }

    console.log('🔑 Admin password synchronization completed');
    console.log('📝 Default credentials: admin / admin123\n');

  } catch (error) {
    console.error('💥 Admin password sync failed:', error.message);
  }
}

// ===== STARTUP MIGRATION: Ensure users table has required columns =====
async function ensureUsersSchema() {
  try {
    console.log('\n🛠  Checking users table schema...');
    const sites = ['hanoi', 'danang', 'saigon'];
    const requiredAlters = [
      "ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER password",
      "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER username",
      "ALTER TABLE users ADD COLUMN region VARCHAR(20) NULL AFTER role",
      "ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER region",
      "ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
    ];

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        for (const sql of requiredAlters) {
          try {
            await pool.execute(sql);
            console.log(`✅ ${site}: ${sql.split(' ADD COLUMN ')[1].split(' ')[0]} added`);
      } catch (e) {
            // If column exists, MySQL throws ER_DUP_FIELDNAME; ignore gracefully
            if (e && e.code === 'ER_DUP_FIELDNAME') {
              console.log(`ℹ️  ${site}: column already exists, skip`);
            } else if (e && /Duplicate column name|exists/i.test(e.message)) {
              console.log(`ℹ️  ${site}: column already exists, skip`);
            } else {
              console.warn(`⚠️  ${site}: alter skipped - ${e.message}`);
            }
          }
        }
      } catch (siteError) {
        console.error(`❌ Schema check failed on ${site}:`, siteError.message);
      }
    }
    console.log('🧩 Users schema check completed');
  } catch (e) {
    console.error('❌ Users schema migration failed:', e.message);
  }
}

// ===== SERVER STARTUP =====
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 FLIGHT MANAGEMENT BACKEND STARTED');
  console.log('='.repeat(70));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`👤 Create test users: POST http://localhost:${PORT}/api/create-test-users`);
  console.log(`🔐 Login endpoint: POST http://localhost:${PORT}/api/auth/login`);
  console.log('='.repeat(70));

  // Test database connections
  testConnections().then(results => {
    console.log('📊 Database Connection Status:');
    Object.entries(results).forEach(([site, result]) => {
      const status = result.status === 'connected' ? '✅' : '❌';
      console.log(`   ${status} ${site.toUpperCase()}: ${result.status}`);
      if (result.status === 'error') {
        console.log(`      Error: ${result.message}`);
      }
    });
    console.log('='.repeat(70));

    // Ensure users table schema is compatible, then sync admin passwords
    ensureUsersSchema().then(() => {
syncAdminPasswords();
    });
  });
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});