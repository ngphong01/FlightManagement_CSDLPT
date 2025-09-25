// ===== FLIGHT MANAGEMENT BACKEND - COMPLETE FIXED VERSION =====
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, testConnections } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'flight_management_secret_key_2025';
const JWT_REFRESH_SECRET = 'flight_management_refresh_secret_2025';
const STAFF_JWT_SECRET = 'staff_secret_key';

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

const formatDateDMY = (dateStr) => {
  if (!dateStr) return dateStr;
  // Expecting 'YYYY-MM-DD'
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

const toIsoDateParam = (input) => {
  if (!input) return input;
  // Accept YYYY-MM-DD as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // Accept dd/mm/yyyy
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return input;
};

const formatDateTimeVN = (dt) => {
  if (!dt) return dt;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
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

// ===== SCHEMA DIAGNOSTICS =====
app.get('/api/diagnostics/schema', async (req, res) => {
  try {
    const sites = ['hanoi', 'danang', 'saigon'];
    const required = {
      flights: ['id','flight_code','airline','departure_airport','arrival_airport','departure_city','arrival_city','flight_date','departure_time','arrival_time','price','total_seats','available_seats','status','region','created_at','updated_at'],
      bookings: ['id','booking_code','flight_id','customer_id','customer_name','customer_email','customer_phone','seat_number','total_amount','final_amount','status','payment_status','region','created_at','updated_at'],
      customers: ['id','name','email','phone','region','created_at','updated_at']
    };
    const results = {};

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        const schemaCheck = {};
        for (const table of Object.keys(required)) {
          try {
            const [desc] = await pool.execute('DESCRIBE ' + table);
            const cols = (desc || []).map((c) => c.Field);
            const missing = required[table].filter((c) => !cols.includes(c));
            schemaCheck[table] = { present: cols, missing };
          } catch (e) {
            schemaCheck[table] = { error: e && e.message ? e.message : String(e) };
          }
        }
        results[site] = { status: 'ok', schema: schemaCheck };
      } catch (e) {
        results[site] = { status: 'error', message: e && e.message ? e.message : String(e) };
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error && error.message ? error.message : String(error) });
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

            const expiresIn = (user.role === 'admin') ? '15m' : (user.role === 'staff' ? '1h' : '7d');
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });
            const refreshExpiresIn = (user.role === 'admin') ? '2h' : (user.role === 'staff' ? '8h' : '30d');
            const refreshToken = jwt.sign({ ...tokenPayload, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: refreshExpiresIn });

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
              token,
              refreshToken
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

// Refresh token endpoint (role-based)
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : '').trim();
    if (!token) return res.status(400).json({ error: 'Missing refresh token' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    if (decoded.type !== 'refresh') return res.status(400).json({ error: 'Not a refresh token' });
    const role = decoded.role || 'customer';
    const accessExp = role === 'admin' ? '15m' : role === 'staff' ? '1h' : '7d';
    const payload = { id: decoded.id, username: decoded.username, role, region: decoded.region };
    const newAccess = jwt.sign(payload, JWT_SECRET, { expiresIn: accessExp });
    res.json({ success: true, token: newAccess });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ===== STAFF/ADMIN AUTH (employee) =====
app.post('/api/staff/auth/login', async (req, res) => {
  try {
    const { employeeCode, password } = req.body || {};
    if (!employeeCode || !password) return res.status(400).json({ error: 'employeeCode and password are required' });
    // Pick a shard to read staff from (assuming centralization on hanoi for now)
    const pool = await getConnection('hanoi');
    // If staff table not exists, fail gracefully
    try {
      await pool.execute('SELECT 1 FROM staff LIMIT 1');
    } catch {
      return res.status(501).json({ error: 'Staff table not available' });
    }
    const [rows] = await pool.execute('SELECT * FROM staff WHERE employee_code = ? AND is_active = 1', [employeeCode]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const emp = rows[0];
    const ok = await bcrypt.compare(password, emp.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const payload = { id: emp.id, username: emp.employee_code, role: emp.role, region: 'hanoi' };
    const accessExp = emp.role === 'admin' ? '15m' : '1h';
    const refreshExp = emp.role === 'admin' ? '2h' : '8h';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: accessExp });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: refreshExp });
    // log activity
    await pool.execute('INSERT INTO staff_activity_logs (staff_id, action_type, target_resource, ip_address, user_agent) VALUES (?,?,?,?,?)', [emp.id, 'login', 'staff_console', (req.ip||'').toString(), req.headers['user-agent']||'']);
    res.json({ success: true, user: { id: emp.id, username: emp.employee_code, role: emp.role, region: 'hanoi' }, token, refreshToken });
  } catch (e) {
    res.status(500).json({ error: 'Staff login failed', details: e.message });
  }
});

