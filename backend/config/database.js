// ===== DATABASE CONFIGURATION - CSDL PHÂN TÁN =====
const mysql = require('mysql2/promise');

module.exports = {
  // Site Hà Nội (Miền Bắc)
  hanoi: {
    host: process.env.DB_HANOI_HOST || 'localhost',
    port: process.env.DB_HANOI_PORT || 3306,
    user: process.env.DB_HANOI_USER || 'flight_app',
    password: process.env.DB_HANOI_PASSWORD || 'flight_password',
    database: process.env.DB_HANOI_NAME || 'flight_management_hanoi',
    charset: 'utf8mb4',
    timezone: '+07:00'
  },

  // Site Đà Nẵng (Miền Trung)
  danang: {
    host: process.env.DB_DANANG_HOST || 'localhost',
    port: process.env.DB_DANANG_PORT || 3306,
    user: process.env.DB_DANANG_USER || 'flight_app',
    password: process.env.DB_DANANG_PASSWORD || 'flight_password',
    database: process.env.DB_DANANG_NAME || 'flight_management_danang',
    charset: 'utf8mb4',
    timezone: '+07:00'
  },

  // Site TP.HCM (Miền Nam)
  saigon: {
    host: process.env.DB_SAIGON_HOST || 'localhost',
    port: process.env.DB_SAIGON_PORT || 3306,
    user: process.env.DB_SAIGON_USER || 'flight_app',
    password: process.env.DB_SAIGON_PASSWORD || 'flight_password',
    database: process.env.DB_SAIGON_NAME || 'flight_management_saigon',
    charset: 'utf8mb4',
    timezone: '+07:00'
  }
};

// ===== DATABASE REGION MAPPING =====
module.exports.regionMapping = {
  // Miền Bắc
  'HAN': 'hanoi',    // Hà Nội
  'HPH': 'hanoi',    // Hải Phòng
  'THD': 'hanoi',    // Thái Nguyên
  
  // Miền Trung
  'DAD': 'danang',   // Đà Nẵng
  'HUI': 'danang',   // Huế
  'VCL': 'danang',   // Vinh
  
  // Miền Nam
  'SGN': 'saigon',   // TP.HCM
  'PQC': 'saigon',   // Phú Quốc
  'CXR': 'saigon',   // Nha Trang
  'VCA': 'saigon',   // Cần Thơ
  'BMV': 'saigon'    // Buôn Ma Thuột
};

// ===== FRAGMENTATION RULES =====
module.exports.fragmentationRules = {
  // Phân mảnh ngang theo khu vực địa lý
  horizontal: {
    hanoi: {
      condition: "departure_airport IN ('HAN', 'HPH', 'THD') OR arrival_airport IN ('HAN', 'HPH', 'THD')",
      description: "Chuyến bay từ/đến miền Bắc"
    },
    danang: {
      condition: "departure_airport IN ('DAD', 'HUI', 'VCL') OR arrival_airport IN ('DAD', 'HUI', 'VCL')",
      description: "Chuyến bay từ/đến miền Trung"
    },
    saigon: {
      condition: "departure_airport IN ('SGN', 'PQC', 'CXR', 'VCA', 'BMV') OR arrival_airport IN ('SGN', 'PQC', 'CXR', 'VCA', 'BMV')",
      description: "Chuyến bay từ/đến miền Nam"
    }
  },

  // Phân mảnh dẫn xuất (Vé phụ thuộc chuyến bay)
  derived: {
    bookings: {
      rule: "bookings.region = flights.region",
      description: "Vé được lưu cùng site với chuyến bay"
    }
  },

  // Phân mảnh dọc (Thông tin khách hàng và thanh toán)
  vertical: {
    customers: {
      hanoi: "customer_id % 3 = 0",
      danang: "customer_id % 3 = 1", 
      saigon: "customer_id % 3 = 2"
    },
    payments: {
      hanoi: "payment_id % 3 = 0",
      danang: "payment_id % 3 = 1",
      saigon: "payment_id % 3 = 2"
    }
  }
};

// ===== CONNECTION POOL CONFIGURATION =====
module.exports.poolConfig = {
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true
};

// ===== QUERY OPTIMIZATION =====
module.exports.queryOptimization = {
  // Indexes cho performance
  indexes: {
    flights: [
      'PRIMARY KEY (id)',
      'UNIQUE KEY uk_flight_code (flight_code)',
      'KEY idx_departure_airport (departure_airport)',
      'KEY idx_arrival_airport (arrival_airport)',
      'KEY idx_flight_date (flight_date)',
      'KEY idx_status (status)',
      'KEY idx_region (region)',
      'KEY idx_departure_date (departure_airport, flight_date)',
      'KEY idx_arrival_date (arrival_airport, flight_date)'
    ],
    bookings: [
      'PRIMARY KEY (id)',
      'UNIQUE KEY uk_booking_code (booking_code)',
      'KEY idx_flight_id (flight_id)',
      'KEY idx_customer_id (customer_id)',
      'KEY idx_customer_email (customer_email)',
      'KEY idx_status (status)',
      'KEY idx_payment_status (payment_status)',
      'KEY idx_region (region)',
      'KEY idx_created_at (created_at)'
    ],
    customers: [
      'PRIMARY KEY (id)',
      'KEY idx_email (email)',
      'KEY idx_region (region)',
      'KEY idx_created_at (created_at)'
    ]
  },

  // Query hints
  hints: {
    useIndex: 'USE INDEX',
    forceIndex: 'FORCE INDEX',
    ignoreIndex: 'IGNORE INDEX'
  }
};

// ===== REPLICATION CONFIGURATION =====
module.exports.replication = {
  // Master-Slave configuration
  master: {
    hanoi: 'hanoi',
    danang: 'danang', 
    saigon: 'saigon'
  },
  
  // Read replicas
  slaves: {
    hanoi: ['hanoi_read1', 'hanoi_read2'],
    danang: ['danang_read1', 'danang_read2'],
    saigon: ['saigon_read1', 'saigon_read2']
  },

  // Load balancing strategy
  loadBalancing: 'round_robin', // round_robin, least_connections, weighted
  readWriteSplit: true,
  readPreference: 'secondary_preferred'
};

// ===== BACKUP CONFIGURATION =====
module.exports.backup = {
  // Backup schedule
  schedule: '0 2 * * *', // Daily at 2 AM
  retention: 30, // Keep 30 days
  
  // Backup locations
  locations: {
    hanoi: '/backup/hanoi/',
    danang: '/backup/danang/',
    saigon: '/backup/saigon/'
  },

  // Backup methods
  methods: ['mysqldump', 'xtrabackup', 'binary_logs']
};

// ===== MONITORING CONFIGURATION =====
module.exports.monitoring = {
  // Health check intervals
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3
  },

  // Performance metrics
  metrics: {
    connectionPool: true,
    queryPerformance: true,
    replicationLag: true,
    diskUsage: true,
    memoryUsage: true
  },

  // Alerting thresholds
  alerts: {
    connectionPoolUsage: 80, // %
    queryResponseTime: 1000, // ms
    replicationLag: 60,      // seconds
    diskUsage: 85,           // %
    memoryUsage: 90          // %
  }
};

// ===== SECURITY CONFIGURATION =====
module.exports.security = {
  // SSL/TLS configuration
  ssl: {
    enabled: process.env.DB_SSL_ENABLED === 'true',
    cert: process.env.DB_SSL_CERT,
    key: process.env.DB_SSL_KEY,
    ca: process.env.DB_SSL_CA,
    rejectUnauthorized: true
  },

  // Connection encryption
  encryption: {
    enabled: process.env.DB_ENCRYPTION_ENABLED === 'true',
    algorithm: 'aes-256-gcm',
    key: process.env.DB_ENCRYPTION_KEY
  },

  // Access control
  accessControl: {
    allowedIPs: process.env.DB_ALLOWED_IPS ? process.env.DB_ALLOWED_IPS.split(',') : ['127.0.0.1'],
    maxConnectionsPerIP: 5,
    rateLimitPerMinute: 100
  }
};

// ===== CACHING CONFIGURATION =====
module.exports.caching = {
  // Redis configuration for caching
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    ttl: 3600 // 1 hour
  },

  // Cache strategies
  strategies: {
    flights: {
      ttl: 300,      // 5 minutes
      keyPrefix: 'flights:',
      invalidation: 'on_update'
    },
    bookings: {
      ttl: 600,      // 10 minutes
      keyPrefix: 'bookings:',
      invalidation: 'on_update'
    },
    stats: {
      ttl: 60,       // 1 minute
      keyPrefix: 'stats:',
      invalidation: 'scheduled'
    }
  }
};

// ===== POOLS + HELPERS (compat với hướng dẫn quick setup) =====
// Cho phép dùng trực tiếp connection pool: pools['hanoi'|'danang'|'saigon']
const dbConfigs = {
  hanoi: module.exports.hanoi,
  danang: module.exports.danang,
  saigon: module.exports.saigon
};

const pools = {};

Object.keys(dbConfigs).forEach((site) => {
  pools[site] = mysql.createPool({
    ...dbConfigs[site],
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
});

const getConnection = async (site = 'hanoi') => {
  if (!pools[site]) {
    throw new Error(`Invalid site: ${site}`);
  }
  return pools[site];
};

const testConnections = async () => {
  const results = {};
  for (const site of Object.keys(pools)) {
    try {
      const pool = pools[site];
      const [rows] = await pool.execute('SELECT 1 as test');
      results[site] = { status: 'connected', test: rows[0].test };
    } catch (error) {
      results[site] = { status: 'error', message: error.message };
    }
  }
  return results;
};

module.exports.pools = pools;
module.exports.getConnection = getConnection;
module.exports.testConnections = testConnections;
module.exports.dbConfigs = dbConfigs;