app.post('/api/staff/auth/refresh', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : '').trim();
    if (!token) return res.status(400).json({ error: 'Missing refresh token' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    if (decoded.type !== 'refresh') return res.status(400).json({ error: 'Not a refresh token' });
    const role = decoded.role === 'admin' ? 'admin' : 'staff';
    const exp = role === 'admin' ? '15m' : '1h';
    const access = jwt.sign({ id: decoded.id, username: decoded.username, role, region: decoded.region }, JWT_SECRET, { expiresIn: exp });
    res.json({ success: true, token: access });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh staff token' });
  }
});

// Staff token verification endpoint
app.get('/api/staff/auth/verify', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : '').trim();
    if (!token) return res.status(400).json({ error: 'Missing token' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Verify staff still exists and is active
    const pool = await getConnection('hanoi');
    const [rows] = await pool.execute('SELECT id, employee_code, role, is_active FROM staff WHERE id = ?', [decoded.id]);
    
    if (!rows || rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Staff not found or inactive' });
    }
    
    res.json({ 
      success: true, 
      user: { 
        id: decoded.id, 
        username: decoded.username, 
        role: decoded.role, 
        region: decoded.region 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// ===== FLIGHT ENDPOINTS =====
app.get('/api/flights', async (req, res) => {
  try {
    let { departure, arrival, date, region, status } = req.query;
    // Default to today's date (YYYY-MM-DD) if route search lacks date
    if (!date && departure && arrival) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      date = `${yyyy}-${mm}-${dd}`;
    }
    date = toIsoDateParam(date);
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
        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }

        query += ' ORDER BY flight_date, departure_time';

        const [flights] = await pool.execute(query, params);
        
        const processedFlights = flights.map(flight => ({
          ...flight,
          site,
          price_formatted: formatCurrency(flight.price),
          flight_date_formatted: formatDateDMY(flight.flight_date),
          created_at_formatted: formatDateTimeVN(flight.created_at),
          updated_at_formatted: formatDateTimeVN(flight.updated_at)
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
      price_formatted: formatCurrency(flights[0].price),
      flight_date_formatted: formatDateDMY(flights[0].flight_date),
      created_at_formatted: formatDateTimeVN(flights[0].created_at),
      updated_at_formatted: formatDateTimeVN(flights[0].updated_at)
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

// Fetch flight by id across all sites (no site required)
app.get('/api/flights/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sites = ['hanoi', 'danang', 'saigon'];
    let found = null;
    let foundSite = null;

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ? LIMIT 1', [id]);
        if (rows.length) {
          found = rows[0];
          foundSite = site;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const flight = {
      ...found,
      site: foundSite,
      price_formatted: formatCurrency(found.price),
      flight_date_formatted: formatDateDMY(found.flight_date),
      created_at_formatted: formatDateTimeVN(found.created_at),
      updated_at_formatted: formatDateTimeVN(found.updated_at)
    };

    res.json({ success: true, flight });
  } catch (error) {
    console.error('Get flight by id (no site) error:', error);
    res.status(500).json({ error: 'Failed to fetch flight', details: error.message });
  }
});

// ===== BOOKING ENDPOINTS =====
app.post('/api/bookings', async (req, res) => {
  try {
    const { flightId, site, customerName, customerEmail, customerPhone, seatNumber, nationalId } = req.body || {};

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
          'UPDATE customers SET name = ?, phone = ?, national_id = ? WHERE id = ?',
          [customerName, customerPhone ?? null, nationalId ?? null, customerId]
        );
      } else {
        const [customerResult] = await connection.execute(
          'INSERT INTO customers (name, email, phone, national_id, region) VALUES (?, ?, ?, ?, ?)',
          [customerName, customerEmail, customerPhone ?? null, nationalId ?? null, site]
        );
        customerId = customerResult.insertId;
      }

      // Create booking
      const bookingCode = `${site.toUpperCase()}${Date.now()}`;
      const phone = customerPhone ?? null;
      const seat = seatNumber ?? null;
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings 
         (booking_code, flight_id, customer_id, customer_name, customer_email, customer_phone, 
          seat_number, total_amount, final_amount, status, payment_status, region) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
        [bookingCode, flightId, customerId, customerName, customerEmail, phone, 
         seat, flight.price ?? 0, flight.price ?? 0, site]
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
                 f.flight_date, f.departure_time, f.arrival_time,
                 c.national_id AS customer_national_id
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          LEFT JOIN customers c ON b.customer_id = c.id
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

// ===== BOOKING LOOKUP (PNR + LastName) =====
app.get('/api/bookings/lookup', async (req, res) => {
  try {
    const { pnr, lastName } = req.query;
    if (!pnr) {
      return res.status(400).json({ error: 'pnr is required' });
    }

    const sites = ['hanoi', 'danang', 'saigon'];
    let found = null;
    let foundSite = null;

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        const [rows] = await pool.execute(`
          SELECT b.*, f.flight_code, f.airline, f.departure_city, f.arrival_city,
                 f.flight_date, f.departure_time, f.arrival_time,
                 c.national_id as customer_national_id
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          LEFT JOIN customers c ON b.customer_id = c.id
          WHERE b.booking_code = ?
          LIMIT 1
        `, [pnr]);
        if (rows.length) {
          found = rows[0];
          foundSite = site;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (lastName) {
      const name = (found.customer_name || '').trim();
      const guessedLast = name.split(' ').filter(Boolean).pop() || '';
      if (guessedLast.localeCompare(String(lastName), undefined, { sensitivity: 'accent' }) !== 0) {
        return res.status(403).json({ error: 'Last name does not match' });
      }
    }

    res.json({ success: true, booking: { ...found, site: foundSite } });
  } catch (error) {
    console.error('Lookup booking error:', error);
    res.status(500).json({ error: 'Failed to lookup booking', details: error.message });
  }
});

// ===== CHECK-IN: START =====
app.post('/api/checkin/start', async (req, res) => {
  try {
    const { pnr, lastName } = req.body || {};
    if (!pnr) {
      return res.status(400).json({ error: 'pnr is required' });
    }

    const sites = ['hanoi', 'danang', 'saigon'];
    let ctx = null;

    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        const [rows] = await pool.execute(`
          SELECT b.*, f.flight_code, f.airline, f.departure_city, f.arrival_city,
                 f.flight_date, f.departure_time, f.arrival_time, f.total_seats, f.id as flight_id
          FROM bookings b
          JOIN flights f ON b.flight_id = f.id
          WHERE b.booking_code = ?
          LIMIT 1
        `, [pnr]);
        if (rows.length) {
          ctx = { site, booking: rows[0] };
          break;
        }
        // If not found in bookings, try guest_bookings and materialize into bookings
        const [guestRows] = await pool.execute(`
          SELECT gb.*, f.flight_code, f.airline, f.departure_city, f.arrival_city,
                 f.flight_date, f.departure_time, f.arrival_time, f.total_seats, f.id as flight_id
          FROM guest_bookings gb
          JOIN flights f ON gb.flight_id = f.id
          WHERE gb.booking_code = ?
          LIMIT 1
        `, [pnr]);
        if (guestRows.length) {
          const gb = guestRows[0];
          try {
            // Start a transaction to upsert into customers and bookings
            const conn = await pool.getConnection();
            try {
              await conn.beginTransaction();
              // Ensure customer
              let customerId;
              const [existing] = await conn.execute('SELECT id FROM customers WHERE email = ? LIMIT 1', [gb.customer_email]);
              if (existing.length) {
                customerId = existing[0].id;
                await conn.execute('UPDATE customers SET name = COALESCE(name, ?), phone = COALESCE(phone, ?), region = COALESCE(region, ?) WHERE id = ?', [gb.customer_name || null, gb.customer_phone || null, site, customerId]);
              } else {
                const passengerList = (() => { try { return JSON.parse(gb.passengers || '[]'); } catch { return []; } })();
                const primaryName = gb.customer_name || (passengerList[0]?.name) || 'Khách';
                const [cre] = await conn.execute('INSERT INTO customers (name, email, phone, region) VALUES (?, ?, ?, ?)', [primaryName, gb.customer_email, gb.customer_phone || null, site]);
                customerId = cre.insertId;
              }
              // Check if booking already materialized
              const [existingBooking] = await conn.execute('SELECT id FROM bookings WHERE booking_code = ? LIMIT 1', [pnr]);
              if (!existingBooking.length) {
                const totalAmount = Number(gb.total_amount) || 0;
                await conn.execute(
                  `INSERT INTO bookings 
                   (booking_code, flight_id, customer_id, customer_name, customer_email, customer_phone, 
                    seat_number, total_amount, final_amount, status, payment_status, region)
                   VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 'confirmed', 'paid', ?)`,
                  [pnr, gb.flight_id, customerId, gb.customer_name || null, gb.customer_email, gb.customer_phone || null, totalAmount, totalAmount, site]
                );
              }
              await conn.commit();
              conn.release();
            } catch (e) {
              await conn.rollback();
              conn.release();
              throw e;
            }
          } catch (materializeErr) {
            // If materialization fails, continue to next site
            console.error(`Materialize guest booking failed in ${site}:`, materializeErr.message);
          }
          // Re-query bookings after materialization
          const [matRows] = await pool.execute(`
            SELECT b.*, f.flight_code, f.airline, f.departure_city, f.arrival_city,
                   f.flight_date, f.departure_time, f.arrival_time, f.total_seats, f.id as flight_id
            FROM bookings b
            JOIN flights f ON b.flight_id = f.id
            WHERE b.booking_code = ?
            LIMIT 1
          `, [pnr]);
          if (matRows.length) {
            ctx = { site, booking: matRows[0] };
            break;
          }
        }
      } catch (e) {}
    }

    if (!ctx) return res.status(404).json({ error: 'Booking not found' });

    if (lastName) {
      const name = (ctx.booking.customer_name || '').trim();
      const guessedLast = name.split(' ').filter(Boolean).pop() || '';
      if (guessedLast.localeCompare(String(lastName), undefined, { sensitivity: 'accent' }) !== 0) {
        return res.status(403).json({ error: 'Last name does not match' });
      }
    }

    const pool = await getConnection(ctx.site);
    const [takenRows] = await pool.execute(
      'SELECT seat_number FROM bookings WHERE flight_id = ? AND status != "cancelled" AND seat_number IS NOT NULL',
      [ctx.booking.flight_id]
    );
    const takenSeats = takenRows.map(r => r.seat_number).filter(Boolean);

    res.json({
      success: true,
      site: ctx.site,
      booking: ctx.booking,
      seatMap: {
        totalSeats: ctx.booking.total_seats,
        takenSeats
      }
    });
  } catch (error) {
    console.error('Check-in start error:', error);
    res.status(500).json({ error: 'Failed to start check-in', details: error.message });
  }
});

// ===== CHECK-IN: ASSIGN SEAT =====
app.post('/api/checkin/assign-seat', async (req, res) => {
  try {
    const { site, bookingId, seatNumber } = req.body || {};
    if (!site || !bookingId || !seatNumber) {
      return res.status(400).json({ error: 'site, bookingId and seatNumber are required' });
    }
    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }

    const pool = await getConnection(site);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [bookings] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
      if (!bookings.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Booking not found' });
      }
      const booking = bookings[0];

      // Check seat availability on same flight
      const [conflicts] = await connection.execute(
        'SELECT id FROM bookings WHERE flight_id = ? AND status != "cancelled" AND seat_number = ? AND id != ?',
        [booking.flight_id, seatNumber, bookingId]
      );
      if (conflicts.length) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: 'Seat already taken' });
      }

      await connection.execute('UPDATE bookings SET seat_number = ? WHERE id = ?', [seatNumber, bookingId]);
      await connection.commit();
      connection.release();

      res.json({ success: true });
    } catch (e) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (error) {
    console.error('Assign seat error:', error);
    res.status(500).json({ error: 'Failed to assign seat', details: error.message });
  }
});

// ===== CHECK-IN: COMPLETE =====
app.post('/api/checkin/complete', async (req, res) => {
  try {
    const { site, bookingId } = req.body || {};
    if (!site || !bookingId) {
      return res.status(400).json({ error: 'site and bookingId are required' });
    }
    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }

    const pool = await getConnection(site);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
      if (!rows.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Booking not found' });
      }
      const booking = rows[0];

      if (!booking.seat_number) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Seat not assigned' });
      }

      await connection.execute('UPDATE bookings SET check_in_status = "checked_in" WHERE id = ?', [bookingId]);
      await connection.commit();
      connection.release();

      const boardingPass = {
        barcode: booking.booking_code,
        bookingCode: booking.booking_code,
        seat: booking.seat_number
      };
      res.json({ success: true, boardingPass });
    } catch (e) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (error) {
    console.error('Check-in complete error:', error);
    res.status(500).json({ error: 'Failed to complete check-in', details: error.message });
  }
});

// ===== BOARDING PASS (simple JSON) =====
app.get('/api/boarding-pass/:site/:bookingId', async (req, res) => {
  try {
    const { site, bookingId } = req.params;
    if (!['hanoi', 'danang', 'saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }
    const pool = await getConnection(site);
    const [rows] = await pool.execute(`
      SELECT b.*, f.flight_code, f.airline, f.departure_city, f.arrival_city,
             f.flight_date, f.departure_time, f.arrival_time
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      WHERE b.id = ?
    `, [bookingId]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const b = rows[0];
    res.json({
      success: true,
      boardingPass: {
        bookingCode: b.booking_code,
        name: b.customer_name,
        seat: b.seat_number,
        flight: b.flight_code,
        route: `${b.departure_city} → ${b.arrival_city}`,
        time: `${b.flight_date} ${b.departure_time}`,
        barcode: b.booking_code
      }
    });
  } catch (error) {
    console.error('Boarding pass error:', error);
    res.status(500).json({ error: 'Failed to get boarding pass', details: error.message });
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

// ===== GATE: BOARD PASS (mark as boarded) =====
app.post('/api/gate/board', async (req, res) => {
  try {
    const { site, bookingId } = req.body || {};
    if (!site || !bookingId) return res.status(400).json({ error: 'site and bookingId are required' });
    if (!['hanoi', 'danang', 'saigon'].includes(site)) return res.status(400).json({ error: 'Invalid site' });

    const pool = await getConnection(site);
    const [rows] = await pool.execute('SELECT id, check_in_status FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
    await pool.execute('UPDATE bookings SET check_in_status = "boarding" WHERE id = ?', [bookingId]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Gate board error:', error);
    res.status(500).json({ error: 'Failed to board', details: error.message });
  }
});

// ===== GATE: FINAL MANIFEST =====
app.get('/api/gate/manifest', async (req, res) => {
  try {
    const { site, flightId } = req.query;
    if (!site || !flightId) return res.status(400).json({ error: 'site and flightId are required' });
    if (!['hanoi', 'danang', 'saigon'].includes(site)) return res.status(400).json({ error: 'Invalid site' });

    const pool = await getConnection(site);
    const [flightRows] = await pool.execute('SELECT * FROM flights WHERE id = ?', [flightId]);
    if (!flightRows.length) return res.status(404).json({ error: 'Flight not found' });
    const flight = flightRows[0];

    const [passengers] = await pool.execute(`
      SELECT id, booking_code, customer_name, seat_number, check_in_status
      FROM bookings
      WHERE flight_id = ?
      ORDER BY customer_name
    `, [flightId]);

    const stats = {
      total: passengers.length,
      checked_in: passengers.filter((p) => p.check_in_status === 'checked_in' || p.check_in_status === 'boarding').length,
      boarded: passengers.filter((p) => p.check_in_status === 'boarding').length
    };

    res.json({ success: true, flight, passengers, stats });
  } catch (error) {
    console.error('Gate manifest error:', error);
    res.status(500).json({ error: 'Failed to get manifest', details: error.message });
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

// Diagnostics: check guest_bookings table existence across shards
app.get('/api/diagnostics/guest-table', async (req, res) => {
  try {
    const sites = ['hanoi', 'danang', 'saigon'];
    const results = {};
    for (const site of sites) {
      try {
        const pool = await getConnection(site);
        const [rows] = await pool.execute("SHOW TABLES LIKE 'guest_bookings'");
        if (rows && rows.length > 0) {
          // Check columns quickly
          const [desc] = await pool.execute('DESCRIBE guest_bookings');
          results[site] = {
            present: true,
            columns: desc.map(c => c.Field)
          };
        } else {
          results[site] = { present: false };
        }
      } catch (e) {
        results[site] = { error: e && e.message ? e.message : String(e) };
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error && error.message ? error.message : String(error) });
  }
});

// ===== GUEST BOOKINGS =====
function generatePNR(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Create guest booking (no auth)
app.post('/api/guest/bookings', async (req, res) => {
  try {
    const { site, flightId, passengers, contactEmail, contactPhone } = req.body || {};
    if (!site || !['hanoi','danang','saigon'].includes(site)) {
      return res.status(400).json({ error: 'Invalid site' });
    }
    if (!flightId || !Array.isArray(passengers) || passengers.length === 0 || !contactEmail) {
      return res.status(400).json({ error: 'flightId, passengers[], contactEmail are required' });
    }

    const pool = await getConnection(site);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute('SELECT * FROM flights WHERE id = ? FOR UPDATE', [flightId]);
      if (!rows.length) {
        await connection.rollback(); connection.release();
        return res.status(404).json({ error: 'Flight not found' });
      }
      const flight = rows[0];

      if (Number(flight.available_seats) < passengers.length) {
        await connection.rollback(); connection.release();
        return res.status(400).json({ error: 'Không đủ chỗ trống' });
      }

      const pnr = generatePNR();
      const amount = Number(flight.price) * passengers.length;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Ensure table exists
      try { await connection.execute('SELECT 1 FROM guest_bookings LIMIT 1'); } catch {}

      await connection.execute(
        `INSERT INTO guest_bookings 
         (booking_code, customer_email, customer_phone, passengers, flight_id, departure_date, status, total_amount, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
        [pnr, contactEmail, contactPhone ?? null, JSON.stringify(passengers), flightId, flight.flight_date, amount, expiresAt]
      );

      // Ensure customer record exists for staff systems and PNR lookup
      let customerId = null;
      const [existing] = await connection.execute('SELECT id FROM customers WHERE email = ? LIMIT 1', [contactEmail]);
      if (existing.length) {
        customerId = existing[0].id;
        await connection.execute('UPDATE customers SET phone = ? WHERE id = ?', [contactPhone ?? null, customerId]);
      } else {
        const [custIns] = await connection.execute(
          'INSERT INTO customers (name, email, phone, region) VALUES (?, ?, ?, ?)',
          [passengers[0]?.name || contactEmail, contactEmail, contactPhone ?? null, site]
        );
        customerId = custIns.insertId;
      }

      // Mirror guest booking into bookings table so staff check-in/gate can see it
      await connection.execute(
        `INSERT INTO bookings 
         (booking_code, flight_id, customer_id, customer_name, customer_email, customer_phone, total_amount, final_amount, status, payment_status, region)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
        [pnr, flightId, customerId, passengers[0]?.name || contactEmail, contactEmail, contactPhone ?? null, amount, amount, site]
      );

      // Reserve seats by decreasing availability
      await connection.execute(
        'UPDATE flights SET available_seats = available_seats - ? WHERE id = ?',
        [passengers.length, flightId]
      );

      await connection.commit();
      connection.release();

      return res.status(201).json({ success: true, bookingCode: pnr, totalAmount: amount, totalAmountFormatted: formatCurrency(amount) });
    } catch (e) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (error) {
    console.error('Guest booking create error:', error);
    res.status(500).json({ error: 'Failed to create guest booking' });
  }
});

// Lookup guest booking by PNR + email (no auth)
app.get('/api/guest/bookings/lookup', async (req, res) => {
  try {
    const { bookingCode, email, site } = req.query;
    if (!bookingCode || !email) {
      return res.status(400).json({ error: 'bookingCode and email are required' });
    }
    const sites = site && ['hanoi','danang','saigon'].includes(String(site)) ? [String(site)] : ['hanoi','danang','saigon'];
    for (const s of sites) {
      try {
        const pool = await getConnection(s);
        const [rows] = await pool.execute(
          `SELECT gb.*, f.flight_code, f.departure_city, f.arrival_city, f.flight_date, f.departure_time
           FROM guest_bookings gb
           JOIN flights f ON gb.flight_id = f.id
           WHERE gb.booking_code = ? AND gb.customer_email = ?
           LIMIT 1`,
          [bookingCode, email]
        );
        if (rows.length) {
          const b = rows[0];
          return res.json({ success: true, booking: { ...b, site: s } });
        }
      } catch (e) {}
    }
    return res.status(404).json({ error: 'Không tìm thấy đặt chỗ' });
  } catch (error) {
    console.error('Guest booking lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup guest booking' });
  }
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

// ===== STAFF AUTHENTICATION MIDDLEWARE =====
const authenticateStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Try to verify with staff JWT secret first
    let decoded;
    try {
      decoded = jwt.verify(token, STAFF_JWT_SECRET);
    } catch (staffError) {
      // If staff token fails, try with regular JWT secret (for backward compatibility)
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (regularError) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    }

    // Get staff information from database
    const { site } = decoded;
    const pool = await getConnection(site);
    const [staff] = await pool.execute(
      'SELECT id, employee_code, email, full_name, department, position, role, is_active FROM staff WHERE id = ?',
      [decoded.id]
    );

    if (staff.length === 0) {
      return res.status(403).json({ error: 'Staff not found' });
    }

    if (!staff[0].is_active) {
      return res.status(403).json({ error: 'Staff account is inactive' });
    }

    // Add staff info to request
    req.staff = {
      id: staff[0].id,
      employee_code: staff[0].employee_code,
      email: staff[0].email,
      full_name: staff[0].full_name,
      department: staff[0].department,
      position: staff[0].position,
      role: staff[0].role,
      site: site
    };

    next();
  } catch (error) {
    console.error('Staff authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// ===== PERMISSION MIDDLEWARE =====
const { requirePermission, requireAnyPermission, requireAllPermissions } = require('./middleware/permissions');

// ===== ADMIN ROUTES WITH PERMISSIONS =====
// Staff management routes
app.get('/api/admin/staff', authenticateStaff, requirePermission('staff', 'read'), async (req, res) => {
  try {
    const { site } = req.staff;
    const pool = await getConnection(site);
    const [staff] = await pool.execute(`
      SELECT s.id, s.employee_code, s.email, s.full_name, s.department, s.position, s.role, s.is_active, s.created_at,
             sp.permission_code
      FROM staff s 
      LEFT JOIN staff_permissions sp ON s.id = sp.staff_id
      ORDER BY s.created_at DESC
    `);
    
    res.json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff data' });
  }
});

// Create new staff member
app.post('/api/admin/staff', authenticateStaff, requirePermission('staff', 'create'), async (req, res) => {
  try {
    const { site } = req.staff;
    const { employee_code, email, password, full_name, department, position, role, permission_code } = req.body;
    
    if (!employee_code || !email || !password || !full_name || !department || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = await getConnection(site);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert staff member
    const [result] = await pool.execute(
      'INSERT INTO staff (employee_code, email, password_hash, full_name, department, position, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [employee_code, email, hashedPassword, full_name, department, position, role || 'staff', 1]
    );
    
    // Assign permission if provided
    if (permission_code) {
      await pool.execute(
        'INSERT INTO staff_permissions (staff_id, permission_code) VALUES (?, ?)',
        [result.insertId, permission_code]
      );
    }
    
    res.json({
      success: true,
      message: 'Staff member created successfully',
      staff_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Employee code or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  }
});

// Update staff member
app.put('/api/admin/staff/:id', authenticateStaff, requirePermission('staff', 'update'), async (req, res) => {
  try {
    const { site } = req.staff;
    const { id } = req.params;
    const { employee_code, email, full_name, department, position, role, is_active, permission_code } = req.body;
    
    const pool = await getConnection(site);
    
    // Update staff member
    await pool.execute(
      'UPDATE staff SET employee_code = ?, email = ?, full_name = ?, department = ?, position = ?, role = ?, is_active = ? WHERE id = ?',
      [employee_code, email, full_name, department, position, role, is_active, id]
    );
    
    // Update permission if provided
    if (permission_code) {
      await pool.execute(
        'INSERT INTO staff_permissions (staff_id, permission_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE permission_code = ?',
        [id, permission_code, permission_code]
      );
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member
app.delete('/api/admin/staff/:id', authenticateStaff, requirePermission('staff', 'delete'), async (req, res) => {
  try {
    const { site } = req.staff;
    const { id } = req.params;
    
    const pool = await getConnection(site);
    
    // Delete staff member (cascade will delete permissions)
    await pool.execute('DELETE FROM staff WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// System settings (super admin only)
app.get('/api/admin/system/settings', authenticateStaff, requirePermission('system', 'settings'), async (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        system_name: 'BayNhanh Flight Management',
        version: '1.0.0',
        maintenance_mode: false,
        max_booking_amount: 10000000,
        auto_logout_minutes: 15
      }
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Reports (requires read permission)
app.get('/api/admin/reports', authenticateStaff, requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { site } = req.staff;
    const pool = await getConnection(site);
    
    // Get basic statistics
    const [staffCount] = await pool.execute('SELECT COUNT(*) as count FROM staff');
    const [activeStaffCount] = await pool.execute('SELECT COUNT(*) as count FROM staff WHERE is_active = 1');
    
    res.json({
      success: true,
      data: {
        total_staff: staffCount[0].count,
        active_staff: activeStaffCount[0].count,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// Export reports (requires export permission)
app.get('/api/admin/reports/export', authenticateStaff, requirePermission('reports', 'export'), async (req, res) => {
  try {
    const { site } = req.staff;
    const pool = await getConnection(site);
    
    const [staff] = await pool.execute(`
      SELECT s.employee_code, s.full_name, s.department, s.position, s.role, s.is_active,
             sp.permission_code, s.created_at
      FROM staff s 
      LEFT JOIN staff_permissions sp ON s.id = sp.staff_id
      ORDER BY s.created_at DESC
    `);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=staff_report.json');
    res.json({
      success: true,
      data: staff,
      exported_at: new Date().toISOString(),
      exported_by: req.staff.employee_code
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ error: 'Failed to export reports' });
  }
});

// ===== UTILITY ENDPOINT FOR PASSWORD HASHING =====
app.get('/api/generate-hash/:password', async (req, res) => {
  try {
    const { password } = req.params;
    const hash = await bcrypt.hash(password, 10);
    res.json({ 
      password: password,
      hash: hash,
      length: hash.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate hash' });
  }
});

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